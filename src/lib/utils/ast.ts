/**
 * Helful tools for traversing and modifying the typescript (5+) AST
 */

import fs from 'fs';

import * as ts from 'typescript';

/**
 * Updates static import declarations in the given file.
 *
 * @param filename - The filename containing the source code
 * @param oldName - The old module specifier of the import
 * @param newName - The new module specifier for the import
 */
export function renameImportDeclaration(
  filename: string,
  oldName: string,
  newName: string,
) {
  const sourceCode = fs.readFileSync(filename, 'utf8');
  const sourceFile = ts.createSourceFile(
    filename,
    sourceCode,
    ts.ScriptTarget.ESNext,
    true,
  );

  let updatedCode = sourceCode;

  // Traverse the AST
  function visit(node: ts.Node) {
    // Check if the node is an ImportDeclaration
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      if (node.moduleSpecifier.text === oldName) {
        const start = node.moduleSpecifier.getStart(sourceFile);
        const end = node.moduleSpecifier.getEnd();

        // Replace the module specifier while keeping the rest of the import statement intact
        updatedCode =
          updatedCode.substring(0, start + 1) +
          newName +
          updatedCode.substring(end - 1);
      }
    }

    // Continue the traversal
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  fs.writeFileSync(filename, updatedCode, 'utf8');
}

/**
 * Removes all comments from the TypeScript source code of the given file.
 *
 * @param filename - The filename containing the source code
 */
export function removeCommentsFromSource(filename: string): void {
  const sourceCode = fs.readFileSync(filename, 'utf8');
  const sourceFile = ts.createSourceFile(
    filename,
    sourceCode,
    ts.ScriptTarget.ESNext,
    true,
  );

  const transformedSource = ts.transform(sourceFile, [
    removeCommentsTransformer(),
  ]).transformed[0];
  const printer = ts.createPrinter();
  const result = printer.printNode(
    ts.EmitHint.Unspecified,
    transformedSource,
    sourceFile,
  );

  fs.writeFileSync(filename, result, 'utf8');
}

function removeCommentsTransformer<
  T extends ts.Node,
>(): ts.TransformerFactory<T> {
  const createVisit = (context: ts.TransformationContext) => {
    const visit: ts.Visitor = (node) => {
      // Remove the comments from the current node
      ts.setTextRange(node, { pos: node.pos, end: node.end });
      ts.setEmitFlags(node, ts.EmitFlags.NoComments);

      // Use the default visit function to continue visiting other nodes
      return ts.visitEachChild(node, visit, context);
    };
    return ((node: T) => ts.visitNode(node, visit)) as ts.Transformer<T>;
  };
  return createVisit;
}

export type SymbolKind =
  | 'UnhandledSymbolKind'
  | 'FunctionLike'
  | 'Interface'
  | 'Variable'
  | 'Class'
  | 'Property'
  | 'Method'
  | 'Accessor'
  | 'Enum'
  | 'EnumMember'
  | 'TypeAlias';

export type SymbolDetails = {
  name: string;
  documentation?: string;
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
  sourceCode: string;
  link: string;
  parameters?: string[];
  returnType?: string;
  export?: 'normal' | 'default';
  privacy?: 'normal' | 'protected' | 'private' | 'public';
  kind: SymbolKind;
};

export function generateLink(
  filePath: string,
  startLine: number,
  startChar: number,
): string {
  return `${filePath}:${startLine + 1}:${startChar + 1}`; // Adding 1 to match 1-indexing for lines and columns
}

export function getFunctionDetails(
  node: ts.Node,
  checker: ts.TypeChecker,
  signature: ts.Signature,
): {
  parameters: string[];
  returnType: string;
} {
  const parameters = signature.parameters.map((paramSymbol) => {
    const paramName = paramSymbol.getName();
    const paramType = checker.typeToString(
      checker.getTypeOfSymbolAtLocation(
        paramSymbol,
        paramSymbol.valueDeclaration ?? node,
      ),
    );
    return `${paramName}: ${paramType}`;
  });

  const returnType = checker.typeToString(signature.getReturnType());
  return { parameters, returnType };
}

export function analyzeFile(filename: string) {
  const program = ts.createProgram([filename], {});
  const checker = program.getTypeChecker();
  const output: SymbolDetails[] = [];

  function visit(node: ts.Node) {
    const sourceFile = node.getSourceFile();
    const { line: startLine, character: startChar } =
      sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const { line: endLine, character: endChar } =
      sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    const sourceCode = sourceFile.text.substring(
      node.getStart(),
      node.getEnd(),
    );
    const link = generateLink(filename, startLine, startChar);

    let kind: SymbolKind = 'UnhandledSymbolKind';

    if (ts.isFunctionLike(node)) {
      kind = 'FunctionLike';
    }

    if (ts.isInterfaceDeclaration(node)) {
      kind = 'Interface';
    }

    if (ts.isVariableDeclaration(node)) {
      kind = 'Variable';
    }

    if (ts.isTypeAliasDeclaration(node)) {
      kind = 'TypeAlias';
    }

    if (ts.isClassDeclaration(node)) {
      kind = 'Class';
    }

    if (ts.isPropertyDeclaration(node)) {
      kind = 'Property';
    }

    if (ts.isMethodDeclaration(node)) {
      kind = 'Method';
    }

    if (ts.isGetAccessorDeclaration(node)) {
      kind = 'Accessor';
    }

    if (ts.isSetAccessorDeclaration(node)) {
      kind = 'Accessor';
    }

    if (ts.isEnumDeclaration(node)) {
      kind = 'Enum';
    }

    if (ts.isEnumMember(node)) {
      kind = 'EnumMember';
    }

    // Function to handle nodes that could be documented
    function handleDocumentedNode(symbol: ts.Symbol) {
      const documentation = ts.displayPartsToString(
        symbol.getDocumentationComment(checker),
      );
      if (!documentation) {
        return;
      }
      const details: SymbolDetails = {
        name: symbol.name,
        documentation,
        start: { line: startLine, column: startChar },
        end: { line: endLine, column: endChar },
        sourceCode,
        link,
        kind,
      };

      if (ts.isFunctionLike(node)) {
        const signatures = checker
          .getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration ?? node)
          .getCallSignatures();
        if (signatures.length) {
          const { parameters, returnType } = getFunctionDetails(
            node,
            checker,
            signatures[0],
          );
          details.parameters = parameters;
          details.returnType = returnType;
        }
      }

      // The only way I could figure out how to get export and privacy
      // Not going to be perfect

      const nodeText = node.getText();

      if (/^\s*export\s+/.test(nodeText)) {
        details.export = 'normal';
      }

      if (/^\s*export\s+default\s+/.test(nodeText)) {
        details.export = 'default';
      }

      if (/^[a-z\s]*protected\s+/.test(nodeText)) {
        details.privacy = 'protected';
      }

      if (/^[a-z\s]*private\s+/.test(nodeText)) {
        details.privacy = 'private';
      }

      if (/^[a-z\s]*public\s+/.test(nodeText)) {
        details.privacy = 'public';
      }

      output.push(details);
    }

    if (!['FunctionLike', 'UnhandledSymbolKind'].includes(kind)) {
      const children = node.getChildren();
      for (const child of children) {
        const symbol = checker.getSymbolAtLocation(child);
        if (symbol) {
          handleDocumentedNode(symbol);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(program.getSourceFile(filename)!);
  return output;
}

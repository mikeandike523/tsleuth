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

import fs from 'fs';

import ts from 'typescript';
import lodash from 'lodash';

export type ImportantSyntaxKind =
  | ts.SyntaxKind.ClassDeclaration
  | ts.SyntaxKind.PropertyDeclaration
  | ts.SyntaxKind.MethodDeclaration
  | ts.SyntaxKind.Constructor
  | ts.SyntaxKind.InterfaceDeclaration
  | ts.SyntaxKind.TypeAliasDeclaration
  | ts.SyntaxKind.FunctionDeclaration
  | ts.SyntaxKind.FunctionExpression
  | ts.SyntaxKind.ArrowFunction
  | ts.SyntaxKind.EnumDeclaration
  | ts.SyntaxKind.EnumMember
  | ts.SyntaxKind.VariableDeclaration
  | ts.SyntaxKind.SourceFile;

export function isImportantSyntaxKind(
  kind: ts.SyntaxKind
): kind is ImportantSyntaxKind {
  switch (kind) {
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.PropertyDeclaration:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.Constructor:
    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.TypeAliasDeclaration:
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.EnumDeclaration:
    case ts.SyntaxKind.EnumMember:
    case ts.SyntaxKind.VariableDeclaration:
    case ts.SyntaxKind.SourceFile:
      return true;
    default:
      return false;
  }
}

export type StorageQualifier = 'let' | 'var' | 'const' | 'global';

export type AccessQualifier = 'public' | 'private' | 'protected';

export type StaticQualifier = 'static';

export type ExportMode = 'direct' | 'indirect';

export type LineColumnPair = {
  line: number;
  column: number;
};

export type Modifier = {
  kind: ts.SyntaxKind;
  kindName: string;
  text: string;
};

export type ASTNode = {
  kind: ts.SyntaxKind;
  kindName: string;
  narrowKind: ts.SyntaxKind | null;
  narrowKindName: string | null;
  startChar: number;
  endChar: number;
  startLCP: LineColumnPair;
  endLCP: LineColumnPair;
  sourceCode: string; // Does not include doc comment
  documentation: string | null;
  name: string | null;
  storageQualifier: StorageQualifier | null;
  classElementModifiers: Modifier[] | null;
  signatureCode: string | null;
  exported: ExportMode | null;
  id: string;
  tsNode?: ts.Node;
  children: ASTNode[];
  parent: ASTNode | null;
};

export type SerializableASTNode = Omit<ASTNode, 'parent' | 'tsNode'>;

export function walkAST(sourceFilePath: string) {
  const fullSourceCode = fs.readFileSync(sourceFilePath, { encoding: 'utf8' });

  const program = ts.createProgram([sourceFilePath], {
    target: ts.ScriptTarget.ESNext,
    allowJs: true,
    jsx: ts.JsxEmit.React,
  });

  const sourceFile = program.getSourceFile(sourceFilePath);

  if (typeof sourceFile === 'undefined') {
    throw new Error(
      'Could not get source file from program. This is not expected as the `program` object was intantiated with exactly one surce file.'
    );
  }

  const checker = program.getTypeChecker();

  const getLCP = (charPos: number): LineColumnPair => {
    const lineAndCharacter = sourceFile.getLineAndCharacterOfPosition(charPos);
    return {
      line: lineAndCharacter.line,
      column: lineAndCharacter.character,
    };
  };

  const getId = (node: ts.Node): string => {
    const start = node.getStart();
    const end = node.getEnd();
    return `${start}_${end}`;
  };

  const drillForName = (node: ts.Node): string | null => {
    if (node.kind === ts.SyntaxKind.Constructor) {
      return '[[constructor]]';
    }
    for (const child of node.getChildren()) {
      if (child.kind === ts.SyntaxKind.Identifier) {
        return child.getText();
      }
    }
    return null;
  };

  const drillDirectExport = (node: ts.Node): ExportMode | null => {
    for (const child of node.getChildren()) {
      if (child.kind === ts.SyntaxKind.ExportKeyword) {
        return 'direct';
      }
    }
    return null;
  };

  const getDocumentation = (node: ts.Node): string | null => {
    if (node.kind === ts.SyntaxKind.VariableDeclaration) {
      if (node.parent.kind === ts.SyntaxKind.VariableDeclarationList) {
        const decList = node.parent;
        if (decList.parent.kind === ts.SyntaxKind.VariableStatement) {
          return getDocumentation(decList.parent);
        }
      }
    }
    const ranges = ts.getLeadingCommentRanges(fullSourceCode, node.pos);
    if (typeof ranges === 'undefined') {
      return null;
    }
    let documentation: string = '';
    for (const range of ranges) {
      documentation += fullSourceCode.substring(range.pos, range.end);
    }
    return documentation;
  };

  const isDocumented = (node: ts.Node): boolean => {
    return getDocumentation(node) !== null;
  };

  const getStorageQualifierFromVariableStatement = (node: ts.Node) => {
    const nodeSourceCode = sourceFile
      .getText()
      .substring(node.getStart(), node.getEnd());
    const trimmed = nodeSourceCode.trim();
    if (trimmed.startsWith('let')) {
      return 'let';
    }
    if (trimmed.startsWith('var')) {
      return 'var';
    }
    if (trimmed.startsWith('const')) {
      return 'const';
    }
    return 'global';
  };

  const getStorageQualifier = (node: ts.Node): StorageQualifier | null => {
    if (node.kind == ts.SyntaxKind.VariableDeclaration) {
      if (node.parent.kind == ts.SyntaxKind.VariableDeclarationList) {
        if (node.parent.parent.kind == ts.SyntaxKind.VariableStatement) {
          return getStorageQualifierFromVariableStatement(node.parent.parent);
        }
      }
    }
    return null;
  };

  const drillForPotentialFunction = (node: ts.Node): ts.Node | null => {
    if (
      node.kind !== ts.SyntaxKind.FunctionExpression &&
      node.kind !== ts.SyntaxKind.ArrowFunction &&
      node.kind !== ts.SyntaxKind.VariableDeclaration
    ) {
      return null;
    }
    if (node.kind === ts.SyntaxKind.VariableDeclaration) {
      let result: ts.Node | null = null;
      for (const child of node.getChildren()) {
        const childResult = drillForPotentialFunction(child);
        if (childResult !== null) {
          result = childResult;
        }
      }
      return result;
    }
    if (
      node.kind === ts.SyntaxKind.FunctionExpression ||
      node.kind === ts.SyntaxKind.ArrowFunction
    ) {
      return node;
    }
    return node;
  };

  const signatureFromFunctionNode = (node: ts.Node): string | null => {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node)
    ) {
      const signature = checker.getSignatureFromDeclaration(node);
      if (signature) {
        return checker.signatureToString(signature);
      }
    }
    return null;
  };

  const getClassElementModifiers = (node: ts.Node): Modifier[] | null => {
    if (ts.isClassElement(node)) {
      if (ts.isPropertyDeclaration(node) || ts.isMethodDeclaration(node)) {
        if (typeof node.modifiers !== 'undefined') {
          return node.modifiers.map((modifier) => {
            return {
              kind: modifier.kind,
              kindName: ts.SyntaxKind[modifier.kind],
              text: modifier.getText(),
            };
          });
        }
      }
    }
    return null;
  };

  const nodes: Map<string, ASTNode> = new Map();

  const visitor = (node: ts.Node) => {
    if (isImportantSyntaxKind(node.kind)) {
      // In the future, may want this to be a commad line option
      // if (!isDocumented(node)) {
      //   return;
      // }
      const nodeToAdd: ASTNode = {
        tsNode: node,
        kind: node.kind,
        kindName: ts.SyntaxKind[node.kind],
        narrowKind: null,
        narrowKindName: null,
        startChar: node.getStart(),
        endChar: node.getEnd(),
        startLCP: getLCP(node.getStart()),
        endLCP: getLCP(node.getEnd()),
        sourceCode: fullSourceCode.slice(node.getStart(), node.getEnd()),
        documentation: getDocumentation(node),
        name: drillForName(node),
        storageQualifier: getStorageQualifier(node),
        signatureCode: signatureFromFunctionNode(node),
        exported: drillDirectExport(node),
        classElementModifiers: getClassElementModifiers(node),
        id: getId(node),
        children: [],
        parent: null,
      };

      if (node.kind === ts.SyntaxKind.VariableDeclaration) {
        const potentialFunction = drillForPotentialFunction(node);
        if (potentialFunction !== null) {
          nodeToAdd.tsNode = potentialFunction;
          nodeToAdd.narrowKind = potentialFunction.kind;
          nodeToAdd.narrowKindName = ts.SyntaxKind[potentialFunction.kind];
          nodeToAdd.signatureCode =
            signatureFromFunctionNode(potentialFunction);
        }
      }

      nodes.set(getId(node), nodeToAdd);
    }
    node.forEachChild(visitor);
  };

  visitor(sourceFile);

  const isChildOf = (
    potentialChild: ASTNode,
    potentialParent: ASTNode
  ): boolean => {
    const childTsNode = potentialChild.tsNode;
    const parentTsNode = potentialParent.tsNode;
    if (
      typeof childTsNode === 'undefined' ||
      typeof parentTsNode === 'undefined'
    ) {
      return false;
    }

    const sourceFileId = getId(sourceFile);

    if (getId(parentTsNode) === sourceFileId) {
      return true;
    }

    let toCheck = childTsNode.parent;
    if (toCheck && getId(toCheck) === getId(parentTsNode)) {
      return true;
    }
    while (toCheck && getId(toCheck) !== sourceFileId) {
      if (getId(toCheck) === getId(parentTsNode)) {
        return true;
      }
      toCheck = toCheck.parent;
    }
    return false;
  };

  const hasChildById = (node: ASTNode, potentialChild: ASTNode): boolean => {
    return node.children.some((child) => {
      child.id === potentialChild.id;
    });
  };

  // Second pass to detect indirect exports
  // Very difficult since parsing export declarations/statements (even by ast traversal) is very complex
  // @todo

  let root: ASTNode | null = null;

  for (const node of Array.from(nodes.values())) {
    if (node.kind === ts.SyntaxKind.SourceFile) {
      root = node;
      break;
    }
  }

  if (root !== null) {
    for (const key of Array.from(nodes.keys())) {
      const node = nodes.get(key)!;
      if (node.kind === ts.SyntaxKind.SourceFile) {
        continue;
      }
      for (const compareKey of Array.from(nodes.keys())) {
        if (compareKey === key) {
          continue;
        }
        const compareNode = nodes.get(compareKey)!;
        if (isChildOf(node, compareNode)) {
          node.parent = compareNode;
          if (!hasChildById(compareNode, node)) {
            compareNode.children.push(node);
          }
        }
      }
    }
  }

  const cleanNode = (node: ASTNode): SerializableASTNode => {
    const clean = lodash.omit(node, ['tsNode', 'parent', 'children']);
    Object.assign(clean, {
      children: node.children.map((child) => cleanNode(child)),
    });
    return clean as SerializableASTNode;
  };

  return {
    path: sourceFilePath,
    fullSourceCode,
    root: root !== null ? cleanNode(root) : null,
  };
}

export type ASTIntermediate = ReturnType<typeof walkAST>;

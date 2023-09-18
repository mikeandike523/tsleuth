import path from 'path';

import ts from 'typescript';

import {
  SourceFileInfo,
  NodeInfo,
  NodeKind,
  SourceCodePosition,
  isFunctionLikeNodeKind,
} from '<^w^>/lib/ast-parsing/types';

/**
 *
 * Computes a uuid for a node by simply combining its start and end characters
 *
 * @param node
 */
export function getId(node: ts.Node): string {
  return `${node.getStart()}_${node.getEnd()}`;
}

/**
 *
 * If a particuilar AST node is of interest, return which `NodeKind` (a custom lightweight analog of ts.SyntaxKind) it is, or return `undefined`
 *
 * @param node
 *
 */
export function getNodeKind(node: ts.Node): NodeKind | undefined {
  switch (node.kind) {
    case ts.SyntaxKind.VariableDeclaration:
      return 'VariableDecl';
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.FunctionExpression:
      return 'FunctionDecl';
    case ts.SyntaxKind.ClassDeclaration:
      return 'Class';
    case ts.SyntaxKind.InterfaceDeclaration:
      return 'Interface';
    case ts.SyntaxKind.EnumDeclaration:
      return 'Enum';
    case ts.SyntaxKind.EnumMember:
      return 'EnumMember';
    case ts.SyntaxKind.PropertyDeclaration:
      return 'Property';
    case ts.SyntaxKind.MethodDeclaration:
      return 'Method';
    case ts.SyntaxKind.TypeAliasDeclaration:
      return 'TypeAlias';
    case ts.SyntaxKind.Constructor:
      return 'Constructor';
    case ts.SyntaxKind.GetAccessor:
      return 'GetAccessor';
    case ts.SyntaxKind.SetAccessor:
      return 'SetAccessor';
    default:
      return undefined;
  }
}

/**
 * A more lightweight version of the NodeInfo type, useful for retaining start, end, name, and comment information while drilling up and down
 */
export type TraversalEntity = {
  tsNode?: ts.Node;
  id: string;
  kind?: NodeKind | undefined;
  name?: string;
  start: number;
  end: number;
  docstring?: string;
  signatureSourcecode?: string;
};

/**
 *
 * Going to have a 2 pass system. First pass find all the significant entiteis with their names and documentations, second pass goes through again to find out the semantic hierarchy (i.e., which methiods or properties belogn to which class, interface, or type alias, etc)
 *
 * @param sourceFileInfo
 */
export function walkAST(sourceFileInfo: SourceFileInfo) {
  const program = ts.createProgram([sourceFileInfo.absolutePath], {});
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(sourceFileInfo.absolutePath);
  if (!sourceFile) {
    throw new Error(
      `Could not find source file ${sourceFileInfo.absolutePath}`
    );
  }

  const sourceFileId = getId(sourceFile);

  const coverageMap = new Map<string, TraversalEntity>();

  const getName = (node: ts.Node): string | undefined => {
    const sym = checker.getSymbolAtLocation(node);
    if (!sym) {
      return undefined;
    }
    return sym.getName();
  };

  const getSignatureSourceCode = (node: ts.Node): string | undefined => {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node)
    ) {
      const signature = checker.getSignatureFromDeclaration(node);
      if (!signature) {
        return undefined;
      }
      return checker.signatureToString(signature);
    }
    return undefined;
  };

  const getDocumentation = (node: ts.Node): string | undefined => {
    const withDocstring = node.getFullText().trim();
    const withoutDocstring = node.getText().trim();

    if (withoutDocstring === withDocstring) {
      return undefined;
    }

    if (!withDocstring.endsWith(withoutDocstring)) {
      return undefined;
    }

    const docstring = withDocstring.slice(0, -withoutDocstring.length).trim();

    return docstring || undefined;
  };

  const isDocumented = (node: ts.Node): boolean => {
    return (getDocumentation(node)?.length ?? 0) > 0;
  };

  const getLineColumn = (position: number): SourceCodePosition => {
    return {
      line: sourceFile.getLineAndCharacterOfPosition(position).line,
      column: sourceFile.getLineAndCharacterOfPosition(position).character,
    };
  };

  const visitor = (node: ts.Node) => {
    const nodeId = getId(node);
    if (coverageMap.has(nodeId)) {
      return;
    }

    const nodeKind = getNodeKind(node);

    if (typeof nodeKind !== 'undefined') {
      const name = getName(node);
      const start = node.getStart();
      const end = node.getEnd();
      const docstring = getDocumentation(node);
      coverageMap.set(nodeId, {
        tsNode: node,
        id: nodeId,
        kind: nodeKind,
        name,
        start,
        end,
        docstring,
      });
      const link = `${sourceFileInfo.absolutePath}:${start + 1}:${end + 1}`;
      const nodeInfo: NodeInfo = {
        start: getLineColumn(start),
        end: getLineColumn(end),
        kind: nodeKind,
        name,
        documentation: docstring,
        children: [],
        tsKindString: `${ts.SyntaxKind[node.kind]} (${node.kind})`,
        link,
        sourceCode: sourceFile.text.substring(start, end),
      };
      if (isDocumented(node)) {
        sourceFileInfo.root.children.push(nodeInfo);
      }
      if (isFunctionLikeNodeKind(nodeKind)) {
        nodeInfo.signatureSourceCode = getSignatureSourceCode(node);
      }
    }

    ts.forEachChild(node, visitor);
  };

  // First Pass
  ts.forEachChild(sourceFile, visitor);

  // Second pass:
  // @todo
}

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

  const coverageMap = new Map<string, NodeInfo>();

  const originatorMap = new Map<string, ts.Node>();

  const getName = (node: ts.Node): string | undefined => {
    if (node.kind === ts.SyntaxKind.Constructor) {
      return '[constructor]';
    }

    const sym = checker.getSymbolAtLocation(node);

    if (!sym) {
      const children = node.getChildren();
      for (const child of children) {
        if (child.kind === ts.SyntaxKind.Identifier) {
          return child.getText();
        }
      }
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

      const nodeInfo: NodeInfo = {
        tsKindShort: ts.SyntaxKind[node.kind],
        uuid: nodeId,
        startChar: start,
        endChar: end,
        kind: nodeKind,
        name,
        documentation: docstring,
        children: [],
        tsKindString: `${ts.SyntaxKind[node.kind]} (${node.kind})`,
        sourceCode: sourceFile.text.substring(start, end),
        nameChain: [],
        uuidChain: [],
      };
      if (isFunctionLikeNodeKind(nodeKind)) {
        nodeInfo.signatureSourceCode = getSignatureSourceCode(node);
      }
      if (typeof docstring !== 'undefined' && docstring.trim().length > 0) {
        sourceFileInfo.root.children.push(nodeInfo);
        coverageMap.set(nodeId, nodeInfo);
        originatorMap.set(nodeId, node);
      }
    }

    ts.forEachChild(node, visitor);
  };

  // First Pass
  ts.forEachChild(sourceFile, visitor);

  // Function to associate parenthood
  const drillUp = (nodeInfo: NodeInfo, originator: ts.Node) => {
    let parent: ts.Node = originator.parent;
    while (getId(parent) !== getId(sourceFile)) {
      if (coverageMap.has(getId(parent))) {
        const parentInfo = coverageMap.get(getId(parent))!;
        const existingChildrenIds = parentInfo.children.map((nI) => {
          return nI.uuid;
        });
        if (!existingChildrenIds.includes(nodeInfo.uuid)) {
          parentInfo.children.push(nodeInfo);
        }
      }
      parent = parent.parent;
    }
  };

  // Second pass
  const uuids = Array.from(coverageMap.keys());
  for (const uuid of uuids) {
    const nodeInfo = coverageMap.get(uuid)!;
    const originator = originatorMap.get(uuid)!;
    drillUp(nodeInfo, originator);
  }

  // Third pass
  // propogate prefixes
  const propogatePrefixes = (nodeInfo: NodeInfo) => {
    for (const childInfo of nodeInfo.children) {
      const nameString = nodeInfo.name ?? '<no-name>';
      const nameChain = [...nodeInfo.nameChain, nameString];
      const uuidChain = [...nodeInfo.uuidChain, nodeInfo.uuid];
      childInfo.nameChain = nameChain;
      childInfo.uuidChain = uuidChain;

      propogatePrefixes(childInfo);
    }
  };

  for (const topLevelNodeInfo of sourceFileInfo.root.children) {
    propogatePrefixes(topLevelNodeInfo);
  }
}

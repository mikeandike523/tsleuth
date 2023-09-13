import path from 'path';

import ts from 'typescript';

import {
  SourceFileInfo,
  NodeInfo,
  NodeKind,
  SourceCodePosition,
} from '<^w^>/lib/ast-parsing/types';

/**
 *
 * Walks the typescript AST extraction symbol and documentation info
 *
 * @param sourceFileInfo
 * @returns
 */
export function walkAST(sourceFileInfo: SourceFileInfo) {
  // Setup the ast parsing api
  const program = ts.createProgram([sourceFileInfo.absolutePath], {});
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(sourceFileInfo.absolutePath);
  if (!sourceFile) {
    throw new Error(
      `Could not find source file ${sourceFileInfo.absolutePath}`
    );
  }

  const getDocumentation = (node: ts.Node): string | undefined => {
    const symbol = checker.getSymbolAtLocation(node);
    if (!symbol) {
      return undefined;
    }
    const result = ts
      .displayPartsToString(symbol.getDocumentationComment(checker))
      .trim();
    return result;
  };
  const isDocumented = (node: ts.Node) => {
    const docs = getDocumentation(node);
    return typeof docs !== 'undefined' && docs.length > 0;
  };
  const getName = (node: ts.Node): string | undefined => {
    const symbol = checker.getSymbolAtLocation(node);
    if (!symbol) {
      return undefined;
    }
    return symbol.getName();
  };

  const extract = (
    node: ts.Node,
    containingNodeInfo: NodeInfo | undefined = undefined,
    knownDocumentation: string | undefined = undefined,
    knownName: string | undefined = undefined
  ) => {
    if (
      path.resolve(node.getSourceFile().fileName) !==
      path.resolve(sourceFileInfo.absolutePath)
    ) {
      return;
    }
    let kind: NodeKind | undefined = undefined;
    switch (node.kind) {
      case ts.SyntaxKind.VariableStatement:
      case ts.SyntaxKind.VariableDeclaration:
        kind = 'Variable';
        break;
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.FunctionExpression:
        kind = 'Function';
        break;
      case ts.SyntaxKind.ClassDeclaration:
        kind = 'Class';
        break;
      case ts.SyntaxKind.InterfaceDeclaration:
        kind = 'Interface';
        break;
      case ts.SyntaxKind.EnumDeclaration:
        kind = 'Enum';
        break;
      case ts.SyntaxKind.EnumMember:
        kind == 'EnumMember';
        break;
      case ts.SyntaxKind.PropertyDeclaration:
        kind = 'Property';
        break;
      case ts.SyntaxKind.MethodDeclaration:
        kind = 'Method';
        break;
      case ts.SyntaxKind.TypeAliasDeclaration:
        kind = 'TypeAlias';
        break;
    }
    if (kind !== undefined) {
      const startChar = node.getStart();
      const endChar = node.getEnd();
      const start: SourceCodePosition = {
        line: sourceFile.getLineAndCharacterOfPosition(startChar).line,
        column: sourceFile.getLineAndCharacterOfPosition(startChar).character,
      };
      const end: SourceCodePosition = {
        line: sourceFile.getLineAndCharacterOfPosition(endChar).line,
        column: sourceFile.getLineAndCharacterOfPosition(endChar).character,
      };
      const nodeInfo: NodeInfo = {
        name: knownName,
        documentation: knownDocumentation,
        tsKindString: ts.SyntaxKind[node.kind] + ' ' + `(${node.kind})`,
        kind,
        isMemberOfClass:
          containingNodeInfo?.kind === 'Class' ||
          (containingNodeInfo?.isMemberOfClass ?? false),
        children: [],
        start,
        end,
        sourceCode: sourceFile.text.substring(startChar, endChar),
        link: `${sourceFileInfo.absolutePath}:${start.line + 1}:${
          start.column + 1
        }`,
      };
      containingNodeInfo?.children.push(nodeInfo);
      return nodeInfo;
    }
    return undefined;
  };

  const drill = (
    node: ts.Node,
    containingNodeInfo: NodeInfo | undefined,
    knownDocumentation: string | undefined = undefined,
    knownName: string | undefined = undefined
  ): NodeInfo | undefined => {
    const nodeInfo = extract(node, containingNodeInfo, knownDocumentation);
    if (typeof nodeInfo !== 'undefined') {
      return nodeInfo;
    }
    for (const child of node.getChildren()) {
      const result = drill(
        child,
        containingNodeInfo,
        knownDocumentation,
        knownName
      );
      if (typeof result !== 'undefined') {
        return result;
      }
    }
    return undefined;
  };

  const visitor = (node: ts.Node) => {
    if (isDocumented(node)) {
      // So, this is crazy, but the token that is actually documented is some minor token, like a keyword or identifier, so we go one up to its parent, and generally speaking that should work to get something we can drill into to find a SIGNIFICANT node
      // We take the documentation we got and save it until we find something significant
      // Approach is not perfect but thats why I got

      // @todo: right now, all classes, interfaces, aliases, and properties are lifted up to be the direct children of the source file/top level. This is not correct. I need to implement feature that certain syntax kinds (i.e. class, interfaces, type alias, variable statement (because it may hold a function expression), need to change what the parent nodeInfo object is so we can retain hierarchy information. Basically, some documented items are children of other documented items instead of just the top level)
      // @todo: I could not find an uuid associated with a node, and just storing the names in a list is not enough due to scoping. As far as I can tell, using a getStart() and getEnd() pair can serve to dedupe, so I need to implement this next. I'm not sure what situation can lead to duplicates but I don't want to take any chances
      drill(
        node.parent,
        sourceFileInfo.root,
        getDocumentation(node),
        getName(node)
      );
    }
    ts.forEachChild(node, visitor);
  };

  visitor(sourceFile);
}

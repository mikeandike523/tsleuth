import fs from 'fs';

import ts from 'typescript';
import lodash from 'lodash';

import { getDocComments } from '@common/text';

export const importantSyntaxKinds = [
  ts.SyntaxKind.ClassDeclaration,
  ts.SyntaxKind.PropertyDeclaration,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.Constructor,
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.TypeAliasDeclaration,
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.EnumDeclaration,
  ts.SyntaxKind.EnumMember,
  ts.SyntaxKind.VariableDeclaration,
  ts.SyntaxKind.SourceFile,
] as const;

export type ImportantSyntaxKind = (typeof importantSyntaxKinds)[number];

export function isImportantSyntaxKind(
  kind: ts.SyntaxKind
): kind is ImportantSyntaxKind {
  return importantSyntaxKinds.includes(kind as number);
}

export const importantSyntaxKindsOnlyIfDocumented = [
  ts.SyntaxKind.PropertyAssignment,
] as const;

export type ImportantSyntaxKindOnlyIfDocumented =
  (typeof importantSyntaxKindsOnlyIfDocumented)[number];

export function isImportantSyntaxKindOnlyIfDocumented(
  kind: ts.SyntaxKind
): kind is ImportantSyntaxKindOnlyIfDocumented {
  return importantSyntaxKindsOnlyIfDocumented.includes(kind as number);
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
  sourceCode: string;
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

export type SerializableASTNode = Omit<
  ASTNode,
  'parent' | 'tsNode' | 'children'
> & {
  children: SerializableASTNode[];
};

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
      'Could not get source file from program. This is not expected as the `program` object was instantiated with exactly one source file.'
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
      if (child.kind === ts.SyntaxKind.SyntaxList) {
        for (const subchild of child.getChildren()) {
          if (subchild.kind === ts.SyntaxKind.ExportKeyword) {
            return 'direct';
          }
        }
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
      documentation +=
        fullSourceCode.substring(range.pos, range.end).trim() + '\n';
    }
    documentation = documentation.replace(/\r?\n/g, '\n');

    // Remove eslint disable next line comments

    documentation = documentation.replace(
      /^\s*?\/\/\s*?eslint-disable-next-line.*?$/gm,
      ''
    );

    documentation = documentation.trim();
    const allComments = getDocComments(documentation);

    if (allComments.length >= 1) {
      return allComments.pop() ?? null;
    }

    return null;
  };

  const isDocumented = (node: ts.Node): boolean => {
    return (
      getDocumentation(node) !== null &&
      (getDocumentation(node) ?? '').trim() !== ''
    );
  };

  const getStorageQualifierFromVariableStatement = (node: ts.Node) => {
    const nodeSourceCode = node.getText();
    const trimmed = nodeSourceCode.trim();
    const rgx = new RegExp('^(.*?)=.*?');
    const match = rgx.exec(trimmed);
    if (match === null) {
      return 'global';
    }
    const captured = match[1].toLowerCase();
    if (captured.includes(`const`)) {
      return 'const';
    }
    if (captured.includes(`let`)) {
      return 'let';
    }
    if (captured.includes(`var`)) {
      return 'var';
    }
    return 'global';
  };

  const getStorageQualifier = (node: ts.Node): StorageQualifier | null => {
    let current = node;
    while (current.parent as ts.Node | null | undefined) {
      if (current.parent?.kind !== ts.SyntaxKind.SourceFile) {
        if (current.parent?.kind === ts.SyntaxKind.VariableStatement) {
          return getStorageQualifierFromVariableStatement(current.parent);
        } else {
          current = current.parent as ts.Node;
        }
      } else {
        return null;
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

  const nodes: Map<string, ASTNode> = new Map();
  const covered: Set<string> = new Set();

  const approveInclusionOfSymbol = (
    node: ts.Node,
    forceIfDocumented: boolean = false
  ): boolean => {
    if (forceIfDocumented && isDocumented(node) && !covered.has(getId(node))) {
      return true;
    }

    if (node.kind === ts.SyntaxKind.SourceFile) {
      return true;
    }

    if (
      !isImportantSyntaxKind(node.kind) &&
      !(isDocumented(node) && isImportantSyntaxKindOnlyIfDocumented(node.kind))
    ) {
      return false;
    }

    const symbolName = drillForName(node);
    if (symbolName === null || symbolName.trim() === '') {
      return false;
    }

    if (isDocumented(node)) {
      return true;
    }

    if (node.kind === ts.SyntaxKind.VariableDeclaration) {
      if (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile) {
        return true;
      }

      if (node.parent && node.parent.kind === ts.SyntaxKind.VariableStatement) {
        if (
          node.parent.parent &&
          node.parent.parent.kind === ts.SyntaxKind.SourceFile
        ) {
          return true;
        }
      }
      if (
        node.parent &&
        node.parent.kind === ts.SyntaxKind.VariableDeclarationList
      ) {
        if (
          node.parent.parent &&
          node.parent.parent.kind === ts.SyntaxKind.VariableStatement
        ) {
          if (
            node.parent.parent.parent &&
            node.parent.parent.parent.kind === ts.SyntaxKind.SourceFile
          ) {
            return true;
          }
        }
      }
    } else {
      if (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile) {
        return true;
      }
    }

    if (node.kind === ts.SyntaxKind.EnumMember) {
      return true;
    }

    if (node.kind === ts.SyntaxKind.PropertyDeclaration) {
      return true;
    }

    if (node.kind === ts.SyntaxKind.MethodDeclaration) {
      return true;
    }

    if (node.kind === ts.SyntaxKind.Constructor) {
      return true;
    }

    // If all else falls through, do not include the symbol
    return false;
  };

  const visitor = (node: ts.Node, forceIfDocumented: boolean = false) => {
    if (approveInclusionOfSymbol(node, forceIfDocumented)) {
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
          covered.add(getId(potentialFunction));
        }
      }
      if (!covered.has(getId(node))) {
        covered.add(getId(node));
        nodes.set(getId(node), nodeToAdd);
      }
    }

    node.forEachChild((n: ts.Node) => {
      visitor(n, forceIfDocumented);
    });
  };

  visitor(sourceFile);

  const setNodeToIndirectExportByName = (nodeName: string): void => {
    const keys = Array.from(nodes.keys());
    for (const key of keys) {
      const item = nodes.get(key)!;
      if (item.name === nodeName) {
        item.exported = 'indirect';
      }
    }
  };

  const exportVisitor = (node: ts.Node) => {
    if (node.kind === ts.SyntaxKind.ExportSpecifier) {
      for (const child of node.getChildren()) {
        if (child.kind === ts.SyntaxKind.Identifier) {
          setNodeToIndirectExportByName(child.getText());
          break;
        }
      }
    }
    ts.forEachChild(node, exportVisitor);
  };

  exportVisitor(sourceFile);

  let root: ASTNode | null = null;

  for (const node of Array.from(nodes.values())) {
    if (node.kind === ts.SyntaxKind.SourceFile) {
      root = node;
      break;
    }
  }

  if (root) {
    root.children = Array.from(nodes.values());
  }

  const computeParentage = (node: ASTNode): void => {
    const childrenMap = new Map<string, ASTNode>();
    const filteredMap = new Map<string, ASTNode>();
    for (const child of node.children) {
      if (root && child.id !== root.id) {
        childrenMap.set(child.id, child);
        filteredMap.set(child.id, child);
      }
    }
    const keys = Array.from(childrenMap.keys());
    for (const filterKey of keys) {
      for (const testKey of keys) {
        if (root && testKey === root.id) {
          continue;
        }
        if (filteredMap.get(filterKey)) {
          const filterNode = filteredMap.get(filterKey)!;
          const testNode = childrenMap.get(testKey)!;
          if (isChildOf(filterNode, testNode)) {
            filterNode.parent = testNode;
            testNode.children.push(filterNode);
            filteredMap.delete(filterKey);
          }
        }
      }
    }
    node.children = Array.from(filteredMap.values());
    for (const child of node.children) {
      computeParentage(child);
    }
  };

  if (root) {
    computeParentage(root);
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

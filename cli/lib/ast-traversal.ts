import fs from 'fs';

import ts from 'typescript';

export type ImportantSyntaxKind =
  | ts.SyntaxKind.ClassDeclaration
  | ts.SyntaxKind.PropertyDeclaration
  | ts.SyntaxKind.MethodDeclaration
  | ts.SyntaxKind.InterfaceDeclaration
  | ts.SyntaxKind.TypeAliasDeclaration
  | ts.SyntaxKind.FunctionDeclaration
  | ts.SyntaxKind.FunctionExpression
  | ts.SyntaxKind.ArrowFunction
  | ts.SyntaxKind.EnumDeclaration
  | ts.SyntaxKind.EnumMember;

export type ImportantSyntaxKindSpecialCase =
  | ts.SyntaxKind.VariableStatement
  | ts.SyntaxKind.VariableDeclaration
  | ts.SyntaxKind.ExportDeclaration;

export function isImportantSyntaxKind(
  kind: ts.SyntaxKind
): kind is ImportantSyntaxKind {
  switch (kind) {
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.PropertyDeclaration:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.TypeAliasDeclaration:
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.EnumDeclaration:
    case ts.SyntaxKind.EnumMember:
      return true;
    default:
      return false;
  }
}

export function isImportantSyntaxKindSpecialCase(
  kind: ts.SyntaxKind
): kind is ImportantSyntaxKindSpecialCase {
  return (
    kind === ts.SyntaxKind.VariableStatement ||
    kind === ts.SyntaxKind.VariableDeclaration
  );
}

export type StorageQualifier = 'let' | 'var' | 'const';

export type AccessQualifier = 'public' | 'private' | 'protected';

export type ExportMode = 'direct' | 'indirect';

export type LineColumnPair = {
  line: number;
  column: number;
};

export type ASTNode = {
  kind: ts.SyntaxKind;
  kindName: string;
  startChar: number;
  endChar: number;
  startLCP: LineColumnPair;
  endLCP: LineColumnPair;
  sourceCode: string; // Does not include doc comment
  documentation: string | null;
  name: string | null;
  storageQualifier: StorageQualifier | null;
  accessQualifier: AccessQualifier | null;
  signatureCode: string | null;
  exported: ExportMode | null;
};

export function walkAST(sourceFilePath: string) {
  const fullSourceCode = fs.readFileSync(sourceFilePath, { encoding: 'utf8' });
  const sourceFile = ts.createSourceFile(
    sourceFilePath,
    fullSourceCode,
    ts.ScriptTarget.ESNext,
    true
  );

  const getLCP = (charPos: number): LineColumnPair => {
    const lineAndCharacter = sourceFile.getLineAndCharacterOfPosition(charPos);
    return {
      line: lineAndCharacter.line,
      column: lineAndCharacter.character,
    };
  };

  const drillForName = (node: ts.Node): string | null => {
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

  const nodes: ASTNode[] = [];

  const visitor = (node: ts.Node) => {
    if (isImportantSyntaxKind(node.kind)) {
      if (!isDocumented(node)) {
        return;
      }
      nodes.push({
        kind: node.kind,
        kindName: ts.SyntaxKind[node.kind],
        startChar: node.getStart(),
        endChar: node.getEnd(),
        startLCP: getLCP(node.getStart()),
        endLCP: getLCP(node.getEnd()),
        sourceCode: fullSourceCode.slice(node.getStart(), node.getEnd()),
        documentation: getDocumentation(node),
        name: drillForName(node),
        storageQualifier: null,
        accessQualifier: null,
        signatureCode: null,
        exported: drillDirectExport(node),
      });
    }
    node.forEachChild(visitor);
  };

  visitor(sourceFile);

  return {
    path: sourceFilePath,
    fullSourceCode,
    nodes,
  };
}

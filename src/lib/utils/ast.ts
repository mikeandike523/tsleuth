/**
 * Helful tools for traversing and modifying the typescript (5+) AST
 */

import * as ts from 'typescript';
import fs from 'fs';

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

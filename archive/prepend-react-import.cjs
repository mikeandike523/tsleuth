module.exports = function (babel) {
  const { types: t } = babel;

  return {
    name: 'prepend-react-import',
    visitor: {
      Program(path, state) {
        // Check if this is a .tsx file
        if (/\.tsx?$/.test(state.file.opts.filename)) {
          // Create an AST node for 'import React from "react"'
          const importDeclaration = t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier('React'))],
            t.stringLiteral('react')
          );

          // Check if React is already imported in this file
          const alreadyHasReactImport = path.node.body.some((node) => {
            return (
              t.isImportDeclaration(node) &&
              node.source.value === 'react' &&
              node.specifiers.some(
                (specifier) =>
                  t.isImportDefaultSpecifier(specifier) &&
                  specifier.local.name === 'React'
              )
            );
          });

          // Only prepend the import if it doesn't already exist
          if (!alreadyHasReactImport) {
            path.unshiftContainer('body', importDeclaration);
          }
        }
      },
    },
  };
};

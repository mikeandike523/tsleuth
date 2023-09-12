import React from 'react';

import ReactDOMServer from 'react-dom/server';
import prettier from 'prettier';

import { SymbolDetails } from '<^w^>/lib/utils/ast';
import { Container } from '<^w^>/ui/components/common/container';
import { MainLayout as ChildPageMainLayout } from '<^w^>/ui/components/child-page/main-layout';

/**
 *
 * The final step in the site generation process, this takes in the AST data for a single page and renders the actual HTML
 *
 * @param root
 * @param crumbs - The path from the root to the file, includes the file basename
 * @param ast
 */
export function astToHTML(
  root: string,
  crumbs: string[],
  ast: SymbolDetails[],
  outputDir: string
) {
  const page = (
    <Container>
      <ChildPageMainLayout
        outDir={outputDir.replace(/\\/g, '/')}
        crumbs={crumbs}
        symbols={ast}
      />
    </Container>
  );

  const finalRenderedString = ReactDOMServer.renderToString(page);

  `
  <!DOCTYPE html>
  <html lang="en">
  <body style="margin:0;padding:0;overflow:auto">
  ${finalRenderedString}
  </body>
  </html>
  
  `;
  return finalRenderedString;
}

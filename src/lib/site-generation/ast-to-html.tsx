import React from 'react';

import ReactDOMServer from 'react-dom/server';
import prettier from 'prettier';

import { SymbolDetails } from '<^w^>/lib/utils/ast';
import { Container } from '<^w^>/ui/components/common/container';

/**
 *
 * The final step in the site generation process, this takes in the AST data for a single page and renders the actual HTML
 *
 * @param root
 * @param crumbs - The path from the root to the file, includes the file basename
 * @param ast
 */
export async function astToHTML(
  root: string,
  crumbs: string[],
  ast: SymbolDetails[]
) {
  const page = (
    <Container>
      <>placeholder content</>
    </Container>
  );

  const finalRenderedString = ReactDOMServer.renderToString(page);

  return await prettier.format(
    `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <base href="${root}" />
  </head>
  <body style="margin:0;padding:0;overflow:auto">
  ${finalRenderedString}
  </body>
  </html>
  
  `,
    { parser: 'html' }
  );
}

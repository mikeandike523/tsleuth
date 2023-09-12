import React from 'react';

import ReactDOMServer from 'react-dom/server';
import prettier from 'prettier';

import { SymbolDetails } from '<^w^>/lib/utils/ast';
import { Container } from '<^w^>/ui/components/common/container';
import { MainLayout as IndexPageMainLayout } from '<^w^>/ui/components/index-page/main-layout';

import { mainCss } from '<^w^>/ui/components/main-css';

/**
 *
 * The final step in the site generation process, this takes in the AST data for a single page and renders the actual HTML
 *
 * @param root
 * @param crumbs - The path from the root to the file, includes the file basename
 * @param ast
 */
export function listingToHTML(
  root: string,
  crumbs: string[],
  listing: {
    name: string;
    isLeaf: boolean;
  }[],
  outputDir: string
) {
  const page = (
    <Container>
      <IndexPageMainLayout
        crumbs={crumbs}
        listing={listing}
        outDir={outputDir}
      />
    </Container>
  );

  const finalRenderedString = ReactDOMServer.renderToString(page);

  return `
  <!DOCTYPE html>
  <html lang="en">
  


  <body style="margin:0;padding:0;overflow:auto">
  <style>
  ${mainCss}
  </style>
  ${finalRenderedString}
  </body>
  </html>
  
  `;
}

import React from 'react';

import ReactDOMServer from 'react-dom/server';
import prettier from 'prettier';

import { SymbolDetails } from '<^w^>/lib/utils/ast';
import { Container } from '<^w^>/ui/components/common/container';
import { MainLayout as IndexPageMainLayout } from '<^w^>/ui/components/index-page/main-layout';
import { componentToHTML } from './component-to-html';

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
  return componentToHTML(page);
}

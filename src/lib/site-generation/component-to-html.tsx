import React, { ReactNode } from 'react';

import ReactDOMServer from 'react-dom/server';
import prettier from 'prettier';
import { extractCritical } from '@emotion/server';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

import { SymbolDetails } from '<^w^>/lib/utils/ast';
import { Container } from '<^w^>/ui/components/common/container';
import { MainLayout as ChildPageMainLayout } from '<^w^>/ui/components/child-page/main-layout';

import { mainCss } from '<^w^>/ui/components/main-css';
import { NodeInfo } from '../ast-parsing/types';

export function componentToHTML(component: ReactNode) {
  const markup = ReactDOMServer.renderToStaticMarkup(<>{component}</>);

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;overflow:auto">
  <style>
    ${mainCss}
  </style>
    ${markup}
  </body>
  </html>
  `;
}

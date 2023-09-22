import { ReactNode } from 'react';

import ReactDOMServer from 'react-dom/server';

import { mainCss } from '<^w^>/ui/components/main-css';

export function componentToHTML(component: ReactNode) {
  const markup = ReactDOMServer.renderToStaticMarkup(<>{component}</>);

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script defer src="/static/hydrate.js"></script>
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

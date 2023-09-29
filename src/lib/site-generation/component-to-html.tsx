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
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/default.min.css" integrity="sha512-hasIneQUHlh06VNBe7f6ZcHmeRTLIaQWFd43YriJ0UND19bvYRauxthDg8E4eVNPm9bRUhr5JGeqH7FRFXQu5g==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js" integrity="sha512-rdhY3cbXURo13l/WU9VlaRyaIYeJ/KBakckXIvJNAQde8DgpOmE+eZf7ha4vdqVjTtwQt69bD2wH2LXob/LB7Q==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script defer src="/static/hydrate.js"></script>
    <script defer>
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('pre code').forEach(function(elem) {
        hljs.highlightElement(elem);
      })
    })
    </script>
    </head>
  <body style="margin:0;padding:0;overflow:auto">
  <style>
    ${mainCss}
  </style>
    ${markup}
    <div id="loading-spinner" style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:white;position:fixed;width:100vw;height:100vh;margin:0:padding:0;">
      <img src="/static/spinner.gif" alt="loading..." />
    </div>
  </body>
  </html>
  `;
}

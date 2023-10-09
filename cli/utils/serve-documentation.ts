import { AddressInfo } from 'net';

import express from 'express';
import open from 'open';

export function serveDocumentation(
  projectName: string,
  projectRoot: string,
  documentationRoot: string,
  openInDefaultBrowser = true
) {
  const app = express();
  app.use(express.static(documentationRoot));
  const server = app.listen(0, () => {
    const { port } = server.address() as AddressInfo;
    process.stdout.write(`
    Serving documentation for project "${projectName}" on localhost:${port}
    Project root: ${projectRoot}
    Documentation root: ${documentationRoot}
    ${openInDefaultBrowser ? '\nOpening in default browser...' : ''}
    `);
  });
  if (openInDefaultBrowser) {
    const { port } = server.address() as AddressInfo;
    open(`http://localhost:${port}`);
  }
  return app;
}

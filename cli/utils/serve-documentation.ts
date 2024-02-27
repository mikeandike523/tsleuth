import { AddressInfo } from 'net';
import fs from 'fs';
import path from 'path';
import express from 'express';
import open from 'open';

import { checkNetworkPortAvailable } from '@/lib/network';

/**
 * The ports to prefer when opening the documentation, in order of preference.
 */
export const preferredPorts = [
  3001, 3002, 3003, 3004, 3005, 5001, 5002, 5003, 5004, 5005, 8001, 8002, 8003,
  8004, 8005,
];

export async function serveDocumentation(
  projectName: string,
  projectRoot: string,
  documentationRoot: string,
  openInDefaultBrowser = true
) {
  let lastPort: number | undefined = undefined;
  const portPath = path.join(
    projectRoot,
    '.tsleuth',
    'features',
    'generate-docs',
    'config',
    'port.json'
  );
  if (fs.existsSync(portPath)) {
    const port = JSON.parse(fs.readFileSync(portPath, 'utf8')) as number;
    lastPort = port;
  }

  const ports = lastPort ? [lastPort, ...preferredPorts] : preferredPorts;

  let preferredPort = 0;

  for (const port of ports) {
    if (await checkNetworkPortAvailable(port)) {
      preferredPort = port;
      break;
    }
  }

  if (preferredPort !== 0) {
    const dn = path.dirname(portPath);
    if (!fs.existsSync(dn)) {
      fs.mkdirSync(dn, { recursive: true });
    }
    fs.writeFileSync(portPath, JSON.stringify(preferredPort));
  }

  const app = express();
  app.use(express.static(documentationRoot));
  const server = app.listen(preferredPort, () => {
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

import { AddressInfo } from 'net';
import fs from 'fs';
import path from 'path';
import express from 'express';
import open from 'open';

import { checkNetworkPortAvailable } from '@/lib/network';

/**
 * The ports to prefer when opening the documentation, in order of preference.
 */
export const prefferedPorts = [
  // 3000 don't even try since it will likely be taken
  3001, 3002, 3003, 3004, 3005,
  // 5000 doesn't even try since it will likely be taken
  5001, 5002, 5003, 5004, 5005,
  // 8000 doesn't even try since it will likely be taken
  8001, 8002, 8003, 8004, 8005,
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

  // The absolutely simplest way to do it
  const ports = lastPort ? [lastPort, ...prefferedPorts] : prefferedPorts;

  let prefferedPort = 0;

  // Not technically guaranteed that the port is available by the next line, but its ok
  for (const port of ports) {
    if (await checkNetworkPortAvailable(port)) {
      prefferedPort = port;
      break;
    }
  }

  if (prefferedPort !== 0) {
    const dn = path.dirname(portPath);
    if (!fs.existsSync(dn)) {
      fs.mkdirSync(dn, { recursive: true });
    }
    fs.writeFileSync(portPath, JSON.stringify(prefferedPort));
  }

  const app = express();
  app.use(express.static(documentationRoot));
  const server = app.listen(prefferedPort, () => {
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

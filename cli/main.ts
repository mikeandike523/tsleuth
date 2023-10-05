import { AddressInfo } from 'net';
import path from 'path';
import fs from 'fs';

import express from 'express';

import { SerializableRecord } from '@common/serialization';

import { ExitCode } from '@/types/exit-code';
import { Feature } from '@/types/feature';
import { feature as generateDocsFeature } from '@/features/generate-docs';

// Shave off "node" and the filename from argv
process.argv = process.argv.slice(2);

/**
 *
 * The list of features available in "tsleuth"
 *
 */
const availableFeatures: {
  [name: string]: Feature<SerializableRecord>;
} = {
  'generate-docs': generateDocsFeature,
};

/**
 * Short descriptsion for the features available in "tsleuth"
 *
 */
const availableFeaturesShortDescriptions = {
  'generate-docs':
    'Generate documentation for the project in the current working directory',
};

/**
 * The main entry point is async. An express server will be used to wait while all remaining promises resolve
 */
async function main(): Promise<ExitCode> {
  // Very basic manual routing of process.argv, easier than doubling up on using commander library, when each feature already uses commander

  if (process.argv.length < 2) {
    console.log(
      `No command specified.
      Use --help or -h for more information and to list available commands.
      Use --version or -v for version information.
      `,
    );
    return ExitCode.INVALID_ARGUMENTS;
  }

  const isHelpFlag = (value: string) => ['--help', '-h'].includes(value);

  const isVersionFlag = (value: string) => ['--version', '-v'].includes(value);

  const validCommands = Object.keys(availableFeatures);

  const isValidCommand = (value: string) => validCommands.includes(value);

  const getVersion = () => {
    // Get the version from package.json
    const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json');
    const contents = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf-8').toString(),
    ) as {
      version: string;
    };
    return contents.version;
  };

  const printTopLevelHelp = () => {
    console.log(`
TSLEUTH: ${getVersion()}

A collection of tools for the analysis, transformation, and documentation of typescript 5 projects

Usage:
  tsleuth <command> [options]

  Special Commands:
  -v --version    output the version number
  -h --help       output usage information

  Available Commands:
  ${Object.keys(availableFeatures).map(name => {
    return `  ${name}  ${
      availableFeaturesShortDescriptions[
        name as keyof typeof availableFeaturesShortDescriptions
      ]
    }`;
  })}
    
    
    `);
  };

  if (process.argv.length >= 2) {
    const commandHelpOrVersion = process.argv[1];
    if (
      isHelpFlag(commandHelpOrVersion) ||
      isVersionFlag(commandHelpOrVersion)
    ) {
      if (isHelpFlag(commandHelpOrVersion)) {
        printTopLevelHelp();
        return ExitCode.SUCCESS;
      }
      if (isVersionFlag(commandHelpOrVersion)) {
        console.log(getVersion());
      }
    } else {
      const commandName = process.argv[1];
      if (!isValidCommand(commandName)) {
        console.log(`
Invalid command: ${commandName}
Use --help or -h for more information and to list available commands.
`);
        return ExitCode.INVALID_COMMAND;
      }
      const feature =
        availableFeatures[commandName as keyof typeof availableFeatures];
      const result = await feature.attachSelf();
      return result;
    }
  }

  return ExitCode.SUCCESS;
}

main()
  .then(code => {
    if (code !== ExitCode.HANG) {
      process.exit(code);
    } else {
      console.log('Subcommand returned ExitCode.HANG, waiting for CTRL+C...');
      process.on('SIGINT', () => {
        process.exit(ExitCode.SUCCESS);
      });
    }
  })
  .catch(err => {
    console.error(err);
    process.exit(ExitCode.ERROR);
  });

let portForWaiting: number | undefined = undefined;

const app = express();

app.get('*', (req, res) => {
  const listeningPort = portForWaiting || '<unknown Port>';
  res.send(
    `Express server listening on port http://localhost:${listeningPort} to allow promises to resolve...`,
  );
});

const server = app.listen(0, () => {
  const port = (server.address() as AddressInfo).port;
  portForWaiting = port;
  console.log(
    `Express server listening on http://localhost:${portForWaiting} to allow promises to resolve...`,
  );
});

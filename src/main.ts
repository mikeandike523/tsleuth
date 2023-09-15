/**
 * The main entry point and command/feature router for tsleuth
 */

import { createServer } from 'net';

import yargs from 'yargs';
import { z } from 'zod';

import { featureCD, featureCDArgsSchema } from '<^w^>/features/cd';
import {
  featureGenerateDocs,
  featureGenerateDocsArgsSchema,
} from '<^w^>/features/generate-docs';
import {
  featureListSourceFiles,
  featureListSourceFilesArgsSchema,
} from '<^w^>/features/list-source-files';
import {
  featureRenameImport,
  featureRenameImportArgsSchema,
} from '<^w^>/features/rename-import';
import {
  featureStripComments,
  featureStripCommentsArgsSchema,
} from '<^w^>/features/strip-comments';
import { ExitCode } from '<^w^>/lib/types/exit-code';
import { FeatureArgumentsObject } from '<^w^>/lib/types/feature';
import { formatZodErrorForFeature } from '<^w^>/lib/validation/format-zod-error-for-feature';

const features = {
  cd: featureCD,
  listSourceFiles: featureListSourceFiles,
  renameImport: featureRenameImport,
  stripComments: featureStripComments,
  generateDocs: featureGenerateDocs,
};

const featureSchemas = {
  cd: featureCDArgsSchema,
  listSourceFiles: featureListSourceFilesArgsSchema,
  renameImport: featureRenameImportArgsSchema,
  stripComments: featureStripCommentsArgsSchema,
  generateDocs: featureGenerateDocsArgsSchema,
};

/**
 * The main entry point for the program
 * */
function main() {
  const argv = yargs(process.argv.slice(2)).argv as unknown as {
    callingDirectory: string;
    _: Array<string>;
    [key: string]: unknown;
  };

  if (!argv.callingDirectory) {
    process.stderr.write(
      'The launcher for tsleuth is broken. Please check the integrity of your installation.\n'
    );
    process.exit(ExitCode.BrokenInstallation);
  }

  const featureName = argv._[0];

  if (featureName === 'list') {
    const featureList = Object.keys(features);
    process.stdout.write('Features:\n' + featureList.join('\n'));
    process.exit(ExitCode.Success);
  }

  if (!featureName) {
    process.stderr.write(
      'Usage: `tseluth <feature> <...options>`\nUse `tsleuth list` to see a list of available features.\n'
    );
    process.exit(ExitCode.MissingArguments);
  }

  const listOfFeatureNames = Object.keys(features);

  if (!listOfFeatureNames.includes(featureName)) {
    process.stderr.write(
      'The feature ' +
        featureName +
        ' is not available. You can use `tsleuth list` to see the available features.\n'
    );
    process.exit(ExitCode.InvalidFeature);
  }

  const featureArgs: FeatureArgumentsObject = {
    _: argv._.length > 1 ? argv._.slice(1) : [],
  };

  const keys = Object.keys(argv);

  for (const key of keys) {
    if (!['listFeatures', 'callingDirectory', '_'].includes(key)) {
      featureArgs[key] = argv[
        key
      ] as FeatureArgumentsObject[keyof FeatureArgumentsObject];
    }
  }

  const validator = featureSchemas[featureName as keyof typeof featureSchemas];

  let parsedArgs: FeatureArgumentsObject | null = null;

  try {
    parsedArgs = validator.parse(featureArgs) as FeatureArgumentsObject;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const formattedError = formatZodErrorForFeature(
        error,
        featureName as string
      );
      process.stderr.write(formattedError);
      process.exit(ExitCode.InvalidArguments);
    } else {
      if (error instanceof Error) {
        process.stderr.write(
          'could not parse arguments: ' + error.message + '\n'
        );
        process.exit(ExitCode.ArgumentParsingFailure);
      } else if (
        typeof error === 'string' ||
        typeof error === 'number' ||
        typeof error === 'boolean' ||
        typeof error === 'symbol' ||
        typeof error === 'bigint' ||
        typeof error === 'undefined' ||
        typeof error === 'function' ||
        error === null
      ) {
        process.stderr.write(
          `could not parse arguments: ${error?.toString() ?? 'unknown'}\n`
        );
        process.exit(ExitCode.ArgumentParsingFailure);
      } else {
        process.stderr.write(
          'Could not parse arguments due to unknown error: ' + error + '\n'
        );
        process.exit(ExitCode.ArgumentParsingFailure);
      }
    }
  }

  if (parsedArgs === null) {
    process.stderr.write('Could not parse arguments\n');
    process.exit(ExitCode.ArgumentParsingFailure);
  }

  const feature = features[featureName as keyof typeof features];

  const result = feature(argv.callingDirectory, parsedArgs);

  return result;
}

const exitCode = main();

if (exitCode !== ExitCode.Hang) {
  process.exit(exitCode);
}

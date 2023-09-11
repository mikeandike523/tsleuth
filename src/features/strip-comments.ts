/**
 * Strip all comments from source code
 */
import path from 'path';

import { z } from 'zod';

import { ExitCode } from '<^w^>/lib/types/exit-code';
import { Feature, FeatureArgumentsObject } from '<^w^>/lib/types/feature';
import { removeCommentsFromSource } from '<^w^>/lib/utils/ast';
import { collectTSSourceFiles } from '<^w^>/lib/utils/git';

export interface StripCommentsImportArgs extends FeatureArgumentsObject {}

export const featureStripCommentsArgsSchema = z.object({});

export const featureStripComments: Feature = async (
  callingDirectory: string,
  _args: StripCommentsImportArgs,
) => {
  const cdRealpath = path.resolve(callingDirectory);
  const sourceFiles = collectTSSourceFiles(cdRealpath);
  process.stdout.write(
    `Removing comments in ${sourceFiles.length} source files\n`,
  );
  for (const sourceFile of sourceFiles) {
    process.stdout.write(`Removing comments in ${sourceFile}...\n`);
    removeCommentsFromSource(sourceFile);
    process.stdout.write('Done\n');
  }

  return ExitCode.Success;
};

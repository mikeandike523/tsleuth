/**
 * List the source files in the calling directory according to its gitignore
 */

import fs from 'fs';
import { readFileSync } from 'fs';
import path from 'path';
import { resolve, dirname, join } from 'path';

import * as ignore from 'ignore';
import { z } from 'zod';

import { ExitCode } from '<^w^>/lib/types/exit-code';
import { FeatureArgumentsObject, Feature } from '<^w^>/lib/types/feature';
import { collectTSSourceFiles } from '<^w^>/lib/utils/git';

export interface FeatureListSourceFilesArgs extends FeatureArgumentsObject {}

export const featureListSourceFilesArgsSchema = z.object({});

export const featureListSourceFiles: Feature = async (
  callingDirectory: string,
  args: FeatureListSourceFilesArgs,
) => {
  const cdRealpath = path.resolve(callingDirectory);
  const sourceFiles = collectTSSourceFiles(cdRealpath);
  process.stdout.write(`Source files (relative to "${callingDirectory}"):\n\n`);
  for (const sourceFile of sourceFiles) {
    const relpath = path.relative(cdRealpath, sourceFile);
    process.stdout.write(`  ${relpath}\n`);
  }
  return ExitCode.Success;
};

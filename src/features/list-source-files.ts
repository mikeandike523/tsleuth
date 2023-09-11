/**
 * List the source files in the calling directory according to its gitignore
 */

import path from 'path';
import fs from 'fs';
import { readFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import * as ignore from 'ignore';

import { z } from 'zod';

import { FeatureArgumentsObject, Feature } from '<^w^>/lib/types/feature';
import { ExitCode } from '<^w^>/lib/types/exit-code';
import { collectSourceFiles } from '<^w^>/lib/utils/git';

export interface FeatureListSourceFilesArgs extends FeatureArgumentsObject {}

export const featureListSourceFilesArgsSchema = z.object({});

export const featureListSourceFiles: Feature = async (
  callingDirectory: string,
  args: FeatureListSourceFilesArgs,
) => {
  const cdRealpath = path.resolve(callingDirectory);
  const sourceFiles = collectSourceFiles(cdRealpath);
  process.stdout.write(`Source files (relative to "${callingDirectory}"):\n\n`);
  for (const sourceFile of sourceFiles) {
    const relpath = path.relative(cdRealpath, sourceFile);
    process.stdout.write(`  ${relpath}\n`);
  }
  return ExitCode.Success;
};

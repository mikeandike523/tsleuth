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
import { renameImportDeclaration } from '<^w^>/lib/utils/ast';

export interface FeatureRenameImportArgs extends FeatureArgumentsObject {
  _: string[];
}

export const featureRenameImportArgsSchema = z.object({
  _: z
    .array(z.string())
    .length(2, '2 Positional arguments are required: <old> <new>'),
});

export const featureRenameImport: Feature = async (
  callingDirectory: string,
  args: FeatureRenameImportArgs,
) => {
  const cdRealpath = path.resolve(callingDirectory);
  const sourceFiles = collectSourceFiles(cdRealpath);
  process.stdout.write(
    `Renaming imports in ${sourceFiles.length} source files\n`,
  );
  const __old = args._[0];
  const __new = args._[1];
  for (const sourceFile of sourceFiles) {
    process.stdout.write(`Updating ${sourceFile}...\n`);
    renameImportDeclaration(sourceFile, __old, __new);
    process.stdout.write('Done\n');
  }

  return ExitCode.Success;
};

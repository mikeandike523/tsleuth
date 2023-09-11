/**
 * List the source files in the calling directory according to its gitignore
 */

import path from 'path';

import { z } from 'zod';

import { ExitCode } from '<^w^>/lib/types/exit-code';
import { Feature, FeatureArgumentsObject } from '<^w^>/lib/types/feature';
import { renameImportDeclaration } from '<^w^>/lib/utils/ast';
import { collectTSSourceFiles } from '<^w^>/lib/utils/git';

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
  const sourceFiles = collectTSSourceFiles(cdRealpath);
  process.stdout.write(
    `Renaming imports in ${sourceFiles.length} source files\n`,
  );
  const __old = args._[0];
  const __new = args._[1];
  for (const sourceFile of sourceFiles) {
    process.stdout.write(`Updating ${sourceFile}...\n`);
    renameImportDeclaration(sourceFile, __old, __new);
  }

  return ExitCode.Success;
};

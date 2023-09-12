/**
 * Generate a static site from the docstrings in a codebase
 */

import fs from 'fs';
import path from 'path';

import { z } from 'zod';

import { intermediatesToHTML } from '<^w^>/lib/site-generation/intermediates-to-html';
import { ExitCode } from '<^w^>/lib/types/exit-code';
import { Feature, FeatureArgumentsObject } from '<^w^>/lib/types/feature';
import { analyzeFile } from '<^w^>/lib/utils/ast';
import { uuidv4InDirectory } from '<^w^>/lib/utils/filesystem';
import { collectTSSourceFiles } from '<^w^>/lib/utils/git';

export interface GenerateDocsArgs extends FeatureArgumentsObject {}

export const featureGenerateDocsArgsSchema = z.object({});

export const featureGenerateDocs: Feature = (
  callingDirectory: string,
  _args: GenerateDocsArgs
) => {
  const cdRealpath = path.resolve(callingDirectory);
  const cacheDir = path.resolve(
    cdRealpath,
    '.tsleuth',
    'cache',
    'generate-docs',
    'intermediates'
  );

  if (fs.existsSync(cacheDir)) {
    fs.rmdirSync(cacheDir, { recursive: true });
  }

  fs.mkdirSync(cacheDir, {
    recursive: true,
  });

  const sourceFiles = collectTSSourceFiles(cdRealpath);
  process.stdout.write(
    `Generating intermediates for ${sourceFiles.length} files...\n`
  );
  for (const sourceFile of sourceFiles) {
    process.stdout.write(`\rGenerating intermediates for ${sourceFile}...\n`);
    const symbols = analyzeFile(sourceFile);
    if (symbols.length === 0) {
      continue;
    }
    const cacheObject = {
      callingDirectory: cdRealpath,
      sourceFileRealPath: sourceFile,
      symbols: symbols,
    };
    const uuid = uuidv4InDirectory(cacheDir, 'json');
    fs.writeFileSync(
      path.resolve(cacheDir, uuid),
      JSON.stringify(
        cacheObject,
        (_key: string, value: unknown) => {
          if (typeof value === 'string') {
            return value.replace(/\r\n/g, '\n');
          }
          return value;
        },
        2
      ).replace(/\r\n/g, '\n')
    );
  }

  const docsDir = path.resolve(cdRealpath, '.tsleuth', 'generated', 'docs');

  if (fs.existsSync(docsDir)) {
    fs.rmdirSync(docsDir, { recursive: true });
  }

  fs.mkdirSync(docsDir, {
    recursive: true,
  });

  process.stdout.write(`Generating documentation website...\n`);

  intermediatesToHTML(cacheDir, docsDir);

  process.stdout.write('Done.\n');

  return ExitCode.Success;
};

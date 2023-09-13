/**
 * Generate a static site from the docstrings in a codebase
 */

import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';

import { z } from 'zod';

import { intermediatesToHTML } from '<^w^>/lib/site-generation/intermediates-to-html';
import { ExitCode } from '<^w^>/lib/types/exit-code';
import { Feature, FeatureArgumentsObject } from '<^w^>/lib/types/feature';
import { analyzeFile } from '<^w^>/lib/utils/ast';
import { uuidv4InDirectory } from '<^w^>/lib/utils/filesystem';
import { collectTSSourceFiles } from '<^w^>/lib/utils/git';
import {
  SourceFileInfo,
  createEmptyNodeInfo,
} from '<^w^>/lib/ast-parsing/types';
import { deepCopyWithoutUndefined } from '<^w^>/lib/utils/objects';
import { walkAST } from '<^w^>/lib/ast-parsing/walk-ast';

export interface GenerateDocsArgs extends FeatureArgumentsObject {
  _: string[];
}

export const featureGenerateDocsArgsSchema = z.object({
  _: z.array(z.string()),
});

export const featureGenerateDocs: Feature = (
  callingDirectory: string,
  _args: GenerateDocsArgs
) => {
  if (_args._.length > 1) {
    process.stderr.write('Too many arguments\n');
    process.stdout.write(`
Usage:
    tsleuth generateDocs - generate documentation for the cwd                 
  OR
    tsleuth generateDocs open - open the documentation index.html in the default web browser    
    \n`);
    return ExitCode.InvalidArguments;
  }
  if (_args._.length === 1 && _args._[0] !== 'open') {
    process.stderr.write('Invalid arguments\n');
    process.stdout.write(`
    Usage:
        tsleuth generateDocs - generate documentation for the cwd                 
      OR
        tsleuth generateDocs open - open the documentation index.html in the default web browser    
        \n`);
    return ExitCode.InvalidArguments;
  }

  if (_args._[0] === 'open') {
    const cdRealpath = path.resolve(callingDirectory);
    const docsDir = path.resolve(cdRealpath, '.tsleuth', 'generated', 'docs');
    const docsIndex = path.resolve(docsDir, 'index.html');
    if (!fs.existsSync(docsIndex)) {
      process.stderr.write('Could not find docs index.html\n');
      return ExitCode.MissingFile;
    }
    if (process.platform === 'win32') {
      const cmd = `start \"\" \"file://${docsIndex}\"`;
      childProcess.spawnSync(cmd, { shell: true });
    } else {
      process.stderr.write('Linux not yet supported\n');
      return ExitCode.IncompatibleOS;
    }
    return ExitCode.Success;
  }

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
  let numFiles = 0;
  for (const sourceFile of sourceFiles) {
    process.stdout.write(`\rGenerating intermediates for ${sourceFile}...\n`);

    let cacheObject: SourceFileInfo & {
      callingDirectory: string;
    } = {
      absolutePath: sourceFile,
      callingDirectory: cdRealpath,
      root: createEmptyNodeInfo(),
    };

    walkAST(cacheObject);

    if (cacheObject.root.children.length === 0) {
      continue;
    }

    cacheObject = deepCopyWithoutUndefined<typeof cacheObject>(cacheObject);

    numFiles += 1;

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

  if (numFiles === 0) {
    // Trivial case is technically not an error
    process.stdout.write(
      `No documented symbols in your project.\n Will not generate docs.\n`
    );
    return ExitCode.Success;
  }

  const docsDir = path.resolve(cdRealpath, '.tsleuth', 'generated', 'docs');

  if (fs.existsSync(docsDir)) {
    fs.rmdirSync(docsDir, { recursive: true });
  }

  fs.mkdirSync(docsDir, {
    recursive: true,
  });

  // process.stdout.write(`Generating documentation website...\n`);

  // intermediatesToHTML(cacheDir, docsDir);

  // process.stdout.write('Done.\n');

  return ExitCode.Success;
};

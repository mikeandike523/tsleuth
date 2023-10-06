/**
 * Generate a static site from the docstrings in a codebase
 */

import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';
import { AddressInfo } from 'net';

import { z } from 'zod';
import express from 'express';
import chalk from 'chalk';

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
import { openUrlInWebBrowser } from '<^w^>/lib/utils/os';

export interface GenerateDocsArgs extends FeatureArgumentsObject {
  _: string[];
}

export const featureGenerateDocsArgsSchema = z.object({
  _: z.array(z.string()),
});

export const featureGenerateDocs: Feature = async (
  callingDirectory: string,
  _args: GenerateDocsArgs
) => {
  if (_args._.length > 1) {
    process.stderr.write('Too many arguments\n');
    process.stdout.write(`
Usage:
    tsleuth generateDocs - generate documentation for the cwd                 
  OR
    tsleuth generateDocs serve - serve the generated documentation site using express.js 
    \n`);
    return ExitCode.InvalidArguments;
  }
  if (
    _args._.length === 1 &&
    _args._[0] !== 'serve' &&
    _args._[0] !== 'htmlOnly'
  ) {
    process.stderr.write('Invalid arguments\n');
    process.stdout.write(`
    Usage:
        tsleuth generateDocs - generate documentation for the cwd                 
      OR
        tsleuth generateDocs serve - serve the generated documentation site using express.js
        tsleuth generateDocs htmlOnly - regenerate the documentation site, but don't regenerate AST intermediates
        \n`);
    return ExitCode.InvalidArguments;
  }

  if (_args._[0] === 'serve') {
    const cdRealpath = path.resolve(callingDirectory);
    const docsDir = path.resolve(cdRealpath, '.tsleuth', 'generated', 'docs');

    if (!fs.existsSync(docsDir)) {
      process.stderr.write(
        `Could not find docs directory at ${docsDir}\n Are you sure you generated it?`
      );
      return ExitCode.MissingFile;
    }

    const app = express();

    app.use(express.static(docsDir));

    const server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      const url = `http://localhost:${port}`;
      process.stdout.write(`Listening on port ${port}.\n`);
      process.stdout.write(`Go to the following URL: ${chalk.green(url)}\n`);
      openUrlInWebBrowser(url);
    });

    return ExitCode.Hang;
  }

  if (_args._[0] === 'htmlOnly') {
    const cdRealpath = path.resolve(callingDirectory);
    const cacheDir = path.resolve(
      cdRealpath,
      '.tsleuth',
      'cache',
      'generate-docs',
      'intermediates'
    );

    const docsDir = path.resolve(cdRealpath, '.tsleuth', 'generated', 'docs');

    if (fs.existsSync(docsDir)) {
      fs.rmdirSync(docsDir, { recursive: true });
    }

    fs.mkdirSync(docsDir, {
      recursive: true,
    });

    process.stdout.write(`Generating documentation website...\n`);

    await intermediatesToHTML(cacheDir, docsDir);

    process.stdout.write('Done.\n');

    process.stdout.write(
      'Copying hydrate.js to the static directory in the generated site...\n'
    );

    const docsDirStaticDir = path.resolve(docsDir, 'static');

    if (fs.existsSync(docsDirStaticDir)) {
      fs.rmdirSync(docsDirStaticDir, { recursive: true });
    }

    if (!fs.existsSync(docsDirStaticDir)) {
      fs.mkdirSync(docsDirStaticDir);
    }

    const targetFile = path.resolve(docsDirStaticDir, 'hydrate.js');

    const sourceDir = path.resolve(
      __dirname,
      '..',
      '..',
      'documentation-generator-dom',
      'dist'
    );

    const sourceFile = path.resolve(sourceDir, 'hydrate.js');

    fs.copyFileSync(sourceFile, targetFile);

    process.stdout.write('Done.\n');

    process.stdout.write('Copying all other static files...');
    const staticDir = path.resolve(sourceDir, '..', 'static');

    const items = fs.readdirSync(staticDir);
    for (const item of items) {
      if (fs.statSync(path.resolve(staticDir, item)).isFile()) {
        const sourceFile = path.resolve(staticDir, item);
        const targetFile = path.resolve(docsDirStaticDir, item);
        process.stdout.write(`Copying file ${sourceFile} to ${targetFile}...`);
        fs.copyFileSync(sourceFile, targetFile);
      }
    }

    process.stdout.write('Done.\n');

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

  process.stdout.write(`Generating documentation website...\n`);

  await intermediatesToHTML(cacheDir, docsDir);

  process.stdout.write('Done.\n');

  process.stdout.write(
    'Copying hydrate.js to the static directory in the generated site...\n'
  );

  const docsDirStaticDir = path.resolve(docsDir, 'static');

  if (!fs.existsSync(docsDirStaticDir)) {
    fs.mkdirSync(docsDirStaticDir);
  }

  const targetFile = path.resolve(docsDirStaticDir, 'hydrate.js');

  const sourceDir = path.resolve(
    __dirname,
    '..',
    '..',
    'documentation-generator-dom',
    'dist'
  );

  const sourceFile = path.resolve(sourceDir, 'hydrate.js');

  fs.copyFileSync(sourceFile, targetFile);

  process.stdout.write('Done.\n');

  process.stdout.write('Copying all other static files...');
  const staticDir = path.resolve(sourceDir, '..', 'static');

  const items = fs.readdirSync(staticDir);
  for (const item of items) {
    if (fs.statSync(path.resolve(staticDir, item)).isFile()) {
      const sourceFile = path.resolve(staticDir, item);
      const targetFile = path.resolve(docsDirStaticDir, item);
      process.stdout.write(`Copying file ${sourceFile} to ${targetFile}...`);
      fs.copyFileSync(sourceFile, targetFile);
    }
  }

  process.stdout.write('Done.\n');

  return ExitCode.Success;
};
import path from 'path';

import fs from 'fs';
import chalk from 'chalk';

import {
  WorkingDirectory,
  copyDirectoryContentsRecursive,
} from '@common/filesystem';
import { ASTIntermediate } from '@/lib/ast-traversal';
import {
  convertToPrefixAndRelativePaths,
  assembleHierarchyFromRelativePathsAndAssociatedData,
} from '@common/filesystem';
import { normalizePath } from '@common/filesystem';
import { findReadmeInFolder } from './find-readme';
import { posixMakeAbsolute } from '@common/filesystem';

/**
 *
 * Generates the final documentation site and copies content files
 *
 * @param projectName - The name of the project, used for things such as titles and headers
 *
 * @param outDir - The folder that will house index.html and bundle.js, as well as the /static directory
 * @param contentDir - The folder containing the content that will be copied to the /static directory in the output folder
 * @param placeholderMarkup - Optional initial markup to show in the index.html "root" element before React hydrates
 *
 * @remarks
 * The function assumes the existence of outDir and staticDir, but it will create <outDir>/static if it does not exist.
 */
export function generateSiteAndCopyFiles(
  projectName: string,
  intermediateDirectory: string,
  outDir: string,
  contentDir: string,
  placeholderMarkup?: string
) {
  if (typeof placeholderMarkup === 'undefined') {
    placeholderMarkup = `
    <style>
    @keyframes spinner {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    .pre-hydration-spinner {
      width: 10vh;
      height: 10vh;
      border-radius: 50%;
      border: 0.25em solid #00FFFF80;
      border-top: 0.25em solid #3498db;
      animation-name: spinner;
      animation-duration: 1s;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
    .placeholder-container {
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    </style>
    <div class="placeholder-container">
      <div class="pre-hydration-spinner"></div>
    </div>
    `;
  }

  // Collect all the intermediate files
  const intermediates: Map<string, ASTIntermediate> = new Map();

  const intermediatesWD = new WorkingDirectory(intermediateDirectory);

  const intermediateFiles = fs
    .readdirSync(intermediateDirectory)
    .filter((file) => {
      return file.endsWith('.json');
    });

  process.stdout.write(
    chalk.magenta(
      `Loading ${intermediateFiles.length} AST intermediate files...\n`
    )
  );

  for (const file of intermediateFiles) {
    const fullPath = intermediatesWD.resolve(file);
    const ast = JSON.parse(
      fs.readFileSync(fullPath, 'utf8')
    ) as ASTIntermediate;
    intermediates.set(file, ast);
  }

  process.stdout.write(chalk.green(`Done.\n`));

  // The source files from which the AST intermediates were generated
  const sourceFiles = Array.from(intermediates.values()).map((item) => {
    return item.path;
  });

  // Determine what the user's project root was, and get a list of relative paths

  const projectPathConfig = convertToPrefixAndRelativePaths(sourceFiles);

  if (projectPathConfig === null) {
    throw new Error(
      `Could not determine project path configuration. Perhaps there is an issue with symbolic links?`
    );
  }

  const projectRoot = posixMakeAbsolute(projectPathConfig.prefix);
  const relpaths = projectPathConfig.relativePaths;

  // Arrange the AST intermediates in a hierarchy according to the relative paths, an attach metadata regarding the name of the intermediate file
  // Do not need to attach the intermediate itself since this needs to be fetched async at runtime in the React app

  // Step 1: Reverse map from relpath back to intermediate filename
  const reverseMap: Map<string, string> = new Map();
  for (const [key, value] of intermediates.entries()) {
    reverseMap.set(normalizePath(path.relative(projectRoot, value.path)), key);
  }

  // Step 2: Prepare the data for the tree transform
  const treeTransformInput: {
    relativePath: string;
    data: string;
  }[] = relpaths.map((relpath) => {
    return {
      relativePath: relpath,
      data: reverseMap.get(relpath)!,
    };
  });

  // Step 3: Calculate the tree/hierarchy
  const hierarchy =
    assembleHierarchyFromRelativePathsAndAssociatedData(treeTransformInput);

  process.stdout.write(chalk.magenta(`Searching for top-level README...\n`));

  const readmePath = findReadmeInFolder(posixMakeAbsolute(projectRoot));

  const contentIndex = {
    projectName,
    projectRoot,
    hierarchy,
    topLevelReadme: readmePath ? path.basename(readmePath) : null,
  };

  const outDirWD = new WorkingDirectory(outDir);

  const outContentDir = outDirWD.subDir('content').createSelfIfNotExists().root;

  process.stdout.write(chalk.green(`Done.\n`));

  new WorkingDirectory(outContentDir).clear();

  fs.writeFileSync(
    path.resolve(outContentDir, 'content-index.json'),
    JSON.stringify(contentIndex, null, 2)
  );

  for (const file of intermediateFiles) {
    const sourcePath = path.resolve(intermediateDirectory, file);
    const destPath = path.resolve(outContentDir, file);
    fs.copyFileSync(sourcePath, destPath);
  }

  const indexHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${projectName} Documentation</title>
  </head>
  <body style="margin: 0; padding: 0;">
  <div id="root" style="width: 100vw; height:100vh; margin:0; padding:0">
    ${placeholderMarkup}
  </div>
  <script src="/bundle.js"></script>
  </body>
  
  `;

  fs.writeFileSync(outDirWD.resolve('index.html'), indexHtml);

  const bundleFile = new WorkingDirectory(__dirname)
    .subDir('..')
    .subDir('..')
    .subDir('client')
    .subDir('dist')
    .resolve('bundle.js');

  fs.copyFileSync(bundleFile, outDirWD.resolve('bundle.js'));

  if (readmePath) {
    fs.copyFileSync(
      readmePath,
      path.resolve(outContentDir, path.basename(readmePath))
    );
  }

  // Copy all contents (recursively) of directory contentDir to directory outContentDir
  copyDirectoryContentsRecursive(contentDir, outContentDir, true);
}

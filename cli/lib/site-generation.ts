import fs from 'fs';

import {
  WorkingDirectory,
  copyDirectoryContentsRecursive,
} from '@common/filesystem';

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
  outDir: string,
  contentDir: string,
  placeholderMarkup?: string
) {
  if (typeof placeholderMarkup === 'undefined') {
    placeholderMarkup = `
    <style>
    @keyframes anim-pre-hydration-spinner {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    .pre-hydration-spinner {
      width: 10vh;
      height: 10vh;
      border-radius: 50%;  // Makes it circular
      border: 4px solid transparent;
      border-top-color: #3498db;  // Color for the top border
      animation-name: anim-pre-hydration-spinner 1s linear infinite;
    }
    </style>
    
    
    `;
  }

  const outDirWD = new WorkingDirectory(outDir);

  const outContentDir = outDirWD.subDir('content').createSelfIfNotExists().root;

  const indexHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${projectName} Documentation</title>
  </head>
  <body>
  <div id="root" style="width: 100vw; height:100vh; margin:0; padding:0">
  ${placeholderMarkup}
  </div>
  <script src="${outDir}/bundle.js"></script>
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

  // Copy all contents (recursively) of directory contentDir to directory outContentDir
  copyDirectoryContentsRecursive(contentDir, outContentDir, true);
}

import fs from 'fs';
import path from 'path';

import { astToHTML } from '<^w^>/lib/site-generation/ast-to-html';
import { listingToHTML } from '<^w^>/lib/site-generation/listing-to-html';
import { SymbolDetails } from '<^w^>/lib/utils/ast';
import {
  DirectoryStructure,
  absoluteFilepathListToRootAndRelativeFilepaths,
  calculateDirectoryStructureFromFiles,
} from '<^w^>/lib/utils/filepath';

/**
 * Represents the structure of the AST intermediate json files
 */
export type AstIntermediateJson = {
  callingDirectory: string;
  sourceFileRealPath: string;
  symbols: SymbolDetails[];
};

/**
 *
 * Assembles a documentation website from the json-based AST intermediates
 *
 * @param intermediatesDirectory - The directory containing the json-based ASTs
 * @param outputDirectory - The directory to write the documentation website to
 */
export function intermediatesToHTML(
  intermediatesDirectory: string,
  outputDirectory: string
) {
  const intermediates: AstIntermediateJson[] = [];
  const files = fs.readdirSync(intermediatesDirectory);
  for (const file of files) {
    const intermediateFile = path.join(intermediatesDirectory, file);
    process.stdout.write(`Reading ${intermediateFile}...\n`);
    const intermediateJson = fs.readFileSync(intermediateFile, 'utf8');
    const intermediate = JSON.parse(intermediateJson) as AstIntermediateJson;
    intermediates.push(intermediate);
  }
  const filenames = intermediates.map((i) => i.sourceFileRealPath);
  const result = absoluteFilepathListToRootAndRelativeFilepaths(filenames);
  if (result === null) {
    throw new Error(
      'The source files listed in the intermediate ast files do not have a common parent directory'
    );
  }
  process.stdout.write('Assembling hierarchical data structure...\n');
  const { root, relativePaths } = result;
  console.log(root, relativePaths);
  const analysis = calculateDirectoryStructureFromFiles<SymbolDetails[]>(
    relativePaths,
    (relativePath: string) => {
      return null;
    }
  );
  console.log(root, JSON.stringify(analysis, null, 2));
  const fullProjectAnalysis = {
    root,
    analysis,
  };
  const miscCacheDir = path.resolve(intermediatesDirectory, '..', 'misc');
  if (fs.existsSync(miscCacheDir)) {
    fs.rmdirSync(miscCacheDir, { recursive: true });
  }
  fs.mkdirSync(miscCacheDir, { recursive: true });
  fs.writeFileSync(
    path.join(miscCacheDir, 'full-project-analysis.json'),
    JSON.stringify(
      fullProjectAnalysis,
      (key: string, value: unknown) => {
        if (typeof value === 'string') {
          return value.replace(/\r\n/g, '\n');
        }
        return value;
      },
      2
    ).replace(/\r\n/g, '\n')
  );
  process.stdout.write('Done!\n');
  process.stdout.write('Generating HTML...\n');

  const nodeIsLeaf = (node: object | null) => {
    return node === null || Array.isArray(node);
  };

  const nodeIsNullLeaf = (node: object | null) => {
    return node === null;
  };

  if (fs.existsSync(outputDirectory)) {
    fs.rmdirSync(outputDirectory, { recursive: true });
  }

  fs.mkdirSync(outputDirectory, { recursive: true });

  const recursion = (
    crumbs: string[],
    obj: DirectoryStructure<SymbolDetails[]>
  ) => {
    const keys = Object.keys(obj);
    for (const key of keys) {
      if (nodeIsLeaf(obj[key])) {
        process.stdout.write(
          `Generating HTML for ${crumbs.concat([key]).join('>>')}\n`
        );
        const cacheObject = intermediates.find(
          (i) =>
            path.relative(root, i.sourceFileRealPath) ===
            crumbs.concat([key]).join(path.sep)
        );
        console.log('cacheObject', cacheObject?.sourceFileRealPath);
        const symbolDetails = cacheObject?.symbols ?? ([] as SymbolDetails[]);
        const fullCrumbs = crumbs.concat([key]);
        const renderedHTML = astToHTML(
          root,
          fullCrumbs,
          symbolDetails,
          outputDirectory
        );
        if (!fs.existsSync(path.join(outputDirectory, ...crumbs))) {
          fs.mkdirSync(path.join(outputDirectory, ...crumbs), {
            recursive: true,
          });
        }
        fs.writeFileSync(
          path.join(
            outputDirectory,
            `${crumbs.join(path.sep)}${path.sep}${key}.html`
          ),
          renderedHTML
        );
      } else {
        const dS = obj[key] as object as DirectoryStructure<SymbolDetails[]>;

        const keys1 = Object.keys(dS);

        const items: {
          name: string;
          isLeaf: boolean;
        }[] = [];

        for (const key1 of keys1) {
          items.push({
            name: key1,
            isLeaf: nodeIsLeaf(dS[key1]),
          });
        }

        const html = listingToHTML(
          root,
          crumbs.concat([key]),
          items,
          outputDirectory
        );

        const combinedOutDir = `${outputDirectory}/${crumbs.join(path.sep)}${
          path.sep
        }${key}`.replace(/\\/g, '/');

        if (!fs.existsSync(combinedOutDir)) {
          fs.mkdirSync(combinedOutDir, {
            recursive: true,
          });
        }

        fs.writeFileSync(`${combinedOutDir}/index.html`, html);

        recursion(
          crumbs.concat([key]),
          obj[key] as object as DirectoryStructure<SymbolDetails[]>
        );
      }
    }
  };

  const dS = analysis as object as DirectoryStructure<SymbolDetails[]>;

  const keys1 = Object.keys(dS);

  const items: {
    name: string;
    isLeaf: boolean;
  }[] = [];

  for (const key1 of keys1) {
    items.push({
      name: key1,
      isLeaf: nodeIsLeaf(dS[key1]),
    });
  }

  const html = listingToHTML(root, [], items, outputDirectory);

  const combinedOutDir = `${outputDirectory}`.replace(/\\/g, '/');

  if (!fs.existsSync(combinedOutDir)) {
    fs.mkdirSync(combinedOutDir, {
      recursive: true,
    });
  }

  fs.writeFileSync(`${combinedOutDir}/index.html`, html);

  recursion([], analysis);
}

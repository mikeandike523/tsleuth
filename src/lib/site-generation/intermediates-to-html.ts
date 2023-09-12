import fs from 'fs';
import path from 'path';

import { astToHTML } from '<^w^>/lib/site-generation/ast-to-html';
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
export async function intermediatesToHTML(
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
  const analysis = calculateDirectoryStructureFromFiles<SymbolDetails[]>(
    relativePaths,
    (relativePath: string) => {
      const fullpath = path.join(root, relativePath);
      const intermediate = intermediates.find(
        (i) => path.normalize(i.sourceFileRealPath) === path.normalize(fullpath)
      );
      return intermediate?.symbols ?? null;
    }
  );
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

  const recursion = async (
    crumbs: string[],
    obj: DirectoryStructure<SymbolDetails[]>
  ) => {
    const keys = Object.keys(obj);
    for (const key of keys) {
      process.stdout.write(
        `(Async) Generating HTML for ${crumbs.concat([key]).join('>>')}\n`
      );
      if (nodeIsLeaf(obj[key])) {
        if (nodeIsNullLeaf(obj[key])) {
          throw new Error(
            `Expected leaf to be SymbolDetails[], but got null. Check the callback used when assembling  full project analysis from the ast intermediates`
          );
        }
        const symbolDetails = obj[key] as SymbolDetails[];
        const fullCrumbs = crumbs.concat([key]);
        const renderedHTML = await astToHTML(root, fullCrumbs, symbolDetails);
        fs.writeFileSync(
          path.join(outputDirectory, `${key}.html`),
          renderedHTML
        );
        process.stdout.write(
          `(Async) Done Generating HTML for ${crumbs
            .concat([key])
            .join('>>')}\n`
        );
      } else {
        await recursion(
          crumbs.concat([key]),
          obj[key] as object as DirectoryStructure<SymbolDetails[]>
        );
      }
    }
  };

  await recursion([], analysis);
}

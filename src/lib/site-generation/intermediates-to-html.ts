import fs from 'fs';
import path from 'path';

import { SymbolDetails } from '<^w^>/lib/utils/ast';
import {
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
  outputDirectory: string,
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
      'The source files listed in the intermediate ast files do not have a common parent directory',
    );
  }
  const { root, relativePaths } = result;
  const directoryStructureWithSymbols = calculateDirectoryStructureFromFiles<
    SymbolDetails[]
  >(relativePaths, (relativePath: string) => {
    const fullpath = path.join(root, relativePath);
    const intermediate = intermediates.find(
      (i) => path.normalize(i.sourceFileRealPath) === path.normalize(fullpath),
    );
    return intermediate?.symbols ?? null;
  });
  const fullProjectAnalysis = {
    root: root,
    analysis: directoryStructureWithSymbols,
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
      2,
    ).replace(/\r\n/g, '\n'),
  );
}

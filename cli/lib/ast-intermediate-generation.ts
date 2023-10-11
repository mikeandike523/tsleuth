import fs from 'fs';

import chalk from 'chalk';

import { collectTSSourceFiles } from '@common/git';
import { WorkingDirectory } from '@common/filesystem';
import { walkAST } from '@/lib/ast-traversal';

export function generateAstIntermediates(
  projectRoot: string,
  intermediatesDir: string
) {
  const sourceFiles = collectTSSourceFiles(projectRoot);

  const intermediatesWD = new WorkingDirectory(intermediatesDir)
    .createSelfIfNotExists()
    .clear();
  process.stdout.write(
    chalk.magenta(
      `Generating AST Intermediates for ${sourceFiles.length} source files...\n`
    )
  );
  for (const sourceFile of sourceFiles) {
    process.stdout.write(`Generating intermediate for ${sourceFile}...`);
    const outputFilename = intermediatesWD.getUuid('.json');
    const ast = walkAST(sourceFile);
    if (ast.root === null) {
      continue;
    }
    fs.writeFileSync(
      intermediatesWD.resolve(outputFilename),
      JSON.stringify(ast, null, 2)
    );
    process.stdout.write(chalk.blue('done\n'));
  }
  process.stdout.write(chalk.green(`Finished generating AST Intermediates.\n`));
}

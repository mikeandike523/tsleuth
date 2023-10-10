import { collectTSSourceFiles } from '@common/git';
import { WorkingDirectory } from '@common/filesystem';

export function generateAstIntermediates(
  projectRoot: string,
  intermediatesDir: string
) {
  const sourceFiles = collectTSSourceFiles(projectRoot);
  new WorkingDirectory(intermediatesDir).createSelfIfNotExists().clear();
  process.stdout.write(
    `Generating AST Intermediates for ${sourceFiles.length} source files...`
  );
}

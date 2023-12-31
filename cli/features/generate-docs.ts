import { Command } from 'commander';

import { Feature } from '@/types/feature';
import { ExitCode } from '@/types/exit-code';
import { TsleuthDirectory } from '@/utils/system-paths';
import { generateSiteAndCopyFiles } from '@/lib/site-generation';
import { normalizePath } from '@common/filesystem';
import { serveDocumentation } from '@/utils/serve-documentation';
import { generateAstIntermediates } from '@/lib/ast-intermediate-generation';

export type FeatureArgs = {
  serve?: boolean;
  useCached?: boolean;
};

export const feature: Feature<FeatureArgs> = {
  attachSelf: () => {
    return new Promise<ExitCode>((resolve, reject) => {
      const program = new Command();
      program
        .description(
          `
      Generate documentation for a typescript 5 project.
      Documents the project in the current working directory.
      Caches data in a folder ".tsleuth" in the current working directory.
      Remember to add ".tsleuth" to your ".gitignore".
      The generated documentation will reside in <cwd>/.tsleuth/features/generate-docs/dist, and can be served statically wtih the --serve flag.
      `
        )
        .option(
          '-s --serve',
          'Serve the documentation on localhost on a dynamically assigned port. Opens the documentation in the default browser.',
          false
        )
        .option(
          '-c --use-cached',
          'Use cached data from the ".tsleuth" folder in the current working directory. Do not re-analyze the project source code.',
          false
        )
        .action((parsedArgs) => {
          const procedureResult = feature.procedure({
            serve: parsedArgs.serve,
            useCached: parsedArgs.useCached,
          } as FeatureArgs);
          if (procedureResult instanceof Promise) {
            procedureResult.then(resolve).catch(reject);
          } else {
            resolve(procedureResult);
          }
        });
      program.parse(['node', '__placeholder.js'].concat(process.argv));
    });
  },
  procedure: async (args) => {
    const projectRoot = normalizePath(process.cwd());
    const projectName =
      normalizePath(process.cwd(), '/').split('/').pop() ?? 'Untitled Project';

    const serve = args.serve ?? false;
    const useCached = args.useCached ?? false;

    process.stdout.write('Initializing...\n');

    const tsleuthDir = new TsleuthDirectory();

    if (!tsleuthDir.isInGitignore()) {
      process.stdout.write(
        'WARNING! .tsleuth directory is not in the gitignore at you project root, or the gitignore does not exist. Please ensure that .tsleuth directory is ignored by git.\n'
      );
    }

    const featureDir = tsleuthDir.featureDir('generate-docs');

    const docsOutputDir = featureDir.subDir('dist');

    const docsOutputContentDir = docsOutputDir.subDir('content');

    const featureCacheDir = featureDir.subDir('cache');

    if (serve) {
      console.log('serving...');
      serveDocumentation(projectName, projectRoot, docsOutputDir.root, true)
        .then(() => {})
        .catch(() => {});
      return ExitCode.HANG;
    }

    if (!useCached) {
      generateAstIntermediates(
        projectRoot,
        featureCacheDir.subDir('ast-intermediates').root
      );
    }

    generateSiteAndCopyFiles(
      projectName,
      featureCacheDir.subDir('ast-intermediates').root,
      docsOutputDir.root,
      docsOutputContentDir.root
    );

    return ExitCode.SUCCESS;
  },
};

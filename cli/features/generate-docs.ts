import { Command } from 'commander';

import { Feature } from '@/types/feature';
import { ExitCode } from '@/types/exit-code';

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
      `,
        )
        .option(
          '-s',
          '--serve',
          'Serve the documentation on localhost on a dynamically assigned port. Opens the documentation in the default browser.',
        )
        .option(
          '-c',
          '--use-cached',
          'Use cached data from the ".tsleuth" folder in the current working directory. Do not re-analyze the project source code.',
        )
        .action(parsedArgs => {
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
      program.parse(process.argv);
    });
  },
  procedure: async args => {
    const serve = args.serve ?? false;
    const useCached = args.useCached ?? false;

    // The main procedure for the "generate-docs" feature will be here

    return ExitCode.SUCCESS;
  },
};

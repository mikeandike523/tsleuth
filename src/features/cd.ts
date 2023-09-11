/**
 * Simply echoes back the calling directory back to the user
 * This feature is pretty much a test/example feature
 */

import { z } from 'zod';

import { ExitCode } from '<^w^>/lib/types/exit-code';
import { FeatureArgumentsObject, Feature } from '<^w^>/lib/types/feature';

/**
 * The arguments that this feature takes in
 * The cd feature takes in no arguments, so the interface is empty
 */
export interface FeatureCDArgs extends FeatureArgumentsObject {}

/**
 * The runtime validator for the cd feature. In this case, an empty object since the FeatureCDArgs interface is empty
 */
export const featureCDArgsSchema = z.object({});

/**
 *
 * The cd feature
 *
 * @param callingDirectory - will be resolved in main.ts and passed explicitly
 * @param args - the pre-parsed arguments that were passed to this feature, in this case, an empty object
 *
 * @remarks
 * Because the Feature type is callable, we use the export const closure pattern
 * In general, its rare in typescript that a top-level named function with a properly bound `this` is ever required
 *
 * @returns
 */
export const featureCD: Feature = (
  callingDirectory: string,
  args: FeatureCDArgs,
) => {
  process.stdout.write(
    `Tsleuth was called from directory "${callingDirectory}"\n`,
  );
  return ExitCode.Success;
};

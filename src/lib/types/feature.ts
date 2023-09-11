/**
 * Specifies a function that can be called from main.ts, taking in arguments as a specific object
 */

import { ExitCode } from '<^w^>/lib/types/exit-code';

/**
 * A super-type that constains how a feature can take in arguments.
 *
 * Each argument type can either be a string, number, or boolean, array of mixed values, or array of a specific type if yargs can infer it
 *
 * @remarks
 * It is unlikely if not impossible that key can be of type number, but might
 * as well support it anyway
 */
export interface FeatureArgumentsObject {
  _: string[];
  [key: string | number]:
    | string
    | number
    | boolean
    | Array<string | number | boolean>
    | string[]
    | number[]
    | boolean[];
}

/**
 * Describes a function that implements a feature for tsleuth
 *
 * @remarks
 * Because calling-directory is passed explictly in tsleuth.bat, it is seperated out when defining a feature.
 * The main.ts file will ensure that the callingDirectory is a real/resolved path (including resolving symlinks)
 */
export type Feature = (
  callingDirectory: string,
  args: FeatureArgumentsObject,
) => ExitCode | Promise<ExitCode>;

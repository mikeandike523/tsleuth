import { Command } from 'commander';

import { SerializableRecord } from '@common/serialization';

import { ExitCode } from '@/types/exit-code';

/**
 * A type describing how a feature/subcommand recieves arguments, runs, and exits
 */
export type Feature<T extends SerializableRecord> = {
  /**
   *
   * Dictates how the subcommand is set up via the 'commander' library
   *
   * @param program
   * @returns
   */
  attachSelf: () => Promise<ExitCode>;
  /**
   *
   * Technially, only the feature
   *
   * @param args
   * @returns
   */
  procedure: (args: T) => Promise<ExitCode> | ExitCode;
};

/**
 * Describes the possible exit codes that the cli application may have
 */
export enum ExitCode {
  /**
   * Clean Exit
   */
  SUCCESS = 0,
  /**
   * General Error Exit
   */
  ERROR = 1,
  /**
   * Indicates that the application should not exit at all, rather it should wait for CTRL+C (i.e. SIGINT) and then exit with `ExitCode.SUCCESS`
   */
  HANG = 2,

  /**
   * User has input invalid CLI arguments
   */
  INVALID_ARGUMENTS = -1,

  /**
   * User has selected a feature or command that does not exist
   */
  INVALID_COMMAND = -2,
}

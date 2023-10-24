import { isAxiosError } from 'axios';

export class FetchError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.statusCode = statusCode;
  }
  static interpretError(error: unknown): FetchError | Error | string {
    if (isAxiosError(error)) {
      return new FetchError(error.message, error.response?.status);
    }
    if (error instanceof Error) {
      return error as Error;
    }
    if (typeof error === 'object') {
      const errorAsObjectWithMessageAndStack = error as {
        message?: string;
        stack?: string;
      };
      const retval = new Error(errorAsObjectWithMessageAndStack.message);
      retval.stack = errorAsObjectWithMessageAndStack.stack;
      return retval;
    }
    try {
      return JSON.stringify(error);
    } catch (e) {
      return new Error(
        'Found unknown error that is not serializable. Serialization failure due to: ' +
          (e instanceof Error ? (e as Error).message : 'unknown reason')
      );
    }
  }
}

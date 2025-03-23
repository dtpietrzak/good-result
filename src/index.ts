export class HttpResponseError extends Error {
  code?: number;
  constructor(code: number = 500, message: string = 'An unknown error has occurred') {
    super(message);
    this.name = 'HttpResponseError';
    this.code = code;
  }
}

export class ResultError extends Error {
  code?: number;
  constructor(message: string = 'An unknown error has occurred') {
    super(message);
    this.name = 'ResultError';
  }
}

export type AnyResultError = Error | HttpResponseError | ResultError;

export type Result<E, T> =
  | { err: NonNullable<E>; val: null }
  | { err: null; val: NonNullable<T> };

export const proceed = <T>(value: NonNullable<T>): Result<never, T> => ({
  err: null,
  val: value,
});

export const errorOut = <E>(error: NonNullable<E>): Result<E, never> => ({
  err: error,
  val: null,
});

export async function result<T, E = AnyResultError>(
  fn: Promise<T> | (() => T),
  options?: {
    errorHandler?: (error: unknown) => NonNullable<E>;
    noResultError?: undefined; // Allows `null` as a valid value
  }
): Promise<Result<E, T | null>>;

export async function result<T, E = AnyResultError>(
  fn: Promise<T> | (() => T),
  options: {
    errorHandler?: (error: unknown) => NonNullable<E>;
    noResultError: NonNullable<E>; // Forces `null` to be an error
  }
): Promise<Result<E | AnyResultError, NonNullable<T>>>;

export async function result<T, E = AnyResultError>(
  fn: Promise<T> | (() => T),
  options?: {
    errorHandler?: (error: unknown) => NonNullable<E>;
    noResultError?: NonNullable<E>;
  }
): Promise<Result<E | AnyResultError, T | null>> {
  try {
    const data = typeof fn === 'function' ? fn() : await fn;
    if (data === null && typeof options?.noResultError !== 'undefined') {
      return errorOut(options.noResultError)
    }
    return proceed(data as NonNullable<T>);
  } catch (error: unknown) {
    let handledError;

    if (options?.errorHandler) {
      const transformedError = options.errorHandler(error);
      handledError = transformedError ?? new ResultError('Error handler returned an invalid error');
    } else if (
      error instanceof Error ||
      error instanceof HttpResponseError ||
      error instanceof ResultError
    ) {
      handledError = error;
    } else {
      const newError = new ResultError(`Unknown error\n${String(fn)}`);
      if (error instanceof Error && error.stack) {
        newError.stack = error.stack; // Preserve stack trace
      }
      handledError = newError;
    }

    return errorOut(handledError as NonNullable<E>);
  }
}

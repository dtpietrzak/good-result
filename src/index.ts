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

export type ErrorResult<E> = { err: NonNullable<E>; val: null };

export type NullableResult<E, T> =
  | { err: NonNullable<E>; val: null }
  | { err: null; val: NonNullable<T> }
  | { err: null; val: null }

export type NonNullableResult<E, T> =
  | { err: NonNullable<E>; val: null }
  | { err: null; val: NonNullable<T> }

export const proceed = <T>(value: NonNullable<T>): NonNullableResult<never, T> => ({
  err: null,
  val: value,
});

export const proceedNullable = <T>(value: NonNullable<T>): NullableResult<never, T> => ({
  err: null,
  val: value,
});

export const errorOut = <E>(error: NonNullable<E>): ErrorResult<E> => ({
  err: error,
  val: null,
});

export async function result<T, E = AnyResultError>(
  fn: Promise<T> | (() => T),
  options?: {
    errorHandler?: (error: unknown) => NonNullable<E>;
    nullError?: undefined; // Allows `null` as a valid value
  }
): Promise<NullableResult<E, T | null>>;

export async function result<T, E = AnyResultError>(
  fn: Promise<T> | (() => T),
  options: {
    errorHandler?: (error: unknown) => NonNullable<E>;
    nullError: NonNullable<E>; // Forces `null` to be an error
  }
): Promise<NonNullableResult<E | AnyResultError, NonNullable<T>>>;

export async function result<T, E = AnyResultError>(
  fn: Promise<T> | (() => T),
  options?: {
    errorHandler?: (error: unknown) => NonNullable<E>;
    nullError?: NonNullable<E>;
  }
): Promise<NullableResult<E | AnyResultError, T> | NonNullableResult<E | AnyResultError, T>> {
  try {
    const data = typeof fn === 'function' ? fn() : await fn;
    if (typeof options?.nullError !== 'undefined') {
      if (data === null) {
        return errorOut(options.nullError);
      } else {
        return proceed(data as NonNullable<T>) as NonNullableResult<E, T>;
      }
    }
    return proceed(data as NonNullable<T>) as NullableResult<E, T>;
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

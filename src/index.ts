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
    noResultError: AnyResultError; // Forces `null` to be an error
  }
): Promise<Result<E, NonNullable<T>>>;

export async function result<T, E = AnyResultError>(
  fn: Promise<T> | (() => T),
  options?: {
    errorHandler?: (error: unknown) => NonNullable<E>;
    noResultError?: AnyResultError;
  }
): Promise<Result<E, T | null>> {
  try {
    const data = typeof fn === 'function' ? fn() : await fn;
    if (data === null && options?.noResultError) {
      return errorOut(options.noResultError) as Result<E, T | null>
    }
    return proceed(data as NonNullable<T>);
  } catch (error: unknown) {
    let handledError;

    if (options?.errorHandler) {
      handledError = options.errorHandler(error);
    } else if (
      error instanceof Error ||
      error instanceof HttpResponseError ||
      error instanceof ResultError
    ) {
      handledError = error;
    } else {
      handledError = new ResultError(`Unknown error\n${String(fn)}`);
    }

    return errorOut(handledError as NonNullable<E>);
  }
}

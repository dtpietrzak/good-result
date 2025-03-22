export class HttpResponseError extends Error {
  code?: number;
  constructor(message: string = 'Internal Server Error', code: number = 500) {
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

export async function result<T, E = Error>(
  fn: Promise<T> | (() => T),
  options?: {
    errorHandler?: (error: unknown) => NonNullable<E>;
    noResultError?: undefined; // Allows `null` as a valid value
  }
): Promise<Result<E, T | null>>;

export async function result<T, E = Error>(
  fn: Promise<T> | (() => T),
  options: {
    errorHandler?: (error: unknown) => NonNullable<E>;
    noResultError: typeof Error; // Forces `null` to be an error
  }
): Promise<Result<E, NonNullable<T>>>;

export async function result<T, E = Error>(
  fn: Promise<T> | (() => T),
  options?: {
    errorHandler?: (error: unknown) => NonNullable<E>;
    noResultError?: typeof Error;
  }
): Promise<Result<E, T | null>> {
  try {
    const data = typeof fn === 'function' ? fn() : await fn;
    if (data === null && options?.noResultError) {
      throw options.noResultError;
    }
    return proceed(data as NonNullable<T>);
  } catch (error: unknown) {
    const handledError =
      options?.errorHandler?.(error) ??
      (error instanceof Error ? error : new Error(`Resultify - Unknown error\n${String(fn)}`));

    return errorOut(handledError as NonNullable<E>);
  }
}

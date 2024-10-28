export class NoResultError extends Error {
  code?: number
  constructor(message?: string, code?: number) {
    super(message)
    this.name = 'NoResultError'
    this.message = message ?? 'No result found'
    this.code = code
  }
}

export type Result<E, T> = 
  | { err: NonNullable<E>; val: null }
  | { err: null; val: T };

export const proceed = <E, T>(value: T): Result<E, T> => ({
  err: null,
  val: value,
})

export const errorOut = <E, T>(error: NonNullable<E>): Result<E, T> => ({
  err: error,
  val: null,
})

export async function result<T, E = Error>(
  fn: Promise<T> | (() => T),
  options?: {
    errorHandler?: (error: unknown) => NonNullable<E>,
    noResultError?: undefined,
  }): Promise<Result<E, T>>

export async function result<T, E = Error>(
  fn: Promise<T> | (() => T),
  options?: {
    errorHandler?: (error: unknown) => NonNullable<E>,
    noResultError: NoResultError,
  }): Promise<Result<E, NonNullable<T>>>

export async function result<T, E = Error>(
  fn: Promise<T> | (() => T),
  options?: {
    errorHandler?: (error: unknown) => NonNullable<E>,
    noResultError?: NoResultError,
  }): Promise<Result<E, T> | Result<E, NonNullable<T>>> {
  try {
    const data = typeof fn === 'function' ? fn() : await fn
    if (!data && options?.noResultError) {
      if (options?.noResultError) throw options.noResultError
      else throw NoResultError
    }
    return proceed(data)
  } catch (error) {
    const handledError = options?.errorHandler 
      ? options.errorHandler(error) 
      : error || new Error(
        `Resultify - Unknown error\n${fn?.toString() ?? fn}`,
      )
    return errorOut(handledError as NonNullable<E>)
  }
}
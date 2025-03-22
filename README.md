# result Utility Function

The `result` function helps you execute a function or promise while capturing errors in a structured way. It ensures that results and errors are explicitly handled using a `Result<E, T>` type.

## Installation

If this is part of an npm package, install it as:

``` ts
npm install good-result
```

## Usage

### Basic Example

```ts
const goodFn = async () => 'Success!'
const badFn = async () => {
  throw new Error('Something went wrong')
}

const goodValue = await result(goodFn)
if (goodValue.err) return response(500, "Internal Server Error")

doSomething(goodValue.val)

const badValue = await result(badFn)
if (badValue.err) return response(500, "Internal Server Error")

doSomething(badValue.val) // doesn't get here
```

## Return Type: `Result<E, T>`

The function returns an object of type:

```ts
type Result<E, T> =
  | { err: NonNullable<E>; val: null }  // When an error occurs
  | { err: null; val: NonNullable<T> }; // When successful
```

This means you should always check `result.err` before using the `result.val`

## ESLint Rule

To ensure proper usage, you can use the `eslint-plugin-good-result` ESLint rule. This rule enforces that any result from `result` is followed by an `if (result.err)` check.

### ESLint Rule Installation

``` ts
npm install --save-dev eslint-plugin-good-result
```

### Configuration

Add it to your ESLint configuration:

```json
{
  "plugins": ["good-result"],
  "rules": {
    "good-result/ensure-error-check": "error"
  }
}
```

This will enforce:

```ts
const value = await result(fetchSomething);
if (value.err) {
  console.error(value.err);
  return;
}

console.log(value.val); // Safe to access
```

## Options

The function accepts an optional configuration object:

### 1. Custom Error Handler

You can transform errors before they are returned.

```ts
const resultValue = await result(someFunction, {
  errorHandler: (error) => new CustomError(`Wrapped: ${error}`)
});
```

### 2. Handling `null` as an Error

If your function returns `null`, you can treat it as an error by providing `NoResultError`.

```ts
const fetchData = async () => null;

const resultValue = await result(fetchData, {
  noResultError: new NoResultError('No data found', 404),
});

if (resultValue.err) {
  console.error(resultValue.err.message); // Logs: No data found
}
```

## When to Use `result`

- ✅ Wrapping async functions to prevent uncaught errors
- ✅ Standardizing error handling in APIs or services
- ✅ Avoiding `try/catch` blocks everywhere
- ✅ Distinguishing between **errors** and **expected null results**

## FAQ

### ❓ What happens if I pass a synchronous function?

`result` works for both synchronous and asynchronous functions:

```ts
const syncFunction = () => 'Hello, World!';
const resultValue = await result(syncFunction);
console.log(resultValue.val); // "Hello, World!"
```

### ❓ What if my function throws a non-`Error` value?

If an error is not an instance of `Error`, it is wrapped in a generic `Error` object.

## Conclusion

The `result` utility function ensures structured error handling while allowing you to control how `null` values are treated. It simplifies async error management, making your code cleaner and safer.

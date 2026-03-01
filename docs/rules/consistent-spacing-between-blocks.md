# Require consistent spacing between blocks (`nodetest/consistent-spacing-between-blocks`)

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

`node:test` provides a structured way of writing tests using functions like `describe`, `suite`, `it`, `test`, `before`, `after`, `beforeEach`, and `afterEach`. As a convention, it is very common to add some spacing between these calls. It's unfortunately also quite common that this spacing is applied inconsistently.

Example:

```js
describe("MyComponent", function () {
  beforeEach(function () {
    // setup code
  });
  it("should behave correctly", function () {
    // test code
  });
  afterEach(function () {
    // teardown code
  });
});
```

In this example, there are no line breaks between function calls, making the code harder to read.

## Rule Details

This rule enforces a line break between calls to `node:test` functions (before, after, describe, suite, it, test, beforeEach, afterEach) within describe/suite blocks.

Examples of **incorrect** code for this rule:

```js
describe("MyComponent", function () {
  beforeEach(function () {
    // setup code
  });
  it("should behave correctly", function () {
    // test code
  });
});
```

```js
suite("MyComponent", function () {
  beforeEach(function () {
    // setup code
  });
  test("should behave correctly", function () {
    // test code
  });
});
```

Examples of **correct** code for this rule:

```js
describe("MyComponent", function () {
  beforeEach(function () {
    // setup code
  });

  it("should behave correctly", function () {
    // test code
  });
});
```

```js
suite("MyComponent", function () {
  beforeEach(function () {
    // setup code
  });

  test("should behave correctly", function () {
    // test code
  });
});
```

## When Not To Use It

If you don't prefer this convention.

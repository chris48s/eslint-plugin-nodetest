# Disallow duplicate uses of a hook at the same level inside a suite (`nodetest/no-sibling-hooks`)

<!-- end auto-generated rule header -->

`node:test` provides hooks that allow code to be run before or after every or all tests. This helps define a common setup or teardown process for every test. It is possible to declare a hook multiple times inside the same test suite, but it can be confusing. It is better to have one hook handle the whole of the setup or teardown logic of the test suite.

## Rule Details

This rule looks for every call to `before`, `after`, `beforeEach` and `afterEach` and reports them if they are called at least twice inside of a test suite at the same level.

Examples of **incorrect** code for this rule:

```js
describe('foo', function () {
    var mockUser;
    var mockLocation;

    before(function () { // Is allowed this time
        mockUser = { age: 50 };
    });

    before(function () { // Duplicate! Is not allowed this time
        mockLocation = { city: 'New York' };
    });

    // Same for the other hooks
    after(function () {});
    after(function () {}); // Duplicate!

    beforeEach(function () {});
    beforeEach(function () {}); // Duplicate!

    afterEach(function () {});
    afterEach(function () {}); // Duplicate!
});
```

Examples of **correct** code for this rule:

```js
describe('foo', function () {
    var mockUser;
    var mockLocation;

    before(function () { // Is allowed this time
        mockUser = { age: 50 };
        mockLocation = { city: 'New York' };
    });

    describe('bar', function () {
        before(function () { // Is allowed because it's nested in a new describe
            // ...
        });
    });
});
```

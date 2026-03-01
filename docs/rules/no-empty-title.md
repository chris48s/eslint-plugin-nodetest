# nodetest/no-empty-title

📝 Disallow empty test descriptions.

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

This rule requires you to specify the suite/test descriptions for each test.

## Rule Details

This rule checks each test function has a non-empty description.

Examples of **incorrect** code for this rule:

```js
it();

suite("");

test(function () {});

test.only(" ", function () {});
```

Examples of **correct** code for this rule:

```js
describe("foo", function () {
  it("bar");
});

suite("foo", function () {
  test("bar");
});
```

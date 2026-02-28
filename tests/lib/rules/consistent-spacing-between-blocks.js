/**
 * @fileoverview Require consistent spacing between blocks
 * @author chris48s
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/consistent-spacing-between-blocks"),
  RuleTester = require("eslint").RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: "script" },
});

ruleTester.run("consistent-spacing-between-blocks", rule, {
  valid: [
    // Single call inside describe — no previous sibling, no blank line needed
    {
      code: `describe('MyComponent', function () {
    it('does something', function () {});
});`,
    },

    // Proper blank line between it() calls inside describe
    `describe('MyComponent', () => {
    it('performs action one', () => {});

    it('performs action two', () => {});
});`,

    // Proper blank line between beforeEach and it inside describe
    `describe('MyComponent', () => {
    beforeEach(() => {});

    it('does something', () => {});
});`,

    // Proper blank lines inside suite/test syntax
    `suite('MyComponent', () => {
    beforeEach(() => {});

    test('does something', () => {});
});`,

    // Nested describe blocks with proper spacing
    `describe('Outer', () => {
    describe('Inner', () => {
        it('performs an action', () => {});
    });

    afterEach(() => {});
});`,

    // top-level calls with a blank line between them
    `describe('first suite', () => {});

describe('second suite', () => {});`,

    // Two top-level describe calls separated with blank line
    `describe();

describe();`,

    // Single call at top level — no previous sibling
    `describe('only suite', () => {});`,

    // it() outside a describe — no previous sibling, no blank line needed
    `it('does something outside a describe block', () => {});`,

    // Comments between blocks should count as sufficient spacing
    `describe('My Test With Comments', () => {
    it('does something', () => {});

    // Some comment
    afterEach(() => {});
});`,

    // Chained call .timeout() — single item in suite, no blank line needed
    {
      code: `describe('foo', () => {
    it('bar', () => {}).timeout(42);
});`,
    },

    // Chained calls with proper blank line
    {
      code: `describe('foo', () => {
    it('bar', () => {}).timeout(42);

    it('baz', () => {}).timeout(42);
});`,
    },

    // Multi-line chained calls with proper blank line
    {
      code: `describe('foo', () => {
    it('bar', () => {})
        .timeout(42);

    it('baz', () => {})
        .timeout(42);
});`,
    },

    // Array .forEach pattern inside describe — treated as a single statement
    {
      code: `describe('foo', () => {
    [
        { title: 'bar' },
        { title: 'baz' },
    ].forEach((testCase) => {
        it(testCase.title, () => {});
    });
});`,
    },

    // Two top-level it() calls with blank line — no describe wrapper
    `it('does something outside a describe block', () => {});

afterEach(() => {});`,

    // before/after hooks with proper spacing
    `describe('hooks', () => {
    before(() => {});

    after(() => {});
});`,

    // describe.only / it.skip / test.todo variants with proper blank lines
    `describe.only('first suite', () => {});

describe.only('second suite', () => {});`,

    `describe('outer', () => {
    it.skip('first', () => {});

    it.skip('second', () => {});
});`,

    `describe.only('outer', () => {
    it.only('first', () => {});

    it.only('second', () => {});
});`,

    // Single describe.only at top level — no blank line needed
    `describe.only('only suite', () => {});`,

    // Function reference callback — proper spacing inside handler suite
    `describe('suite', handler);

function handler() {
    it('foo', () => {});

    it('bar', () => {});
}`,

    // Arrow function reference — proper spacing
    `const handler = () => {
    it('foo', () => {});

    it('bar', () => {});
};

describe('suite', handler);`,

    // Single call inside function reference suite — no blank line needed
    `describe('suite', handler);

function handler() {
    it('foo', () => {});
}`,
  ],

  invalid: [
    // Missing blank line between it() and afterEach() inside describe
    {
      code: `describe('My Test', function () {
    it('does something', () => {});
    afterEach(() => {});
});`,
      output: `describe('My Test', function () {
    it('does something', () => {});

    afterEach(() => {});
});`,
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Missing blank line between beforeEach() and it() inside describe
    {
      code: `describe('My Test', () => {
    beforeEach(() => {});
    it('does something', () => {});
});`,
      output: `describe('My Test', () => {
    beforeEach(() => {});

    it('does something', () => {});
});`,
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Same pattern with suite/test syntax
    {
      code: `suite('My Test', () => {
    beforeEach(() => {});
    test('does something', () => {});
});`,
      output: `suite('My Test', () => {
    beforeEach(() => {});

    test('does something', () => {});
});`,
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Missing blank line after a variable declaration before a test call
    {
      code: `describe('Variable declaration', () => {
    const a = 1;
    it('uses a variable', () => {});
});`,
      output: `describe('Variable declaration', () => {
    const a = 1;

    it('uses a variable', () => {});
});`,
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Two test calls on the same line inside describe
    {
      code:
        "describe('Same line blocks', () => {" +
        "it('block one', () => {});" +
        "it('block two', () => {});" +
        "});",
      output:
        "describe('Same line blocks', () => {" +
        "it('block one', () => {});" +
        "\n\n" +
        "it('block two', () => {});" +
        "});",
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Chained call without blank line before next sibling
    {
      code:
        "describe('Same line blocks', () => {" +
        "it('block one', () => {})\n.timeout(42);" +
        "it('block two', () => {});" +
        "});",
      output:
        "describe('Same line blocks', () => {" +
        "it('block one', () => {})\n.timeout(42);" +
        "\n\n" +
        "it('block two', () => {});" +
        "});",
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Two top-level describe calls without blank line (same line)
    {
      code: 'describe("", () => {});describe("", () => {});',
      output: 'describe("", () => {});\n\ndescribe("", () => {});',
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Two top-level describe calls without blank line (only a newline, no blank line)
    {
      code: "describe();\ndescribe();",
      output: "describe();\n\ndescribe();",
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Missing blank line between multiple it() calls inside describe (two errors)
    {
      code: `describe('Multiple', () => {
    it('first', () => {});
    it('second', () => {});
    it('third', () => {});
});`,
      output: `describe('Multiple', () => {
    it('first', () => {});

    it('second', () => {});

    it('third', () => {});
});`,
      errors: [
        { messageId: "missingLineBreak", type: "CallExpression" },
        { messageId: "missingLineBreak", type: "CallExpression" },
      ],
    },

    // Missing blank line between before() and after() hooks
    {
      code: `describe('hooks', () => {
    before(() => {});
    after(() => {});
});`,
      output: `describe('hooks', () => {
    before(() => {});

    after(() => {});
});`,
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // describe.only calls at top level without blank line
    {
      code: `describe.only('first suite', () => {});
describe.only('second suite', () => {});`,
      output: `describe.only('first suite', () => {});

describe.only('second suite', () => {});`,
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // it.skip calls inside describe without blank line
    {
      code: `describe('outer', () => {
    it.skip('first', () => {});
    it.skip('second', () => {});
});`,
      output: `describe('outer', () => {
    it.skip('first', () => {});

    it.skip('second', () => {});
});`,
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Mixed: regular it followed by it.only without blank line
    {
      code: `describe('outer', () => {
    it('first', () => {});
    it.only('second', () => {});
});`,
      output: `describe('outer', () => {
    it('first', () => {});

    it.only('second', () => {});
});`,
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Nested: missing blank line inside describe.only
    {
      code: `describe.only('Outer', () => {
    it('first', () => {});
    it('second', () => {});
});`,
      output: `describe.only('Outer', () => {
    it('first', () => {});

    it('second', () => {});
});`,
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Nested: missing blank line inside inner describe
    {
      code: `describe('Outer', () => {
    describe('Inner', () => {
        it('first', () => {});
        it('second', () => {});
    });
});`,
      output: `describe('Outer', () => {
    describe('Inner', () => {
        it('first', () => {});

        it('second', () => {});
    });
});`,
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Function reference callback — missing blank line inside handler suite
    // only it('bar') is flagged because it('foo') is the first item in scope
    {
      code: `describe('suite', handler);

function handler() {
    it('foo', () => {});
    it('bar', () => {});
}`,
      output: `describe('suite', handler);

function handler() {
    it('foo', () => {});

    it('bar', () => {});
}`,
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },

    // Arrow function reference — missing blank line inside handler suite
    {
      code: `const handler = () => {
    it('foo', () => {});
    it('bar', () => {});
};

describe('suite', handler);`,
      output: `const handler = () => {
    it('foo', () => {});

    it('bar', () => {});
};

describe('suite', handler);`,
      errors: [{ messageId: "missingLineBreak", type: "CallExpression" }],
    },
  ],
});

/**
 * @fileoverview Disallow identical titles
 * @author chris48s
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/no-identical-title"),
  RuleTester = require("eslint").RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: "script" },
});

ruleTester.run("no-identical-title", rule, {
  valid: [
    // Different titles within the same describe
    `describe('describe', function() {
  it('it1', function() {});
  it('it2', function() {});
})`,

    // Two it() at top level with different titles
    `it('it1', function() {});
it('it2', function() {});`,

    // it.only and it with different titles
    `it.only('it1', function() {});
it('it2', function() {});`,

    // A suite title and a test title can be the same at the same level
    `describe('title', function() {});
it('title', function() {});`,

    // Same test title in different (sibling) suites — allowed
    `describe('describe 1', function() {
  it('it', function() {});
});
describe('describe 2', function() {
  it('it', function() {});
});`,

    // Same test title in parent vs nested suite — allowed
    `describe('describe1', function() {
  it('it1', function() {});
  describe('describe2', function() {
    it('it1', function() {});
  });
});`,

    // Same suite title nested inside another suite with same title at top level — allowed
    `describe('describe1', function() {
  describe('describe2', function() {});
});
describe('describe2', function() {});`,

    // Two different suites at top level
    `describe('describe1', function() {});
describe('describe2', function() {});`,

    // Dynamic (non-literal) titles are not compared
    `it('it' + n, function() {});
it('it' + n, function() {});`,

    // Template literals with expressions — not compared
    `it(\`it\${n}\`, function() {});
it(\`it\${n}\`, function() {});`,

    // Static template literals with different content — allowed
    "it(`it1`, function() {});\nit(`it2`, function() {});",

    // Unrecognised function — ignored
    `notTest('title', function() {});
notTest('title', function() {});`,

    // suite() / test() syntax — different titles
    `suite('suite1', function() {
  test('test1', function() {});
  test('test2', function() {});
});`,

    // Arrow function callbacks
    `describe('describe1', () => {
  it('it1', () => {});
  it('it2', () => {});
});`,

    // describe.only — different titles
    `describe.only('describe1', function() {});
describe.only('describe2', function() {});`,

    // Deeper chains — different titles, should be valid
    `describe.skip.only('describe1', function() {});
describe.skip.only('describe2', function() {});`,

    // Function reference callback — title inside handler is in a different scope
    // from the outer title: should NOT be flagged as a duplicate
    `function handler() { it('title', function() {}); }
describe('suite', handler);
it('title', function() {});`,

    // Arrow function reference — same rule
    `const handler = () => { it('title', () => {}); };
describe('suite', handler);
it('title', () => {});`,

    // Function expression reference
    `const handler = function() { it('title', function() {}); };
describe('suite', handler);
it('title', function() {});`,

    // Suite title inside function reference doesn't conflict at outer level
    `function handler() { describe('nested', function() {}); }
describe('suite', handler);
describe('nested', function() {});`,
  ],

  invalid: [
    // Duplicate test titles inside a describe
    {
      code: `describe('describe1', function() {
  it('it1', function() {});
  it('it1', function() {});
});`,
      errors: [{ messageId: "duplicateTestTitle", line: 3 }],
    },

    // Duplicate test titles at top level
    {
      code: `it('it1', function() {});
it('it1', function() {});`,
      errors: [{ messageId: "duplicateTestTitle", line: 2 }],
    },

    // it.only and it with the same title
    {
      code: `it.only('it1', function() {});
it('it1', function() {});`,
      errors: [{ messageId: "duplicateTestTitle", line: 2 }],
    },

    // Two it.only with the same title
    {
      code: `it.only('it1', function() {});
it.only('it1', function() {});`,
      errors: [{ messageId: "duplicateTestTitle", line: 2 }],
    },

    // it and test both count as tests — same title is a duplicate
    {
      code: `it('title', function() {});
test('title', function() {});`,
      errors: [{ messageId: "duplicateTestTitle", line: 2 }],
    },

    // Duplicate suite titles at the top level
    {
      code: `describe('describe1', function() {});
describe('describe1', function() {});`,
      errors: [{ messageId: "duplicateSuiteTitle", line: 2 }],
    },

    // describe and suite both count as suites — same title is a duplicate
    {
      code: `describe('title', function() {});
suite('title', function() {});`,
      errors: [{ messageId: "duplicateSuiteTitle", line: 2 }],
    },

    // describe.only and describe with the same title
    {
      code: `describe.only('describe1', function() {});
describe('describe1', function() {});`,
      errors: [{ messageId: "duplicateSuiteTitle", line: 2 }],
    },

    // Duplicate suite titles at top level when one is nested inside a suite
    {
      code: `describe('describe1', function() {
  describe('describe2', function() {});
});
describe('describe1', function() {});`,
      errors: [{ messageId: "duplicateSuiteTitle", line: 4 }],
    },

    // Duplicate test titles using test() inside suite()
    {
      code: `suite('suite1', function() {
  test('test1', function() {});
  test('test1', function() {});
});`,
      errors: [{ messageId: "duplicateTestTitle", line: 3 }],
    },

    // Multiple duplicates in the same scope
    {
      code: `describe('describe1', function() {
  it('it1', function() {});
  it('it2', function() {});
  it('it1', function() {});
  it('it2', function() {});
});`,
      errors: [
        { messageId: "duplicateTestTitle", line: 4 },
        { messageId: "duplicateTestTitle", line: 5 },
      ],
    },

    // Duplicate suite titles within a describe
    {
      code: `describe('outer', function() {
  describe('inner', function() {});
  describe('inner', function() {});
});`,
      errors: [{ messageId: "duplicateSuiteTitle", line: 3 }],
    },

    // Arrow function callbacks — duplicates still flagged
    {
      code: `describe('describe1', () => {
  it('it1', () => {});
  it('it1', () => {});
});`,
      errors: [{ messageId: "duplicateTestTitle", line: 3 }],
    },

    // Static template literals — duplicate test titles
    {
      code: "describe('foo', () => {\n  it(`catches backticks with the same title`, () => {});\n  it(`catches backticks with the same title`, () => {});\n});",
      errors: [{ messageId: "duplicateTestTitle", line: 3 }],
    },

    // Static template literals — duplicate suite titles
    {
      code: "describe(`suite one`, function() {});\ndescribe(`suite one`, function() {});",
      errors: [{ messageId: "duplicateSuiteTitle", line: 2 }],
    },

    // Mixed: string literal and static template literal with same content
    {
      code: "it('my title', () => {});\nit(`my title`, () => {});",
      errors: [{ messageId: "duplicateTestTitle", line: 2 }],
    },

    // Deeper chains — duplicate suite titles via deeper MemberExpression chain
    {
      code: `describe.skip.only('title', function() {});
describe.skip.only('title', function() {});`,
      errors: [{ messageId: "duplicateSuiteTitle", line: 2 }],
    },

    // Deeper chains — duplicate test titles via deeper MemberExpression chain
    {
      code: `describe('outer', function() {
  it.skip.only('title', function() {});
  it.skip.only('title', function() {});
});`,
      errors: [{ messageId: "duplicateTestTitle", line: 3 }],
    },

    // Function reference callback — duplicate test titles inside handler suite
    {
      code: `describe('suite', handler);
function handler() {
  it('foo', function() {});
  it('foo', function() {});
}`,
      errors: [{ messageId: "duplicateTestTitle", line: 4 }],
    },

    // Function reference callback — duplicate suite titles inside handler suite
    {
      code: `describe('suite', handler);
function handler() {
  describe('nested', function() {});
  describe('nested', function() {});
}`,
      errors: [{ messageId: "duplicateSuiteTitle", line: 4 }],
    },
  ],
});

/**
 * @file Disallow empty test descriptions
 * @author chris48s
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/no-empty-title"),
  RuleTester = require("eslint").RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: "script" },
});

const error = { messageId: "noEmptyTitle" };

ruleTester.run("no-empty-title", rule, {
  valid: [
    // Non-empty string titles — all four core functions
    "describe('some text')",
    "describe('some text', function() {})",
    "suite('some text')",
    "suite('some text', function() {})",
    "it('some text')",
    "it('some text', function() {})",
    "test('some text')",
    "test('some text', function() {})",

    // .only / .skip variants with non-empty titles
    "describe.only('some text', function() {})",
    "describe.skip('some text', function() {})",
    "it.only('some text', function() {})",
    "it.skip('some text', function() {})",
    "test.only('some text', function() {})",
    "test.skip('some text', function() {})",
    "suite.only('some text', function() {})",
    "suite.skip('some text', function() {})",

    // Deeper chains with non-empty titles — should be allowed
    "describe.skip.only('some text', function() {})",
    "it.skip.only('some text', function() {})",

    // Dynamic identifiers — cannot be statically analysed, so allowed
    "var dynamicTitle = 'foo'; it(dynamicTitle, function() {})",
    "it(dynamicTitle, function() {})",

    // Dynamic expressions — allowed
    "it(foo.bar, function() {})",
    "it('foo'.toUpperCase(), function() {})",
    "it(foo || 'bar', function() {})",
    "it(foo ? 'bar' : 'baz', function() {})",
    "it(foo + bar, function() {})",
    "it('foo' + 'bar', function() {})",

    // Non-string literals — allowed (not a string, so not an empty title)
    "it(42, function() {})",
    "it(true, function() {})",
    "it(null, function() {})",

    // Template literals — allowed when non-empty or contain expressions
    "it(`some text`, function() {})",
    "it(`${foo} template`, function() {})",

    // Not a recognised test function — ignored
    "notTest()",
    "notTest('', function() {})",
  ],

  invalid: [
    // No arguments
    {
      code: "it()",
      errors: [error],
    },
    {
      code: "test()",
      errors: [error],
    },
    {
      code: "describe()",
      errors: [error],
    },
    {
      code: "suite()",
      errors: [error],
    },

    // Function passed as first argument (title omitted entirely)
    {
      code: "it(function() {})",
      errors: [error],
    },
    {
      code: "test(function() {})",
      errors: [error],
    },
    {
      code: "describe(function() {})",
      errors: [error],
    },
    {
      code: "it(() => {})",
      errors: [error],
    },

    // Empty string
    {
      code: "it('', function() {})",
      errors: [error],
    },
    {
      code: "test('', function() {})",
      errors: [error],
    },
    {
      code: "describe('', function() {})",
      errors: [error],
    },
    {
      code: "suite('')",
      errors: [error],
    },

    // Whitespace-only string
    {
      code: "it('   ', function() {})",
      errors: [error],
    },
    {
      code: "test('   ', function() {})",
      errors: [error],
    },

    // Whitespace-only template literal
    {
      code: "it(` `, function() {})",
      errors: [error],
    },
    {
      code: "it(``, function() {})",
      errors: [error],
    },

    // .only / .skip with empty titles
    {
      code: "it.only('', function() {})",
      errors: [error],
    },
    {
      code: "test.only(' ', function() {})",
      errors: [error],
    },
    {
      code: "describe.skip('', function() {})",
      errors: [error],
    },
    {
      code: "suite.only('', function() {})",
      errors: [error],
    },

    // Deeper chains with empty titles — should also be flagged
    {
      code: "describe.skip.only('', function() {})",
      errors: [error],
    },
    {
      code: "it.skip.only('', function() {})",
      errors: [error],
    },
  ],
});

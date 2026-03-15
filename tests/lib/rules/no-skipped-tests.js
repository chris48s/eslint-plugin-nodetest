/**
 * @file Disallow skipped tests
 * @author chris48s
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import rule from "../../../lib/rules/no-skipped-tests.js";
import { RuleTester } from "eslint";
import { describe, it } from "node:test";

RuleTester.describe = describe;
RuleTester.it = it;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: "script" },
});

const error = { messageId: "noSkippedTests" };

ruleTester.run("no-skipped-tests", rule, {
  valid: [
    // Plain calls — not skipped
    "describe('foo', function () {})",
    "it('foo', function () {})",
    "suite('foo', function () {})",
    "test('foo', function () {})",

    // .only variants — not skipped
    "describe.only('foo', function () {})",
    "it.only('foo', function () {})",
    "suite.only('foo', function () {})",
    "test.only('foo', function () {})",

    // Options object without skip
    "test('foo', {}, function () {})",
    "test('foo', { timeout: 1000 }, function () {})",

    // skip: false — explicitly not skipped
    "test('foo', { skip: false }, function () {})",

    // Not a recognised test function — ignored
    "notTest.skip('foo', function () {})",
    "notTest('foo', { skip: true }, function () {})",

    // t.skip is not called on the context param
    "test('foo', function (t) { other.skip(); })",

    // Context param shadowed by inner function — not the test context
    "test('foo', function (t) { function f(t) { t.skip(); } })",
    "test('foo', function (t) { const f = function(t) { t.skip(); }; })",
    "test('foo', function (t) { const f = (t) => { t.skip(); }; })",

    // Dynamic skip value — cannot be statically analysed, so allowed
    "test('foo', { skip: skipIt }, function () {})",
    "test('foo', { skip: getSkip() }, function () {})",
  ],

  invalid: [
    // .skip() method — dot notation
    {
      code: "describe.skip('foo', function () {})",
      errors: [error],
    },
    {
      code: "it.skip('foo', function () {})",
      errors: [error],
    },
    {
      code: "suite.skip('foo', function () {})",
      errors: [error],
    },
    {
      code: "test.skip('foo', function () {})",
      errors: [error],
    },

    // .skip() method — bracket notation
    {
      code: "describe['skip']('bar', function () {})",
      errors: [error],
    },
    {
      code: "it['skip']('bar', function () {})",
      errors: [error],
    },
    {
      code: "suite['skip']('bar', function () {})",
      errors: [error],
    },
    {
      code: "test['skip']('bar', function () {})",
      errors: [error],
    },

    // skip option: true
    {
      code: "test('foo', { skip: true }, function () {})",
      errors: [error],
    },
    {
      code: "it('foo', { skip: true }, function () {})",
      errors: [error],
    },

    // skip option: non-empty string
    {
      code: "test('foo', { skip: 'this is skipped' }, function () {})",
      errors: [error],
    },
    {
      code: "it('foo', { skip: 'this is skipped' }, function () {})",
      errors: [error],
    },

    // t.skip() inside test body — no message
    {
      code: "test('foo', function (t) { t.skip(); })",
      errors: [error],
    },
    {
      code: "it('foo', function (t) { t.skip(); })",
      errors: [error],
    },

    // t.skip() inside test body — with message
    {
      code: "test('foo', function (t) { t.skip('this is skipped'); })",
      errors: [error],
    },

    // t.skip() using arrow function
    {
      code: "test('foo', (t) => { t.skip(); })",
      errors: [error],
    },

    // Different context param name
    {
      code: "test('foo', function (ctx) { ctx.skip(); })",
      errors: [error],
    },

    // t.skip() accessed via closure (inner function does not shadow the param)
    {
      code: "test('foo', function (t) { function f() { t.skip(); } f(); })",
      errors: [error],
    },
  ],
});

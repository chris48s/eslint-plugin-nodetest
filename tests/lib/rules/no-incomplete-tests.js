/**
 * @file Disallow incomplete/TODO tests
 * @author chris48s
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import rule from "../../../lib/rules/no-incomplete-tests.js";
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

const error = { messageId: "noIncompleteTests" };

ruleTester.run("no-incomplete-tests", rule, {
  valid: [
    // Plain calls — not todo
    "describe('foo', function () {})",
    "it('foo', function () {})",
    "suite('foo', function () {})",
    "test('foo', function () {})",

    // .only variants — not todo
    "describe.only('foo', function () {})",
    "it.only('foo', function () {})",
    "suite.only('foo', function () {})",
    "test.only('foo', function () {})",

    // Options object without todo
    "test('foo', {}, function () {})",
    "test('foo', { timeout: 1000 }, function () {})",

    // todo: false — explicitly not todo
    "test('foo', { todo: false }, function () {})",

    // Not a recognised test function — ignored
    "notTest.todo('foo', function () {})",
    "notTest('foo', { todo: true }, function () {})",

    // t.todo is not called on the context param
    "test('foo', function (t) { other.todo(); })",

    // Context param shadowed by inner function — not the test context
    "test('foo', function (t) { function f(t) { t.todo(); } })",
    "test('foo', function (t) { const f = function(t) { t.todo(); }; })",
    "test('foo', function (t) { const f = (t) => { t.todo(); }; })",

    // Dynamic todo value — cannot be statically analysed, so allowed
    "test('foo', { todo: isTodo }, function () {})",
    "test('foo', { todo: getTodo() }, function () {})",
  ],

  invalid: [
    // .todo method — dot notation
    {
      code: "describe.todo('foo', function () {})",
      errors: [error],
    },
    {
      code: "it.todo('foo', function () {})",
      errors: [error],
    },
    {
      code: "suite.todo('foo', function () {})",
      errors: [error],
    },
    {
      code: "test.todo('foo', function () {})",
      errors: [error],
    },

    // .todo method — bracket notation
    {
      code: "describe['todo']('bar', function () {})",
      errors: [error],
    },
    {
      code: "it['todo']('bar', function () {})",
      errors: [error],
    },
    {
      code: "suite['todo']('bar', function () {})",
      errors: [error],
    },
    {
      code: "test['todo']('bar', function () {})",
      errors: [error],
    },

    // todo option: true
    {
      code: "test('foo', { todo: true }, function () {})",
      errors: [error],
    },
    {
      code: "it('foo', { todo: true }, function () {})",
      errors: [error],
    },

    // todo option: non-empty string
    {
      code: "test('foo', { todo: 'this is todo' }, function () {})",
      errors: [error],
    },
    {
      code: "it('foo', { todo: 'this is todo' }, function () {})",
      errors: [error],
    },

    // t.todo() inside test body
    {
      code: "test('foo', function (t) { t.todo(); })",
      errors: [error],
    },
    {
      code: "it('foo', function (t) { t.todo(); })",
      errors: [error],
    },

    // t.todo() with message
    {
      code: "test('foo', function (t) { t.todo('remember to implement this'); })",
      errors: [error],
    },

    // t.todo() using arrow function
    {
      code: "test('foo', (t) => { t.todo(); })",
      errors: [error],
    },

    // Different context param name
    {
      code: "test('foo', function (ctx) { ctx.todo(); })",
      errors: [error],
    },

    // t.todo() accessed via closure (inner function does not shadow the param)
    {
      code: "test('foo', function (t) { function f() { t.todo(); } f(); })",
      errors: [error],
    },
  ],
});

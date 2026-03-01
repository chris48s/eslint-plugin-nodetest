/**
 * @file Disallow empty test descriptions
 * @author chris48s
 */
"use strict";

const { getCalleeName } = require("../utils");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const TEST_FUNCTIONS = new Set(["describe", "suite", "it", "test"]);

function isTestFunctionCall(node) {
  return (
    node.type === "CallExpression" && TEST_FUNCTIONS.has(getCalleeName(node))
  );
}

function hasEmptyTitle(node) {
  const firstArg = node.arguments[0];

  // No arguments at all
  if (!firstArg) return true;

  // First argument is a function — title was omitted
  if (
    firstArg.type === "FunctionExpression" ||
    firstArg.type === "ArrowFunctionExpression"
  ) {
    return true;
  }

  // String literal — flag if empty or whitespace-only
  if (firstArg.type === "Literal" && typeof firstArg.value === "string") {
    return firstArg.value.trim().length === 0;
  }

  // Template literal with no expressions — flag if empty or whitespace-only
  if (
    firstArg.type === "TemplateLiteral" &&
    firstArg.expressions.length === 0
  ) {
    const cooked = firstArg.quasis[0].value.cooked;
    const raw = firstArg.quasis[0].value.raw;
    const content = cooked !== null ? cooked : raw;
    return content.trim().length === 0;
  }

  // Dynamic or non-string argument — allow
  return false;
}

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow empty test descriptions",
      recommended: false,
      url: "https://github.com/chris48s/eslint-plugin-nodetest/blob/main/docs/rules/no-empty-title.md",
    },
    fixable: null,
    schema: [],
    messages: {
      noEmptyTitle: "Unexpected empty test description.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        if (isTestFunctionCall(node) && hasEmptyTitle(node)) {
          context.report({ node, messageId: "noEmptyTitle" });
        }
      },
    };
  },
};

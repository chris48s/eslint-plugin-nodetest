/**
 * @fileoverview Disallow duplicate uses of a hook at the same level inside a suite
 * @author chris48s
 */
"use strict";

const { getCalleeName, collectSuiteCallbackIdentifiers, isSuiteCallbackByReference } = require("../utils");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const SUITE_FUNCTIONS = new Set(["describe", "suite"]);
const HOOK_FUNCTIONS = new Set(["before", "after", "beforeEach", "afterEach"]);

function getHookName(node) {
  // Only flag plain calls like before() — not member expressions like t.before()
  if (node.callee && node.callee.type === "Identifier") {
    return node.callee.name;
  }
  return null;
}

function isSuiteFunctionCall(node) {
  return (
    node.type === "CallExpression" && SUITE_FUNCTIONS.has(getCalleeName(node))
  );
}

function isSuiteCallbackFunction(node) {
  const parent = node.parent;
  if (!parent || parent.type !== "CallExpression") {
    return false;
  }
  if (!isSuiteFunctionCall(parent)) {
    return false;
  }
  return parent.arguments.includes(node);
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow duplicate uses of a hook at the same level inside a suite",
      recommended: false,
      url: "https://github.com/chris48s/eslint-plugin-nodetest/blob/main/docs/rules/no-sibling-hooks.md",
    },
    fixable: null,
    schema: [],
    messages: {
      duplicateHook:
        "Unexpected use of duplicate `{{hookName}}` hook.",
    },
  },

  create(context) {
    // Each entry is a Set of hook names already seen at that scope level.
    // The initial entry covers the top-level (Program) scope.
    let suiteCallbackIds = new Set();
    const layers = [new Set()];

    function enterSuite() {
      layers.push(new Set());
    }

    function exitSuite() {
      layers.pop();
    }

    return {
      Program(node) {
        suiteCallbackIds = collectSuiteCallbackIdentifiers(node, SUITE_FUNCTIONS);
      },

      FunctionDeclaration(node) {
        if (isSuiteCallbackByReference(node, suiteCallbackIds)) enterSuite();
      },

      "FunctionDeclaration:exit"(node) {
        if (isSuiteCallbackByReference(node, suiteCallbackIds)) exitSuite();
      },

      FunctionExpression(node) {
        if (isSuiteCallbackFunction(node) || isSuiteCallbackByReference(node, suiteCallbackIds)) enterSuite();
      },

      "FunctionExpression:exit"(node) {
        if (isSuiteCallbackFunction(node) || isSuiteCallbackByReference(node, suiteCallbackIds)) exitSuite();
      },

      ArrowFunctionExpression(node) {
        if (isSuiteCallbackFunction(node) || isSuiteCallbackByReference(node, suiteCallbackIds)) enterSuite();
      },

      "ArrowFunctionExpression:exit"(node) {
        if (isSuiteCallbackFunction(node) || isSuiteCallbackByReference(node, suiteCallbackIds)) exitSuite();
      },

      CallExpression(node) {
        const hookName = getHookName(node);
        if (!HOOK_FUNCTIONS.has(hookName)) return;

        const currentLayer = layers[layers.length - 1];
        if (currentLayer.has(hookName)) {
          context.report({
            node,
            messageId: "duplicateHook",
            data: { hookName },
          });
        } else {
          currentLayer.add(hookName);
        }
      },
    };
  },
};

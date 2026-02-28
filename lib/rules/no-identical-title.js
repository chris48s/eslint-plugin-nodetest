/**
 * @fileoverview Disallow identical titles
 * @author chris48s
 */
"use strict";

const { getCalleeName, collectSuiteCallbackIdentifiers, isSuiteCallbackByReference } = require("../utils");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const SUITE_FUNCTIONS = new Set(["describe", "suite"]);
const TEST_FUNCTIONS = new Set(["it", "test"]);

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

function getStringTitle(node) {
  const firstArg = node.arguments[0];
  if (!firstArg) return null;

  if (firstArg.type === "Literal" && typeof firstArg.value === "string") {
    return firstArg.value;
  }

  // Static template literal (no interpolations) — e.g. `my title`
  if (
    firstArg.type === "TemplateLiteral" &&
    firstArg.expressions.length === 0
  ) {
    const cooked = firstArg.quasis[0].value.cooked;
    return cooked !== null ? cooked : firstArg.quasis[0].value.raw;
  }

  return null;
}

function newLayer() {
  return { suiteTitles: [], testTitles: [] };
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow identical titles",
      recommended: false,
      url: "https://github.com/chris48s/eslint-plugin-nodetest/blob/main/docs/rules/no-identical-title.md",
    },
    fixable: null,
    schema: [],
    messages: {
      duplicateTestTitle:
        "Test title is used multiple times in the same test suite.",
      duplicateSuiteTitle: "Test suite title is used multiple times.",
    },
  },

  create(context) {
    let suiteCallbackIds = new Set();
    const layers = [newLayer()];

    function currentLayer() {
      return layers[layers.length - 1];
    }

    function enterSuite() {
      layers.push(newLayer());
    }

    function exitSuite() {
      layers.pop();
    }

    return {
      Program(node) {
        suiteCallbackIds = collectSuiteCallbackIdentifiers(node, SUITE_FUNCTIONS);
      },

      CallExpression(node) {
        const name = getCalleeName(node);
        const title = getStringTitle(node);

        if (title === null) return;

        if (SUITE_FUNCTIONS.has(name)) {
          if (currentLayer().suiteTitles.includes(title)) {
            context.report({ node, messageId: "duplicateSuiteTitle" });
          }
          currentLayer().suiteTitles.push(title);
        } else if (TEST_FUNCTIONS.has(name)) {
          if (currentLayer().testTitles.includes(title)) {
            context.report({ node, messageId: "duplicateTestTitle" });
          }
          currentLayer().testTitles.push(title);
        }
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
    };
  },
};

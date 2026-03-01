/**
 * @file Require consistent spacing between blocks
 * @author chris48s
 */
"use strict";

const {
  getCalleeName,
  collectSuiteCallbackIdentifiers,
  isSuiteCallbackByReference,
} = require("../utils");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const TEST_FUNCTIONS = new Set([
  "describe",
  "suite",
  "it",
  "test",
  "before",
  "after",
  "beforeEach",
  "afterEach",
]);

const SUITE_FUNCTIONS = new Set(["describe", "suite"]);

const MINIMUM_LINES_BETWEEN = 2;

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

function containsNode(container, node) {
  return (
    node.range[0] >= container.range[0] && node.range[1] <= container.range[1]
  );
}

function isFirstStatementInScope(scopeNode, node) {
  const body = scopeNode.body;
  if (!body || body.length === 0) {
    return true;
  }
  const firstStatement = body[0];
  return containsNode(firstStatement, node);
}

function getNodeForTokenCheck(node) {
  // Walk up the parent chain while the parent is a MemberExpression, so that
  // chained calls like it('foo', fn).timeout(42) are treated as one unit.
  if (node.parent && node.parent.type === "MemberExpression") {
    return getNodeForTokenCheck(node.parent);
  }
  return node;
}

/**
 * Returns true if there is at least one blank line somewhere between
 * `prevToken` and the start of `node`, taking comments into account.
 *
 * A blank line is a line with no code and no comments on it. It can appear
 * either before or after any comments that sit between the two blocks.
 *
 * @param {import("eslint").SourceCode} sourceCode
 * @param {Object} prevToken - The last code token of the preceding block
 * @param {import("eslint").Rule.Node} node - The start of the next block
 * @returns {boolean}
 */
function hasBlankLineBetween(sourceCode, prevToken, node) {
  const between = sourceCode.getTokensBetween(prevToken, node, {
    includeComments: true,
  });

  // Walk the sequence [prevToken, ...between] checking each consecutive gap.
  const all = [prevToken, ...between];
  const endLine = node.loc.start.line;

  for (let i = 0; i < all.length; i++) {
    const currEnd = all[i].loc.end.line;
    const nextStart = i + 1 < all.length ? all[i + 1].loc.start.line : endLine;
    if (nextStart - currEnd >= MINIMUM_LINES_BETWEEN) return true;
  }
  return false;
}

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require consistent spacing between blocks",
      recommended: false,
      url: "https://github.com/chris48s/eslint-plugin-nodetest/blob/main/docs/rules/consistent-spacing-between-blocks.md",
    },
    fixable: "whitespace",
    schema: [],
    messages: {
      missingLineBreak: "Expected line break before this statement.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;

    // Stack of layers. Each layer tracks the entities (test function calls)
    // inside a given scope (Program body or suite callback body).
    let suiteCallbackIds = new Set();
    const layers = [];

    function addEntityToCurrentLayer(node) {
      if (layers.length > 0) {
        layers[layers.length - 1].entities.push(node);
      }
    }

    function checkCurrentLayer() {
      const currentLayer = layers[layers.length - 1];

      for (const entity of currentLayer.entities) {
        const nodeForCheck = getNodeForTokenCheck(entity);
        const beforeToken = sourceCode.getTokenBefore(nodeForCheck);

        if (
          !isFirstStatementInScope(currentLayer.scopeNode, nodeForCheck) &&
          beforeToken !== null
        ) {
          if (!hasBlankLineBetween(sourceCode, beforeToken, nodeForCheck)) {
            context.report({
              node: entity,
              messageId: "missingLineBreak",
              fix(fixer) {
                // When a comment trails on the same line as the preceding code
                // token (e.g. `it(...); // note`), inserting the blank line
                // after the code token only shifts the comment down one line
                // without creating an actual blank line between the two blocks.
                // In that case, insert after the comment instead.
                const tokenBeforeInclComments = sourceCode.getTokenBefore(
                  nodeForCheck,
                  { includeComments: true },
                );
                const isTrailingComment =
                  tokenBeforeInclComments !== null &&
                  tokenBeforeInclComments.range[0] !== beforeToken.range[0] &&
                  tokenBeforeInclComments.loc.start.line ===
                    beforeToken.loc.end.line;
                const fixToken = isTrailingComment
                  ? tokenBeforeInclComments
                  : beforeToken;
                const linesBetween =
                  nodeForCheck.loc.start.line - fixToken.loc.end.line;
                return fixer.insertTextAfter(
                  fixToken,
                  linesBetween === 0 ? "\n\n" : "\n",
                );
              },
            });
          }
        }
      }
    }

    function enterSuiteCallback(node) {
      layers.push({ entities: [], scopeNode: node.body });
    }

    function exitSuiteCallback() {
      checkCurrentLayer();
      layers.pop();
    }

    return {
      Program(node) {
        suiteCallbackIds = collectSuiteCallbackIdentifiers(
          node,
          SUITE_FUNCTIONS,
        );
        layers.push({ entities: [], scopeNode: node });
      },

      "Program:exit"() {
        checkCurrentLayer();
        layers.pop();
      },

      FunctionDeclaration(node) {
        if (isSuiteCallbackByReference(node, suiteCallbackIds)) {
          enterSuiteCallback(node);
        }
      },

      "FunctionDeclaration:exit"(node) {
        if (isSuiteCallbackByReference(node, suiteCallbackIds)) {
          exitSuiteCallback();
        }
      },

      FunctionExpression(node) {
        if (
          isSuiteCallbackFunction(node) ||
          isSuiteCallbackByReference(node, suiteCallbackIds)
        )
          enterSuiteCallback(node);
      },

      "FunctionExpression:exit"(node) {
        if (
          isSuiteCallbackFunction(node) ||
          isSuiteCallbackByReference(node, suiteCallbackIds)
        )
          exitSuiteCallback();
      },

      ArrowFunctionExpression(node) {
        if (
          isSuiteCallbackFunction(node) ||
          isSuiteCallbackByReference(node, suiteCallbackIds)
        )
          enterSuiteCallback(node);
      },

      "ArrowFunctionExpression:exit"(node) {
        if (
          isSuiteCallbackFunction(node) ||
          isSuiteCallbackByReference(node, suiteCallbackIds)
        )
          exitSuiteCallback();
      },

      CallExpression(node) {
        const name = getCalleeName(node);
        if (TEST_FUNCTIONS.has(name)) {
          addEntityToCurrentLayer(node);
        }
      },
    };
  },
};

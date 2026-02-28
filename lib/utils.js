/**
 * @fileoverview Shared utilities for eslint-plugin-nodetest rules
 * @author chris48s
 */
"use strict";

/**
 * Returns the base identifier name for a call expression's callee.
 *
 * Walks the MemberExpression `.object` chain until it reaches an Identifier,
 * so that calls like `describe(...)`, `describe.only(...)`, and even deeper
 * chains like `describe.skip.only(...)` all return `"describe"`.
 *
 * @param {import('eslint').Rule.Node} node - A CallExpression node
 * @returns {string|null}
 */
function getCalleeName(node) {
  if (!node.callee) return null;

  let callee = node.callee;

  // Walk the object chain until we reach an Identifier
  while (callee.type === "MemberExpression") {
    callee = callee.object;
  }

  if (callee.type === "Identifier") {
    return callee.name;
  }

  return null;
}

/**
 * Walk the entire AST rooted at `programNode` (without parent links) and
 * collect all Identifier names that appear as the last argument of a suite
 * function call (i.e. `describe('title', handler)` → records `"handler"`).
 *
 * This pre-scan lets scoping rules push a proper scope layer when they later
 * enter the body of a function passed by reference to a suite call, even when
 * the function declaration appears before the suite call in source order.
 *
 * @param {Object} programNode - The ESTree Program node (no parent links needed)
 * @param {Set<string>} suiteFunctions - Set of suite function base names
 * @returns {Set<string>}
 */
function collectSuiteCallbackIdentifiers(programNode, suiteFunctions) {
  const ids = new Set();

  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (
      node.type === "CallExpression" &&
      suiteFunctions.has(getCalleeName(node))
    ) {
      const lastArg = node.arguments[node.arguments.length - 1];
      if (lastArg && lastArg.type === "Identifier") {
        ids.add(lastArg.name);
      }
    }
    for (const key of Object.keys(node)) {
      if (key === "parent") continue;
      const val = node[key];
      if (val && typeof val === "object") {
        visit(val);
      }
    }
  }

  visit(programNode);
  return ids;
}

/**
 * Returns true if `node` (a FunctionDeclaration, FunctionExpression, or
 * ArrowFunctionExpression) is the definition of a function whose name or
 * assigned variable name appears in `suiteCallbackIds`.
 *
 * Handles three forms:
 *   function handler() {}          → FunctionDeclaration, node.id.name
 *   const handler = function() {}  → FunctionExpression, parent VariableDeclarator
 *   const handler = () => {}       → ArrowFunctionExpression, parent VariableDeclarator
 *
 * @param {import('eslint').Rule.Node} node
 * @param {Set<string>} suiteCallbackIds
 * @returns {boolean}
 */
function isSuiteCallbackByReference(node, suiteCallbackIds) {
  // FunctionDeclaration: function handler() {}
  if (node.type === "FunctionDeclaration" && node.id) {
    return suiteCallbackIds.has(node.id.name);
  }
  // Named FunctionExpression: const x = function handler() {}
  if (node.type === "FunctionExpression" && node.id) {
    return suiteCallbackIds.has(node.id.name);
  }
  // FunctionExpression or ArrowFunctionExpression assigned to a variable:
  // const handler = function() {}  or  const handler = () => {}
  if (
    node.parent &&
    node.parent.type === "VariableDeclarator" &&
    node.parent.id &&
    node.parent.id.type === "Identifier"
  ) {
    return suiteCallbackIds.has(node.parent.id.name);
  }
  return false;
}

module.exports = {
  getCalleeName,
  collectSuiteCallbackIdentifiers,
  isSuiteCallbackByReference,
};

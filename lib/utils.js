/**
 * @file Shared utilities for eslint-plugin-node-core-test rules
 * @author chris48s
 */

/** The canonical set of function names for node:test. */
const SUITE_FUNCTIONS = new Set(["describe", "suite"]);
const TEST_FUNCTIONS = new Set(["it", "test"]);
const SUITE_AND_TEST_FUNCTIONS = new Set([
  ...SUITE_FUNCTIONS,
  ...TEST_FUNCTIONS,
]);
const HOOK_FUNCTIONS = new Set(["before", "after", "beforeEach", "afterEach"]);

/**
 * Returns the base identifier name for a call expression's callee.
 *
 * Walks the MemberExpression `.object` chain until it reaches an Identifier, so
 * that calls like `describe(...)`, `describe.only(...)`, and even deeper chains
 * like `describe.skip.only(...)` all return `"describe"`.
 *
 * @param {import("eslint").Rule.Node} node - A CallExpression node
 * @returns {string | null} The base identifier name of the callee (e.g.
 *   "describe"), or `null` when it cannot be determined
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
 * @param {object} programNode - The ESTree Program node (no parent links
 *   needed)
 * @param {Set<string>} suiteFunctions - Set of suite function base names
 * @returns {Set<string>} A set containing identifier names that appear as the
 *   last argument of suite function calls
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
 * Handles three forms: function handler() {} → FunctionDeclaration,
 * node.id.name const handler = function() {} → FunctionExpression, parent
 * VariableDeclarator const handler = () => {} → ArrowFunctionExpression, parent
 * VariableDeclarator
 *
 * @param {import("eslint").Rule.Node} node - Function node to test
 * @param {Set<string>} suiteCallbackIds - Set of identifier names recorded as
 *   suite callbacks
 * @returns {boolean} `true` if the given function node refers to a name in
 *   `suiteCallbackIds`
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

/**
 * Returns the property name accessed on a MemberExpression, or null when it
 * cannot be statically determined.
 *
 * Handles both dot notation (`node.callee.property`) and bracket notation with
 * a string literal (`node["callee"]`).
 *
 * @param {import("eslint").Rule.Node} memberExpr - A MemberExpression node
 * @returns {string | null} The property name, or `null` when it cannot be
 *   statically determined
 */
function getMemberPropertyName(memberExpr) {
  if (memberExpr.computed) {
    if (
      memberExpr.property.type === "Literal" &&
      typeof memberExpr.property.value === "string"
    ) {
      return memberExpr.property.value;
    }
    return null;
  }
  if (memberExpr.property.type === "Identifier") {
    return memberExpr.property.name;
  }
  return null;
}

/**
 * Returns true when `node` is a `.<methodName>(...)` or `["<methodName>"](...)`
 * call on a recognised suite or test function (e.g. `test.skip(...)`,
 * `describe["only"](...)`)
 *
 * @param {import("eslint").Rule.Node} node - A CallExpression node
 * @param {string} methodName - The method name to check for (e.g. `"skip"`)
 * @returns {boolean} `true` when the call matches
 */
function isTestMethodCall(node, methodName) {
  if (node.callee.type !== "MemberExpression") return false;
  if (getMemberPropertyName(node.callee) !== methodName) return false;
  return SUITE_AND_TEST_FUNCTIONS.has(getCalleeName(node));
}

/**
 * Returns true when `node` is a call to a recognised suite or test function
 * that receives an options object with a truthy property named `optionName`.
 *
 * Only flags statically-known truthy literals (`true` or a non-empty string);
 * dynamic values (identifiers, call expressions, etc.) are left alone to avoid
 * false positives.
 *
 * @param {import("eslint").Rule.Node} node - A CallExpression node
 * @param {string} optionName - The option key to look for (e.g. `"skip"`)
 * @returns {boolean} `true` when the call passes a statically-truthy option
 */
function hasTruthyTestOption(node, optionName) {
  if (!SUITE_AND_TEST_FUNCTIONS.has(getCalleeName(node))) return false;
  // The first argument is the title; options (if present) come after it
  for (let i = 1; i < node.arguments.length; i++) {
    const arg = node.arguments[i];
    if (arg.type !== "ObjectExpression") continue;
    for (const prop of arg.properties) {
      if (prop.type !== "Property") continue;
      const keyName =
        prop.key.type === "Identifier"
          ? prop.key.name
          : prop.key.type === "Literal"
            ? String(prop.key.value)
            : null;
      if (keyName !== optionName) continue;
      const val = prop.value;
      if (val.type === "Literal") {
        if (
          val.value === true ||
          (typeof val.value === "string" && val.value.length > 0)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Creates a stateful tracker for detecting `t.<methodName>()` calls inside test
 * callback bodies.
 *
 * Returns an object with three functions intended to be wired into a rule's
 * visitor:
 *
 * - `pushContextParam(funcNode)` — call on `FunctionExpression` and
 *   `ArrowFunctionExpression` entry
 * - `popContextParam()` — call on the corresponding `:exit` visitors
 * - `isContextMethodCall(node)` — call inside `CallExpression` to test whether
 *   `node` is a `<param>.<methodName>(...)` call on the currently-tracked
 *   context parameter
 *
 * @param {string} methodName - The method name to detect (e.g. `"skip"`)
 * @returns {object} An object with `pushContextParam`, `popContextParam`, and
 *   `isContextMethodCall` visitor hook functions to wire into the `create`
 *   function of an ESLint rule
 */
// eslint-disable-next-line eslint-plugin/prefer-object-rule, eslint-plugin/prefer-message-ids, eslint-plugin/require-meta-type, eslint-plugin/require-meta-schema
function createContextMethodTracker(methodName) {
  // Each entry is an object describing the first parameter of a test/suite
  // callback (`{ name, funcNode }`), or `null` when there is no trackable
  // parameter for the current function.
  const contextParamStack = [];

  /**
   * Find the function node that lexically binds the given identifier as a
   * parameter, by walking up its parent chain and looking for the nearest
   * enclosing function whose params contain an Identifier with the same name.
   *
   * @param {import("eslint").Rule.Node & { type: "Identifier" }} idNode - The
   *   Identifier node whose binding function to locate
   * @returns {import("eslint").Rule.Node | null} The nearest enclosing function
   *   node that declares `idNode.name` as a parameter, or `null` if none is
   *   found
   */
  function getBindingFunctionForIdentifier(idNode) {
    let current = idNode.parent;
    while (current) {
      if (
        current.type === "FunctionExpression" ||
        current.type === "ArrowFunctionExpression" ||
        current.type === "FunctionDeclaration"
      ) {
        const hasParamWithName = current.params.some(
          (param) => param.type === "Identifier" && param.name === idNode.name,
        );
        if (hasParamWithName) {
          return current;
        }
      }
      current = current.parent;
    }
    return null;
  }

  function pushContextParam(funcNode) {
    const parent = funcNode.parent;
    if (parent && parent.type === "CallExpression") {
      const lastArg = parent.arguments[parent.arguments.length - 1];
      if (
        lastArg === funcNode &&
        SUITE_AND_TEST_FUNCTIONS.has(getCalleeName(parent))
      ) {
        const firstParam = funcNode.params[0];
        if (firstParam && firstParam.type === "Identifier") {
          contextParamStack.push({
            name: firstParam.name,
            funcNode,
          });
          return;
        }
      }
    }
    contextParamStack.push(null);
  }

  function popContextParam() {
    contextParamStack.pop();
  }

  function isContextMethodCall(node) {
    if (node.callee.type !== "MemberExpression") return false;
    if (getMemberPropertyName(node.callee) !== methodName) return false;
    const obj = node.callee.object;
    if (obj.type !== "Identifier") return false;

    const bindingFunc = getBindingFunctionForIdentifier(obj);
    if (!bindingFunc) return false;
    return contextParamStack.some(
      (entry) =>
        entry !== null &&
        entry.name === obj.name &&
        entry.funcNode === bindingFunc,
    );
  }

  return { pushContextParam, popContextParam, isContextMethodCall };
}

export {
  SUITE_FUNCTIONS,
  TEST_FUNCTIONS,
  SUITE_AND_TEST_FUNCTIONS,
  HOOK_FUNCTIONS,
  getCalleeName,
  collectSuiteCallbackIdentifiers,
  isSuiteCallbackByReference,
  getMemberPropertyName,
  isTestMethodCall,
  hasTruthyTestOption,
  createContextMethodTracker,
};

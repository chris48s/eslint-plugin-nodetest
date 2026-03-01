/**
 * @file Disallow duplicate uses of a hook at the same level inside a suite
 * @author chris48s
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/no-sibling-hooks"),
  RuleTester = require("eslint").RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: "script" },
});

ruleTester.run("no-sibling-hooks", rule, {
  valid: [
    // Single use of each hook type inside a describe
    "describe(function() { before(function() {}); it('foo', function() {}); });",
    "describe(function() { after(function() {}); it('foo', function() {}); });",
    "describe(function() { beforeEach(function() {}); it('foo', function() {}); });",
    "describe(function() { afterEach(function() {}); it('foo', function() {}); });",

    // All four different hook types at the same level — all allowed
    `describe('foo', function() {
  before(function() {});
  after(function() {});
  beforeEach(function() {});
  afterEach(function() {});
  it('bar', function() {});
});`,

    // before and after together (different names) — allowed
    "describe(function() { before(function() {}); after(function() {}); });",

    // before and beforeEach (different names) — allowed
    "describe(function() { before(function() {}); beforeEach(function() {}); });",

    // beforeEach and afterEach (different names) — allowed
    "describe(function() { beforeEach(function() {}); afterEach(function() {}); });",

    // Hooks at top-level with different names — allowed
    "before(function() {}); beforeEach(function() {});",

    // Same hook in sibling suites — allowed (different scopes)
    `describe('suite1', function() {
  before(function() {});
});
describe('suite2', function() {
  before(function() {});
});`,

    // Same hook in outer and nested suite — allowed (different scopes)
    `describe('outer', function() {
  before(function() {});
  describe('inner', function() {
    before(function() {});
  });
});`,

    // Nested suite's hook doesn't conflict with outer suite's hook
    `describe('outer', function() {
  describe('inner', function() {
    before(function() {});
  });
  before(function() {});
});`,

    // describe.only and describe.skip are still suites — hooks inside don't bleed out
    `describe('outer', function() {
  before(function() {});
  describe.only('inner', function() {
    before(function() {});
  });
});`,

    `describe('outer', function() {
  before(function() {});
  describe.skip('inner', function() {
    before(function() {});
  });
});`,

    // suite/test syntax
    "suite(function() { before(function() {}); test('foo', function() {}); });",

    // Arrow function callbacks
    `describe('foo', () => {
  beforeEach(() => {});
  it('bar', () => {});
});`,

    // Non-hook member expression — not flagged (e.g. t.before())
    "before(function() {}); foo.before(function() {});",

    // Deeper MemberExpression chains — describe.skip.only is still a suite
    // Hooks in separate describe.skip.only suites should not conflict
    `describe.skip.only('suite1', function() {
  before(function() {});
});
describe.skip.only('suite2', function() {
  before(function() {});
});`,

    // Hooks in outer suite and inside a describe.skip.only nested suite — different scopes
    `describe('outer', function() {
  before(function() {});
  describe.skip.only('inner', function() {
    before(function() {});
  });
});`,

    // Function reference callback — hook inside handler is in a different scope
    // to the standalone outer hook: should NOT be flagged as a duplicate
    `function handler() { before(function() {}); }
describe('suite', handler);
before(function() {});`,

    // Arrow function reference — same rule
    `const handler = () => { before(() => {}); };
describe('suite', handler);
before(() => {});`,

    // Function expression reference
    `const handler = function() { before(function() {}); };
describe('suite', handler);
before(function() {});`,

    // Member expression hooks inside a function-reference suite are not flagged
    // (t.before() is a sub-test hook, not a top-level hook)
    `function handler() {
  t.before(function() {});
  t.before(function() {});
}
describe('suite', handler);`,

    // Arrow function reference suite with repeated member expression hooks
    `const handler = () => {
  t.before(() => {});
  t.before(() => {});
};
describe('suite', handler);`,

    // Mix of plain hook (once) and member expression hooks inside function-reference suite — no duplication
    `function handler() {
  before(function() {});
  t.before(function() {});
  t.before(function() {});
}
describe('suite', handler);`,
  ],

  invalid: [
    // Duplicate before inside describe
    {
      code: "describe(function() { before(function() {}); before(function() {}); });",
      errors: [{ messageId: "duplicateHook", data: { hookName: "before" } }],
    },

    // Duplicate after inside describe
    {
      code: "describe(function() { after(function() {}); after(function() {}); });",
      errors: [{ messageId: "duplicateHook", data: { hookName: "after" } }],
    },

    // Duplicate beforeEach inside describe
    {
      code: "describe(function() { beforeEach(function() {}); beforeEach(function() {}); });",
      errors: [
        { messageId: "duplicateHook", data: { hookName: "beforeEach" } },
      ],
    },

    // Duplicate afterEach inside describe
    {
      code: "describe(function() { afterEach(function() {}); afterEach(function() {}); });",
      errors: [{ messageId: "duplicateHook", data: { hookName: "afterEach" } }],
    },

    // Duplicate at top level
    {
      code: "before(function() {}); before(function() {});",
      errors: [{ messageId: "duplicateHook", data: { hookName: "before" } }],
    },

    // Duplicate in a nested suite (not the outer one)
    {
      code: `describe('outer', function() {
  before(function() {});
  describe('inner', function() {
    before(function() {});
    before(function() {});
  });
});`,
      errors: [
        { messageId: "duplicateHook", data: { hookName: "before" }, line: 5 },
      ],
    },

    // Outer suite has duplicate — nested suite does not
    {
      code: `describe('outer', function() {
  before(function() {});
  describe('inner', function() {
    before(function() {});
  });
  before(function() {});
});`,
      errors: [
        { messageId: "duplicateHook", data: { hookName: "before" }, line: 6 },
      ],
    },

    // Three occurrences — two errors (second and third are duplicates)
    {
      code: `describe('foo', function() {
  beforeEach(function() {});
  beforeEach(function() {});
  beforeEach(function() {});
});`,
      errors: [
        {
          messageId: "duplicateHook",
          data: { hookName: "beforeEach" },
          line: 3,
        },
        {
          messageId: "duplicateHook",
          data: { hookName: "beforeEach" },
          line: 4,
        },
      ],
    },

    // Multiple hook types duplicated in the same suite
    {
      code: `describe('foo', function() {
  after(function() {});
  after(function() {});
  before(function() {});
  before(function() {});
});`,
      errors: [
        { messageId: "duplicateHook", data: { hookName: "after" }, line: 3 },
        { messageId: "duplicateHook", data: { hookName: "before" }, line: 5 },
      ],
    },

    // suite/test syntax — duplicates still flagged
    {
      code: "suite(function() { before(function() {}); before(function() {}); });",
      errors: [{ messageId: "duplicateHook", data: { hookName: "before" } }],
    },

    // Arrow function callbacks — duplicates still flagged
    {
      code: `describe('foo', () => {
  beforeEach(() => {});
  beforeEach(() => {});
});`,
      errors: [
        {
          messageId: "duplicateHook",
          data: { hookName: "beforeEach" },
          line: 3,
        },
      ],
    },

    // describe.only — still a suite scope
    {
      code: `describe.only('foo', function() {
  before(function() {});
  before(function() {});
});`,
      errors: [
        { messageId: "duplicateHook", data: { hookName: "before" }, line: 3 },
      ],
    },

    // Function reference callback — duplicate hooks inside handler suite
    {
      code: `describe('suite', handler);
function handler() {
  before(function() {});
  before(function() {});
}`,
      errors: [
        { messageId: "duplicateHook", data: { hookName: "before" }, line: 4 },
      ],
    },

    // Arrow function reference — duplicate hooks inside handler suite
    {
      code: `const handler = () => {
  before(() => {});
  before(() => {});
};
describe('suite', handler);`,
      errors: [
        { messageId: "duplicateHook", data: { hookName: "before" }, line: 3 },
      ],
    },

    // Duplicate plain hook inside function-reference suite alongside member expression hooks
    // The member expression hooks (t.before) should not be flagged; only the duplicate plain before() should be
    {
      code: `function handler() {
  before(function() {});
  t.before(function() {});
  before(function() {});
}
describe('suite', handler);`,
      errors: [
        { messageId: "duplicateHook", data: { hookName: "before" }, line: 4 },
      ],
    },

    // Arrow function reference suite: duplicate plain hook alongside member expression hooks
    {
      code: `const handler = () => {
  before(() => {});
  t.before(() => {});
  before(() => {});
};
describe('suite', handler);`,
      errors: [
        { messageId: "duplicateHook", data: { hookName: "before" }, line: 4 },
      ],
    },
  ],
});

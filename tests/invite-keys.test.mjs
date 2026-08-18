import assert from "node:assert/strict";
import test from "node:test";

import {
  generateInviteKey,
  hashInviteKey,
  INVITE_KEY_PATTERN,
  normalizeInviteKey,
} from "../lib/invite-keys.ts";

test("creates and validates one-time beta invite keys", () => {
  const first = generateInviteKey();
  const second = generateInviteKey();

  assert.match(first, INVITE_KEY_PATTERN);
  assert.match(second, INVITE_KEY_PATTERN);
  assert.notEqual(first, second);
  assert.equal(normalizeInviteKey(`  ${first}  `), first);
  assert.equal(normalizeInviteKey("cq_beta_short"), null);
  assert.equal(
    hashInviteKey("cq_beta_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    "2b2a8118612a4738321a53f09e5b140ed672e9dd37ed6c168b0ff3ae37bbd12b",
  );
});

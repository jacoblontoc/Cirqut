import { createHash, randomBytes } from "node:crypto";

export const INVITE_KEY_PATTERN = /^cq_beta_[A-Za-z0-9_-]{43}$/;
export const WORKSPACE_INVITE_PATTERN = /^cq_ws_[A-Za-z0-9_-]{43}$/;

export function generateInviteKey() {
  return `cq_beta_${randomBytes(32).toString("base64url")}`;
}

export function normalizeInviteKey(value: unknown) {
  if (typeof value !== "string") return null;
  const key = value.trim();
  return INVITE_KEY_PATTERN.test(key) ? key : null;
}

export function hashInviteKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export function generateWorkspaceInviteToken() {
  return `cq_ws_${randomBytes(32).toString("base64url")}`;
}

export function normalizeWorkspaceInviteToken(value: unknown) {
  if (typeof value !== "string") return null;
  const token = value.trim();
  return WORKSPACE_INVITE_PATTERN.test(token) ? token : null;
}

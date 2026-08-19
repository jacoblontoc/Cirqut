"use client";

import { useActionState, useState } from "react";

import {
  createBoard,
  createProject,
  createWorkspace,
  createWorkspaceInvitation,
  type WorkspaceActionState,
} from "./actions";
import styles from "./dashboard.module.css";

const initialState: WorkspaceActionState = { message: "" };

export function CreateWorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspace, initialState);
  return (
    <form className={styles.productForm} action={action}>
      <label><span>Workspace name</span><input name="name" type="text" maxLength={80} autoComplete="organization" required /></label>
      <FormFooter message={state.message} pending={pending} label="Create workspace" />
    </form>
  );
}

export function CreateProjectForm() {
  const [state, action, pending] = useActionState(createProject, initialState);
  return (
    <form className={styles.productForm} action={action}>
      <label><span>Project name</span><input name="name" type="text" maxLength={120} required /></label>
      <label><span>Product goal or short description <small>Optional</small></span><textarea name="description" rows={4} maxLength={500} /></label>
      <FormFooter message={state.message} pending={pending} label="Create project" />
    </form>
  );
}

export function CreateBoardForm({ projectId }: { projectId: string }) {
  const createForProject = createBoard.bind(null, projectId);
  const [state, action, pending] = useActionState(createForProject, initialState);
  return (
    <form className={styles.productForm} action={action}>
      <label><span>Board name</span><input name="name" type="text" maxLength={120} required /></label>
      <label><span>Board purpose <small>Optional</small></span><input name="purpose" type="text" maxLength={240} /></label>
      <label><span>Short description <small>Optional</small></span><textarea name="description" rows={4} maxLength={500} /></label>
      <FormFooter message={state.message} pending={pending} label="Add board" />
    </form>
  );
}

export function WorkspaceInvitationForm() {
  const [state, action, pending] = useActionState(createWorkspaceInvitation, initialState);
  return (
    <form className={styles.invitationForm} action={action}>
      <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
      <label><span>Role</span><select name="role" defaultValue="member"><option value="member">Member</option><option value="admin">Admin</option></select></label>
      <button className={styles.primaryButton} type="submit" disabled={pending}>{pending ? "Creating…" : "Create invitation"}</button>
      <p className={styles.formMessage} aria-live="polite">{state.message}</p>
      {state.invitationPath && <InvitationLink path={state.invitationPath} />}
    </form>
  );
}

function InvitationLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
  }

  return (
    <div className={styles.invitationLink}>
      <code>{path}</code>
      <button className={styles.secondaryButton} type="button" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
    </div>
  );
}

function FormFooter({ label, message, pending }: { label: string; message: string; pending: boolean }) {
  return (
    <div className={styles.productFormFooter}>
      <p className={styles.formMessage} aria-live="polite">{message}</p>
      <button className={styles.primaryButton} type="submit" disabled={pending}>{pending ? "Saving…" : label}</button>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { saveAccountUsername, saveProductUpdates, type AccountActionState } from "@/app/(public-site)/waitlist/actions";
import { authClient } from "@/lib/auth/client";
import styles from "./dashboard.module.css";

export type ModalKind = "settings" | "help" | "shortcuts" | "signout";
export type ThemeChoice = "system" | "light" | "dark";
export type DensityChoice = "comfortable" | "compact";

export type LocalPreferences = {
  theme: ThemeChoice;
  density: DensityChoice;
  textScale: number;
  reducedMotion: boolean;
  highContrast: boolean;
  notifications: {
    emailProjectActivity: boolean;
    inAppResearch: boolean;
    inAppMentions: boolean;
    inAppComponents: boolean;
  };
};

export const DEFAULT_LOCAL_PREFERENCES: LocalPreferences = {
  theme: "system",
  density: "comfortable",
  textScale: 100,
  reducedMotion: false,
  highContrast: false,
  notifications: {
    emailProjectActivity: true,
    inAppResearch: true,
    inAppMentions: true,
    inAppComponents: true,
  },
};

const initialActionState: AccountActionState = { ok: false, message: "" };

const preferenceSections = [
  ["account", "Account", "/icons/user.svg"],
  ["appearance", "Appearance", "/icons/night-day.svg"],
  ["notifications", "Notifications", "/icons/bell.svg"],
  ["project-defaults", "Project defaults", "/icons/clip.svg"],
  ["accessibility", "Accessibility", "/icons/universal-access.svg"],
] as const;

const settingsSections = [
  ["general", "General", "/icons/settings-sliders.svg"],
  ["integrations", "Integrations", "/icons/plug-connection.svg"],
  ["workspace", "Workspace", "/icons/age-alt.svg"],
  ["billing", "Billing", "/icons/credit-card.svg"],
  ["data", "Data", "/icons/database.svg"],
] as const;

type PreferenceSection = (typeof preferenceSections)[number][0];
type SettingsSection = (typeof settingsSections)[number][0];
type SettingsPage = PreferenceSection | SettingsSection;

type AuthAccount = { id: string; providerId: string };
type AuthSession = { id: string; createdAt: Date | string; userAgent?: string | null };
const avatarTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

function readAvatar(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid image")));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Unable to read image")));
    reader.readAsDataURL(file);
  });
}

function Toggle({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description?: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.preferenceRow}>
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        className={styles.switchInput}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.switchTrack} aria-hidden="true"><span /></span>
    </label>
  );
}

function CustomSelect<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly { label: string; value: T }[];
  value: T;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div className={styles.selectField} ref={rootRef}>
      <span>{label}</span>
      <button
        className={styles.selectButton}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {selected.label}<span aria-hidden="true">⌄</span>
      </button>
      <div className={styles.selectMenu} data-open={open} role="listbox" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={option.value === value}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            {option.label}{option.value === value && <span aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function WindowFrame({
  children,
  close,
  nav,
  title,
}: {
  children: ReactNode;
  close: () => void;
  nav?: ReactNode;
  title: string;
}) {
  return (
    <section className={styles.modalWindow} role="dialog" aria-modal="true" aria-labelledby="dashboard-modal-title">
      <h2 className={styles.srOnly} id="dashboard-modal-title">{title}</h2>
      <button className={styles.modalClose} type="button" aria-label="Close" onClick={close}>×</button>
      <div className={styles.modalBody}>
        {nav && <nav className={styles.modalSidebar} aria-label={title + " sections"}>{nav}</nav>}
        <div className={styles.modalContent}>{children}</div>
      </div>
    </section>
  );
}

function SectionNav<T extends string>({
  active,
  items,
  onChange,
}: {
  active: string;
  items: readonly (readonly [T, string, string])[];
  onChange: (value: T) => void;
}) {
  return items.map(([value, label, icon]) => (
    <button
      className={value === active ? styles.modalNavActive : undefined}
      key={value}
      type="button"
      aria-current={value === active ? "page" : undefined}
      onClick={() => onChange(value)}
    >
      <Image className={styles.modalNavIcon} src={icon} alt="" width={16} height={16} aria-hidden="true" />
      <span>{label}</span>
    </button>
  ));
}

export function DashboardModal({
  avatarColor,
  avatarUrl,
  displayName,
  email,
  kind,
  localPreferences,
  memberCount,
  onAvatarChange,
  onClose,
  onDisplayNameChange,
  onLocalPreferencesChange,
  productUpdatesConsent,
  username,
  visible,
  workspaceName,
  workspaceRole,
}: {
  avatarColor: string;
  avatarUrl: string | null;
  displayName: string;
  email: string;
  kind: ModalKind;
  localPreferences: LocalPreferences;
  memberCount: number;
  onAvatarChange: (url: string | null) => void;
  onClose: () => void;
  onDisplayNameChange: (name: string) => void;
  onLocalPreferencesChange: (preferences: LocalPreferences) => void;
  productUpdatesConsent: boolean;
  username: string;
  visible: boolean;
  workspaceName: string;
  workspaceRole: string;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [settingsPage, setSettingsPage] = useState<SettingsPage>("general");
  const [helpSection, setHelpSection] = useState<"documentation" | "feedback">("documentation");
  const [nameStatus, setNameStatus] = useState("");
  const [avatarStatus, setAvatarStatus] = useState("");
  const [avatarPending, setAvatarPending] = useState(false);
  const [securityStatus, setSecurityStatus] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [signOutPending, setSignOutPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [usernameState, usernameAction, usernamePending] = useActionState(saveAccountUsername, initialActionState);
  const [updatesState, updatesAction, updatesPending] = useActionState(saveProductUpdates, initialActionState);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previousFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (settingsPage !== "account") return;
    let active = true;
    Promise.all([authClient.listAccounts(), authClient.listSessions()])
      .then(([accountResult, sessionResult]) => {
        if (!active) return;
        setAccounts((accountResult.data ?? []) as AuthAccount[]);
        setSessions((sessionResult.data ?? []) as AuthSession[]);
        if (accountResult.error || sessionResult.error) setSecurityStatus("Some security details are temporarily unavailable.");
      })
      .finally(() => {
        if (active) setSecurityLoading(false);
      });
    return () => {
      active = false;
    };
  }, [settingsPage]);

  function updateLocal<K extends keyof LocalPreferences>(key: K, value: LocalPreferences[K]) {
    onLocalPreferencesChange({ ...localPreferences, [key]: value });
  }

  function updateNotification(key: keyof LocalPreferences["notifications"], value: boolean) {
    onLocalPreferencesChange({
      ...localPreferences,
      notifications: { ...localPreferences.notifications, [key]: value },
    });
  }

  async function updateName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameStatus("Saving…");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("displayName") ?? "").trim();
    const { error } = await authClient.updateUser({ name });
    if (error) {
      setNameStatus(error.message || "Unable to update your name.");
      return;
    }
    onDisplayNameChange(name);
    setNameStatus("Name updated.");
    router.refresh();
  }

  async function updateAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!avatarTypes.has(file.type) || file.size > 1_000_000) {
      setAvatarStatus("Choose a PNG, JPEG, or WebP image under 1 MB.");
      return;
    }

    setAvatarPending(true);
    setAvatarStatus("Updating photo…");
    try {
      // ponytail: data URLs avoid adding storage; move avatars to object storage before raising this 1 MB limit.
      const image = await readAvatar(file);
      const { error } = await authClient.updateUser({ image });
      if (error) {
        setAvatarStatus(error.message || "Unable to update your photo.");
        return;
      }
      onAvatarChange(image);
      setAvatarStatus("Profile photo updated.");
      router.refresh();
    } catch {
      setAvatarStatus("Unable to read that image.");
    } finally {
      setAvatarPending(false);
    }
  }

  async function removeAvatar() {
    setAvatarPending(true);
    setAvatarStatus("Removing photo…");
    const { error } = await authClient.updateUser({ image: null });
    if (error) {
      setAvatarStatus(error.message || "Unable to remove your photo.");
      setAvatarPending(false);
      return;
    }
    onAvatarChange(null);
    setAvatarStatus("Using the default profile photo.");
    setAvatarPending(false);
    router.refresh();
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSecurityStatus("Updating password…");
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setSecurityStatus("New passwords do not match.");
      return;
    }
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: form.get("revokeOtherSessions") === "on",
    });
    setSecurityStatus(error ? error.message || "Unable to update your password." : "Password updated.");
    if (!error) event.currentTarget.reset();
  }

  async function sendPasswordReset() {
    setSecurityStatus("Sending reset email…");
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/login?view=reset-password",
    });
    setSecurityStatus(error ? "Unable to send a reset email right now." : "Password reset email sent.");
  }

  async function revokeOtherSessions() {
    setSecurityStatus("Signing out other sessions…");
    const { error } = await authClient.revokeOtherSessions();
    if (error) {
      setSecurityStatus(error.message || "Unable to sign out other sessions.");
      return;
    }
    setSecurityStatus("Other sessions signed out.");
    const { data } = await authClient.listSessions();
    setSessions((data ?? []) as AuthSession[]);
  }

  async function signOut() {
    setSignOutPending(true);
    const { error } = await authClient.signOut();
    if (error) {
      setSignOutPending(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function deleteAccount() {
    setDeletePending(true);
    setSecurityStatus("");
    const { error } = await authClient.deleteUser({
      callbackURL: "/",
      ...(deletePassword ? { password: deletePassword } : {}),
    });
    if (error) {
      setDeletePending(false);
      setSecurityStatus(error.message || "Account deletion is unavailable. Try again after signing in again.");
      setConfirmingDelete(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  if (kind === "signout") {
    return (
      <div className={styles.modalOverlay} data-visible={visible}>
        <button className={styles.modalBackdrop} type="button" tabIndex={-1} aria-label="Close sign out confirmation" onClick={onClose} />
        <div className={styles.modalFocusRoot} ref={panelRef} tabIndex={-1}>
          <section className={styles.confirmWindow} role="alertdialog" aria-modal="true" aria-labelledby="signout-title">
            <h2 id="signout-title">Sign out?</h2>
            <p>You’ll need to log in again to return to your dashboard.</p>
            <div className={styles.confirmActions}>
              <button className={styles.secondaryButton} type="button" onClick={onClose}>Cancel</button>
              <button className={styles.primaryButton} type="button" disabled={signOutPending} onClick={signOut}>
                {signOutPending ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (confirmingDelete) {
    return (
      <div className={styles.modalOverlay} data-visible={visible}>
        <button className={styles.modalBackdrop} type="button" tabIndex={-1} aria-label="Close account deletion confirmation" onClick={onClose} />
        <div className={styles.modalFocusRoot} ref={panelRef} tabIndex={-1}>
          <section className={styles.confirmWindow} role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <h2 id="delete-title">Delete your account?</h2>
            <p>This permanently removes your login. Private-beta access may not be recoverable.</p>
            <label className={styles.field}>
              <span>Password, if your account uses one</span>
              <input type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} />
            </label>
            <div className={styles.confirmActions}>
              <button className={styles.secondaryButton} type="button" onClick={() => setConfirmingDelete(false)}>Cancel</button>
              <button className={styles.dangerButton} type="button" disabled={deletePending} onClick={deleteAccount}>
                {deletePending ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  let title = "Settings and preferences";
  let nav: ReactNode;
  let content: ReactNode;

  if (kind === "settings") {
    nav = (
      <>
        <span className={styles.modalNavGroup}>Settings</span>
        <SectionNav active={settingsPage} items={settingsSections} onChange={setSettingsPage} />
        <span className={styles.modalNavGroup}>Preferences</span>
        <SectionNav
          active={settingsPage}
          items={[preferenceSections[0], preferenceSections[1], preferenceSections[2], preferenceSections[4]]}
          onChange={(section) => {
            if (section === "account") setSecurityLoading(true);
            setSettingsPage(section);
          }}
        />
        <span className={styles.modalNavGroup}>Projects</span>
        <SectionNav active={settingsPage} items={preferenceSections.slice(3, 4)} onChange={setSettingsPage} />
      </>
    );

    if (settingsPage === "general" || settingsPage === "integrations" || settingsPage === "workspace" || settingsPage === "billing" || settingsPage === "data") {
      const sections: Record<SettingsSection, ReactNode> = {
        general: <InfoSection title="General" description="Your current Cirqut workspace context." rows={[["Workspace", workspaceName], ["Access", "Private beta"], ["Your role", workspaceRole]]} />,
        integrations: <InfoSection title="Integrations" description="Connections will become available with project workflows." rows={[["KiCad", "Not connected"], ["Altium", "Not connected"], ["Flux", "Not connected"]]} />,
        workspace: <InfoSection title="Workspace" description="Workspace members share access to its projects and boards." rows={[["Workspace", workspaceName], ["Members", String(memberCount)], ["Your role", workspaceRole]]} />,
        billing: <InfoSection title="Billing" description="Billing is not enabled during the private beta." rows={[["Plan", "Private beta"], ["Billing", "Not enabled"]]} />,
        data: <InfoSection title="Data" description="Export and retention controls will appear before public launch." rows={[["Storage region", "Managed by Cirqut"], ["Export", "Coming later"]]} />,
      };
      content = sections[settingsPage];
    } else if (settingsPage === "account") {
      content = (
        <div className={styles.settingsSection}>
          <div className={styles.sectionHeading}><h3>Account</h3><p>Manage your profile, login details, and active sessions.</p></div>
          <section className={styles.settingsGroup} aria-labelledby="profile-section-title">
            <div className={styles.settingsGroupHeading}>
              <h4 id="profile-section-title">Profile</h4>
              <p>Choose how your account appears across Cirqut.</p>
            </div>
            <div className={styles.avatarRow}>
              <span className={styles.avatarPreview} style={avatarUrl ? undefined : { backgroundColor: avatarColor }}>
                <Image src={avatarUrl ?? "/avatar/cirqut-default.png"} alt="" width={48} height={48} unoptimized={Boolean(avatarUrl)} />
              </span>
              <div>
                <strong>Profile picture</strong>
                <small>PNG, JPEG, or WebP. Maximum 1 MB.</small>
                <span className={styles.formStatus} aria-live="polite">{avatarStatus}</span>
              </div>
              <div className={styles.avatarActions}>
                <label className={`${styles.secondaryButton} ${styles.avatarUploadButton}`} aria-disabled={avatarPending}>
                  {avatarPending ? "Updating…" : "Change photo"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" disabled={avatarPending} onChange={updateAvatar} />
                </label>
                {avatarUrl && <button className={styles.secondaryButton} type="button" disabled={avatarPending} onClick={removeAvatar}>Remove</button>}
              </div>
            </div>
            <form className={styles.settingsForm} onSubmit={updateName}>
              <label className={styles.field}><span>Display name</span><input name="displayName" defaultValue={displayName} maxLength={120} required /></label>
              <div className={styles.formFooter}>
                <span className={styles.formStatus} aria-live="polite">{nameStatus}</span>
                <button className={styles.primaryButton} type="submit">Save name</button>
              </div>
            </form>
            <form className={styles.settingsForm} action={usernameAction}>
              <label className={styles.field}>
                <span>Username</span>
                <span className={styles.usernameInput}><span aria-hidden="true">@</span><input name="username" type="text" defaultValue={username} autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" required /></span>
              </label>
              <div className={styles.formFooter}>
                <span className={styles.formStatus} aria-live="polite">{usernameState.message}</span>
                <button className={styles.primaryButton} type="submit" disabled={usernamePending}>{usernamePending ? "Saving…" : "Save username"}</button>
              </div>
            </form>
            <div className={styles.settingRow}>
              <div><strong>Email</strong><small>Verified account email</small></div>
              <span className={styles.settingValue}>{email}</span>
            </div>
            <div className={styles.settingRow}>
              <div><strong>Connected login methods</strong><small>Ways you can access this Cirqut account.</small></div>
              <span className={styles.settingValue}>{securityLoading ? "Loading…" : accounts.length ? accounts.map((account) => providerLabel(account.providerId)).join(", ") : "No connected methods found."}</span>
            </div>
          </section>
          <section className={styles.settingsGroup} aria-labelledby="password-section-title">
            <div className={styles.settingsGroupHeading}>
              <h4 id="password-section-title">Password</h4>
              <p>Change your password or request a secure reset link.</p>
            </div>
            <form className={styles.settingsForm} onSubmit={changePassword}>
              <label className={styles.field}><span>Current password</span><input name="currentPassword" type="password" autoComplete="current-password" required /></label>
              <label className={styles.field}><span>New password</span><input name="newPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
              <label className={styles.field}><span>Confirm new password</span><input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
              <label className={styles.checkboxRow}><input name="revokeOtherSessions" type="checkbox" defaultChecked /><span>Sign out other sessions after changing my password</span></label>
              <div className={styles.formFooter}>
                <button className={styles.secondaryButton} type="button" onClick={sendPasswordReset}>Email reset link</button>
                <button className={styles.primaryButton} type="submit">Update password</button>
              </div>
            </form>
          </section>
          <section className={styles.settingsGroup} aria-labelledby="sessions-section-title">
            <div className={styles.settingsGroupHeading}>
              <h4 id="sessions-section-title">Sessions</h4>
              <p>Review how many sessions are active for your account.</p>
            </div>
            <div className={styles.settingRow}>
              <div><strong>Active sessions</strong><small>{securityLoading ? "Loading…" : sessions.length + (sessions.length === 1 ? " active session" : " active sessions")}</small></div>
              <button className={styles.secondaryButton} type="button" disabled={securityLoading || sessions.length < 2} onClick={revokeOtherSessions}>Sign out others</button>
            </div>
            <p className={styles.formStatus} aria-live="polite">{securityStatus}</p>
          </section>
          <section className={`${styles.settingsGroup} ${styles.dangerGroup}`} aria-labelledby="danger-section-title">
            <div className={styles.settingsGroupHeading}>
              <h4 id="danger-section-title">Danger zone</h4>
              <p>Actions here cannot be undone.</p>
            </div>
            <div className={styles.settingRow}>
              <div><strong>Delete account</strong><small>Permanently remove your Cirqut login and account access.</small></div>
              <button className={styles.dangerButton} type="button" onClick={() => setConfirmingDelete(true)}>Delete account</button>
            </div>
          </section>
        </div>
      );
    } else if (settingsPage === "appearance") {
      content = (
        <div className={styles.settingsSection}>
          <div className={styles.sectionHeading}><h3>Appearance</h3><p>Choose how Cirqut looks on this device.</p></div>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Theme</span>
            <div className={styles.segmentedControl} role="group" aria-label="Theme">
              {(["system", "light", "dark"] as const).map((theme) => (
                <button key={theme} type="button" aria-pressed={localPreferences.theme === theme} onClick={() => updateLocal("theme", theme)}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <CustomSelect
            label="Interface density"
            value={localPreferences.density}
            onChange={(value) => updateLocal("density", value)}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
          <p className={styles.autoSaveNote}>Appearance changes save automatically on this device.</p>
        </div>
      );
    } else if (settingsPage === "notifications") {
      content = (
        <div className={styles.settingsSection}>
          <div className={styles.sectionHeading}><h3>Notifications</h3><p>Control email and in-app activity alerts.</p></div>
          <h4>Email</h4>
          <Toggle
            label="Project activity"
            description="Important research, requirements, and project status updates."
            checked={localPreferences.notifications.emailProjectActivity}
            onChange={(value) => updateNotification("emailProjectActivity", value)}
          />
          <form className={styles.inlinePreferenceForm} action={updatesAction}>
            <label className={styles.preferenceRow} htmlFor="product-updates-consent">
              <span><strong>Product updates</strong><small>Occasional Cirqut launch and private-beta news.</small></span>
              <input id="product-updates-consent" className={styles.switchInput} name="productUpdatesConsent" type="checkbox" defaultChecked={productUpdatesConsent} aria-label="Product updates" />
              <span className={styles.switchTrack} aria-hidden="true"><span /></span>
            </label>
            <div className={styles.formFooter}>
              <span className={styles.formStatus} aria-live="polite">{updatesState.message}</span>
              <button className={styles.secondaryButton} type="submit" disabled={updatesPending}>{updatesPending ? "Saving…" : "Save email preference"}</button>
            </div>
          </form>
          <h4>In-app</h4>
          <Toggle label="Research completed" checked={localPreferences.notifications.inAppResearch} onChange={(value) => updateNotification("inAppResearch", value)} />
          <Toggle label="Comments and mentions" checked={localPreferences.notifications.inAppMentions} onChange={(value) => updateNotification("inAppMentions", value)} />
          <Toggle label="Component alerts" checked={localPreferences.notifications.inAppComponents} onChange={(value) => updateNotification("inAppComponents", value)} />
        </div>
      );
    } else if (settingsPage === "project-defaults") {
      content = <EmptySection title="Project defaults" description="Project defaults will live here once project creation is available." />;
    } else {
      content = (
        <div className={styles.settingsSection}>
          <div className={styles.sectionHeading}><h3>Accessibility</h3><p>Adjust motion, contrast, and text for this device.</p></div>
          <Toggle label="Reduce motion" description="Removes sidebar, menu, and modal fades." checked={localPreferences.reducedMotion} onChange={(value) => updateLocal("reducedMotion", value)} />
          <Toggle label="Higher contrast" description="Strengthens borders and text contrast." checked={localPreferences.highContrast} onChange={(value) => updateLocal("highContrast", value)} />
          <label className={styles.rangeField} htmlFor="dashboard-text-size">
            <span><strong>Text size</strong><output>{localPreferences.textScale}%</output></span>
            <input id="dashboard-text-size" type="range" min="90" max="120" step="5" value={localPreferences.textScale} aria-label="Text size" onChange={(event) => updateLocal("textScale", Number(event.target.value))} />
          </label>
        </div>
      );
    }
  } else if (kind === "help") {
    title = "Help & feedback";
    nav = (
      <>
        <button className={helpSection === "documentation" ? styles.modalNavActive : undefined} type="button" onClick={() => setHelpSection("documentation")}>Documentation</button>
        <button className={helpSection === "feedback" ? styles.modalNavActive : undefined} type="button" onClick={() => setHelpSection("feedback")}>Feedback</button>
      </>
    );
    content = helpSection === "documentation" ? (
      <div className={styles.settingsSection}>
        <div className={styles.sectionHeading}><h3>Search documentation</h3><p>Search will connect to the Cirqut wiki when it is ready.</p></div>
        <label className={styles.searchField}><span className={styles.srOnly}>Search documentation</span><input type="search" placeholder="Search the Cirqut wiki…" /></label>
        <div className={styles.emptyState}>Documentation search is being prepared.</div>
      </div>
    ) : <EmptySection title="Feedback" description="Feedback tools will appear here with the documentation center." />;
  } else {
    title = "Keyboard shortcuts";
    content = <div className={styles.blankPanel} aria-label="Keyboard shortcuts content" />;
  }

  return (
    <div className={styles.modalOverlay} data-visible={visible}>
      <button className={styles.modalBackdrop} type="button" tabIndex={-1} aria-label={"Close " + title.toLowerCase()} onClick={onClose} />
      <div className={styles.modalFocusRoot} ref={panelRef} tabIndex={-1}>
        <WindowFrame title={title} nav={nav} close={onClose}>{content}</WindowFrame>
      </div>
    </div>
  );
}

function EmptySection({ description, title }: { description: string; title: string }) {
  return (
    <div className={styles.settingsSection}>
      <div className={styles.sectionHeading}><h3>{title}</h3><p>{description}</p></div>
      <div className={styles.emptyState} />
    </div>
  );
}

function InfoSection({
  description,
  rows,
  title,
}: {
  description: string;
  rows: readonly (readonly [string, string])[];
  title: string;
}) {
  return (
    <div className={styles.settingsSection}>
      <div className={styles.sectionHeading}><h3>{title}</h3><p>{description}</p></div>
      <dl className={styles.infoList}>
        {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </div>
  );
}

function providerLabel(provider: string) {
  if (provider === "credential") return "Email and password";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

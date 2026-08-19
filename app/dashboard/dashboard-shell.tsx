"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import {
  DashboardModal,
  DEFAULT_LOCAL_PREFERENCES,
  type LocalPreferences,
  type ModalKind,
} from "./dashboard-dialogs";
import { switchWorkspace } from "./actions";
import styles from "./dashboard.module.css";

const AVATAR_COLORS = [
  "#F2B84B",
  "#E98B6D",
  "#DFA0B5",
  "#BBA3E6",
  "#82A7E8",
  "#69B6B0",
  "#82C49C",
  "#B9CB68",
] as const;

const LOCAL_PREFERENCES_KEY = "cirqut:dashboard-preferences";
const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 360;
const SIDEBAR_DEFAULT_WIDTH = 224;

function clampSidebarWidth(width: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));
}

function avatarColor(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function usableAvatarUrl(value?: string | null) {
  return value?.startsWith("https://")
    || value?.startsWith("http://")
    || /^data:image\/(?:png|jpeg|webp);base64,/.test(value ?? "")
    ? value ?? null
    : null;
}

function readLocalPreferences(): LocalPreferences {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_PREFERENCES_KEY) ?? "{}") as Partial<LocalPreferences>;
    const notifications: Partial<LocalPreferences["notifications"]> = stored.notifications ?? {};
    return {
      theme: stored.theme === "light" || stored.theme === "dark" ? stored.theme : "system",
      density: stored.density === "compact" ? "compact" : "comfortable",
      textScale: typeof stored.textScale === "number" ? Math.min(120, Math.max(90, stored.textScale)) : 100,
      reducedMotion: stored.reducedMotion === true,
      highContrast: stored.highContrast === true,
      notifications: {
        emailProjectActivity: notifications.emailProjectActivity !== false,
        inAppResearch: notifications.inAppResearch !== false,
        inAppMentions: notifications.inAppMentions !== false,
        inAppComponents: notifications.inAppComponents !== false,
      },
    };
  } catch {
    return DEFAULT_LOCAL_PREFERENCES;
  }
}

function AvatarImage({ safeAvatarUrl, size }: { safeAvatarUrl: string | null; size: number }) {
  return safeAvatarUrl ? (
    <Image className={styles.profileImage} src={safeAvatarUrl} alt="" width={size} height={size} unoptimized />
  ) : (
    <Image className={styles.profileImage} src="/avatar/cirqut-default.png" alt="" width={size} height={size} />
  );
}

export function DashboardShell({
  activeWorkspace,
  avatarSeed,
  avatarUrl,
  children,
  displayName,
  email,
  memberCount,
  productUpdatesConsent,
  username,
  workspaces,
}: {
  activeWorkspace: { id: string; name: string; role: string } | null;
  avatarSeed: string;
  avatarUrl?: string | null;
  children: ReactNode;
  displayName: string;
  email: string;
  memberCount: number;
  productUpdatesConsent: boolean;
  username: string;
  workspaces: readonly { id: string; name: string; role: string }[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [resizingSidebar, setResizingSidebar] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentName, setCurrentName] = useState(displayName);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [localPreferences, setLocalPreferences] = useState(DEFAULT_LOCAL_PREFERENCES);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [systemDark, setSystemDark] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const modalTimerRef = useRef<number | null>(null);
  const sidebarResizeRef = useRef<{ pointerId: number; startWidth: number; startX: number } | null>(null);
  const safeAvatarUrl = usableAvatarUrl(currentAvatarUrl);
  const backgroundColor = avatarColor(avatarSeed);
  const resolvedTheme = localPreferences.theme === "system" ? (systemDark ? "dark" : "light") : localPreferences.theme;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    const loadTimer = window.setTimeout(() => {
      setLocalPreferences(readLocalPreferences());
      setPreferencesLoaded(true);
      update();
    }, 0);
    media.addEventListener("change", update);
    return () => {
      window.clearTimeout(loadTimer);
      media.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    window.localStorage.setItem(LOCAL_PREFERENCES_KEY, JSON.stringify(localPreferences));
  }, [localPreferences, preferencesLoaded]);

  useEffect(() => {
    if (!menuOpen && !workspaceOpen) return;
    const closeMenus = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setMenuOpen(false);
      if (!workspaceRef.current?.contains(event.target as Node)) setWorkspaceOpen(false);
    };
    const escapeMenus = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setWorkspaceOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", escapeMenus);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", escapeMenus);
    };
  }, [menuOpen, workspaceOpen]);

  useEffect(() => () => {
    if (modalTimerRef.current !== null) window.clearTimeout(modalTimerRef.current);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    if (modalTimerRef.current !== null) window.clearTimeout(modalTimerRef.current);
    modalTimerRef.current = window.setTimeout(() => {
      setModal(null);
      modalTimerRef.current = null;
    }, localPreferences.reducedMotion ? 0 : 150);
  }, [localPreferences.reducedMotion]);

  const openModal = useCallback((kind: ModalKind) => {
    if (modalTimerRef.current !== null) window.clearTimeout(modalTimerRef.current);
    setMenuOpen(false);
    setModal(kind);
    window.requestAnimationFrame(() => setModalVisible(true));
  }, []);

  function startSidebarResize(event: ReactPointerEvent<HTMLButtonElement>) {
    if (collapsed || event.button !== 0) return;
    sidebarResizeRef.current = { pointerId: event.pointerId, startWidth: sidebarWidth, startX: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizingSidebar(true);
  }

  function moveSidebarResize(event: ReactPointerEvent<HTMLButtonElement>) {
    const resize = sidebarResizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    setSidebarWidth(clampSidebarWidth(resize.startWidth + event.clientX - resize.startX));
  }

  function finishSidebarResize() {
    sidebarResizeRef.current = null;
    setResizingSidebar(false);
  }

  function resizeSidebarWithKeyboard(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setSidebarWidth((width) => clampSidebarWidth(width + (event.key === "ArrowLeft" ? -8 : 8)));
  }

  return (
    <div
      className={styles.dashboard + (collapsed ? " " + styles.collapsed : "")}
      data-theme={resolvedTheme}
      data-density={localPreferences.density}
      data-reduce-motion={localPreferences.reducedMotion}
      data-high-contrast={localPreferences.highContrast}
      data-resizing-sidebar={resizingSidebar}
      style={{ "--dashboard-sidebar-width": sidebarWidth + "px", fontSize: String(localPreferences.textScale) + "%" } as CSSProperties}
    >
      <aside className={styles.sidebar} id="dashboard-sidebar" aria-label="Dashboard sidebar">
        <button
          className={styles.toggle}
          type="button"
          aria-controls="dashboard-sidebar"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((current) => !current)}
        >
          <Image
            className={styles.toggleIcon}
            src={collapsed ? "/icons/angle-right.svg" : "/icons/angle-left.svg"}
            alt=""
            width={14}
            height={14}
            aria-hidden="true"
          />
        </button>

        <div className={styles.workspaceSwitcher} ref={workspaceRef}>
          <button
            className={styles.workspaceButton}
            type="button"
            aria-haspopup="menu"
            aria-expanded={workspaceOpen}
            onClick={() => {
              if (collapsed) setCollapsed(false);
              else setWorkspaceOpen((current) => !current);
            }}
          >
            <span className={styles.workspaceMark}>{activeWorkspace?.name.charAt(0).toUpperCase() || "W"}</span>
            <span className={styles.label}><small>Workspace</small><strong>{activeWorkspace?.name || "No workspace"}</strong></span>
            <span className={`${styles.label} ${styles.workspaceChevron}`} aria-hidden="true">⌄</span>
          </button>
          <div className={styles.workspaceMenu} data-open={workspaceOpen} role="menu" aria-label="Switch workspace">
            {workspaces.map((workspace) => (
              <form action={switchWorkspace} key={workspace.id}>
                <input name="workspaceId" type="hidden" value={workspace.id} />
                <button type="submit" role="menuitem" onClick={() => setWorkspaceOpen(false)}>
                  <span>{workspace.name}<small>{roleLabel(workspace.role)}</small></span>
                  {workspace.id === activeWorkspace?.id && <span aria-label="Active workspace">✓</span>}
                </button>
              </form>
            ))}
            {!workspaces.length && <p>Create a workspace from Projects.</p>}
          </div>
        </div>

        <nav className={styles.sidebarNav} aria-label="Workspace navigation">
          <Link className={`${styles.sidebarItem}${pathname === "/dashboard" || pathname.startsWith("/dashboard/projects/") ? ` ${styles.sidebarItemActive}` : ""}`} href="/dashboard">
            <Image className={styles.sidebarIcon} src="/icons/clip.svg" alt="" width={18} height={18} aria-hidden="true" />
            <span className={styles.label}>Projects</span>
          </Link>
          <Link className={`${styles.sidebarItem}${pathname === "/dashboard/members" ? ` ${styles.sidebarItemActive}` : ""}`} href="/dashboard/members">
            <Image className={styles.sidebarIcon} src="/icons/age-alt.svg" alt="" width={18} height={18} aria-hidden="true" />
            <span className={styles.label}>Members</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.accountArea} ref={accountRef}>
            <button
              className={`${styles.sidebarItem} ${styles.sidebarProfileButton}`}
              type="button"
              aria-label={currentName + " account menu"}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => {
                if (collapsed) setCollapsed(false);
                else setMenuOpen((current) => !current);
              }}
            >
              <span className={styles.sidebarAvatar} style={safeAvatarUrl ? undefined : { backgroundColor }}><AvatarImage safeAvatarUrl={safeAvatarUrl} size={30} /></span>
              <span className={styles.label}><strong>{currentName}</strong><small>{email}</small></span>
            </button>
            <div className={styles.profileMenu} data-open={menuOpen} role="menu" aria-label="Account menu">
              <div className={styles.profileMenuHeader}>
                <span className={styles.menuAvatar} style={safeAvatarUrl ? undefined : { backgroundColor }}><AvatarImage safeAvatarUrl={safeAvatarUrl} size={34} /></span>
                <span><strong>{currentName}</strong><small>{email}</small></span>
              </div>
              <div className={styles.profileMenuItems}>
                <button type="button" role="menuitem" onClick={() => openModal("settings")}>Settings</button>
                <button type="button" role="menuitem" onClick={() => openModal("help")}>Help & feedback</button>
                <button type="button" role="menuitem" onClick={() => openModal("shortcuts")}>Keyboard shortcuts</button>
              </div>
              <div className={styles.profileMenuFooter}>
                <button type="button" role="menuitem" onClick={() => openModal("signout")}>Sign out</button>
              </div>
            </div>
          </div>
        </div>
        <button
          className={styles.sidebarResizeHandle}
          type="button"
          role="slider"
          aria-label="Resize dashboard sidebar"
          aria-orientation="horizontal"
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuemax={SIDEBAR_MAX_WIDTH}
          aria-valuenow={sidebarWidth}
          tabIndex={collapsed ? -1 : 0}
          onKeyDown={resizeSidebarWithKeyboard}
          onPointerDown={startSidebarResize}
          onPointerMove={moveSidebarResize}
          onPointerUp={finishSidebarResize}
          onPointerCancel={finishSidebarResize}
          onLostPointerCapture={finishSidebarResize}
        />
      </aside>

      <main className={styles.workspace} aria-label="Dashboard workspace">{children}</main>

      {modal && (
        <DashboardModal
          displayName={currentName}
          email={email}
          kind={modal}
          localPreferences={localPreferences}
          memberCount={memberCount}
          avatarColor={backgroundColor}
          avatarUrl={safeAvatarUrl}
          onClose={closeModal}
          onAvatarChange={setCurrentAvatarUrl}
          onDisplayNameChange={setCurrentName}
          onLocalPreferencesChange={setLocalPreferences}
          productUpdatesConsent={productUpdatesConsent}
          username={username}
          visible={modalVisible}
          workspaceName={activeWorkspace?.name || "No workspace"}
          workspaceRole={activeWorkspace ? roleLabel(activeWorkspace.role) : "No role"}
        />
      )}
    </div>
  );
}

function roleLabel(role: string) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}

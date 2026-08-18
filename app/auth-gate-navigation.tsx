"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const GATE_PATHS = new Set(["/login", "/waitlist"]);

type PageSnapshot = {
  html: string;
  scrollY: number;
  source: string;
  target: string;
  exiting: boolean;
};

export function AuthGateNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<PageSnapshot | null>(null);
  const clearTimer = useRef<number | null>(null);
  const motionTimer = useRef<number | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
        || window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) return;

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.download || (anchor.target && anchor.target !== "_self")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      const isGateBack = anchor.hasAttribute("data-auth-gate-back") && GATE_PATHS.has(pathname);
      if (isGateBack) {
        if (!snapshot || snapshot.exiting) return;

        event.preventDefault();
        document.body.dataset.authGate = "exiting";
        setSnapshot({ ...snapshot, exiting: true });
        if (motionTimer.current) window.clearTimeout(motionTimer.current);
        if (clearTimer.current) window.clearTimeout(clearTimer.current);
        clearTimer.current = window.setTimeout(() => {
          router.replace(snapshot.source, { scroll: false });
        }, 760);
        return;
      }

      if (!GATE_PATHS.has(destination.pathname)) return;

      if (GATE_PATHS.has(pathname)) {
        if (snapshot) setSnapshot({ ...snapshot, target: destination.pathname });
        return;
      }

      const currentPage = document.querySelector("body > main");
      if (!currentPage) return;

      event.preventDefault();
      const clone = currentPage.cloneNode(true) as HTMLElement;
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
      setSnapshot({
        html: clone.outerHTML,
        scrollY: window.scrollY,
        source: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        target: destination.pathname,
        exiting: false,
      });
      document.body.dataset.authGate = "entering";

      if (clearTimer.current) window.clearTimeout(clearTimer.current);
      clearTimer.current = window.setTimeout(() => {
        delete document.body.dataset.authGate;
        setSnapshot(null);
      }, 3000);
      router.push(`${destination.pathname}${destination.search}${destination.hash}`);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, router, snapshot]);

  useEffect(() => {
    if (!snapshot) return;

    if (pathname === snapshot.target) {
      if (!snapshot.exiting && clearTimer.current) {
        window.clearTimeout(clearTimer.current);
        clearTimer.current = null;
      }
      if (!snapshot.exiting && document.body.dataset.authGate === "entering") {
        if (motionTimer.current) window.clearTimeout(motionTimer.current);
        motionTimer.current = window.setTimeout(() => {
          delete document.body.dataset.authGate;
          motionTimer.current = null;
        }, 760);
      }
      return;
    }

    if (!snapshot.exiting && pathname === new URL(snapshot.source, window.location.origin).pathname) return;

    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    const frame = window.requestAnimationFrame(() => {
      if (snapshot.exiting) {
        const scrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, snapshot.scrollY);
        document.documentElement.style.scrollBehavior = scrollBehavior;
      }
      delete document.body.dataset.authGate;
      setSnapshot(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, snapshot]);

  useEffect(() => () => {
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    if (motionTimer.current) window.clearTimeout(motionTimer.current);
    delete document.body.dataset.authGate;
  }, []);

  if (!snapshot) return null;

  return (
    <div className="auth-route-backdrop" aria-hidden="true" inert>
      <div
        className="auth-route-backdrop__page"
        style={{ transform: `translate3d(0, -${snapshot.scrollY}px, 0)` }}
        dangerouslySetInnerHTML={{ __html: snapshot.html }}
      />
    </div>
  );
}

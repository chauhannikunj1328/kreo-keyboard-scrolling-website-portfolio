import { useSyncExternalStore } from "react";

// A very small router: real paths, no dependency. Any plain <a href="/..."> navigates inside the
// site (see installLinkHandling), so components just write ordinary links.
const subscribers = new Set<() => void>();
const emit = () => subscribers.forEach((fn) => fn());

export function navigate(to: string) {
  history.pushState(null, "", to);
  scrollTo({ top: 0, behavior: "instant" });
  emit();
}

export const useLocation = () =>
  useSyncExternalStore(
    (fn) => {
      subscribers.add(fn);
      addEventListener("popstate", fn);
      return () => {
        subscribers.delete(fn);
        removeEventListener("popstate", fn);
      };
    },
    () => location.pathname + location.search,
  );

export function installLinkHandling() {
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest?.("a[href]");
    const href = a?.getAttribute("href");
    if (!href?.startsWith("/")) return;
    e.preventDefault();
    navigate(href);
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}

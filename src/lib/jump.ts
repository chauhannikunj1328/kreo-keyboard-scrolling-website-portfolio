import type { MouseEvent } from "react";

// Smooth-scroll to a section of the page and keep the address shareable. Used by every
// "Buy now" button and the tabs under the header.
export const jumpTo = (id: string) => (e: MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
};

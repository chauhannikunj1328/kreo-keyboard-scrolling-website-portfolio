import { useEffect, useRef, useState, type MouseEvent, type Ref } from "react";
import type { SectionName } from "../lib/ui";
import { Button } from "./Button";
import { jumpTo } from "../lib/jump";
import styles from "./Nav.module.css";

const LINKS: { name: SectionName; label: string }[] = [
  { name: "overview", label: "Overview" },
  { name: "inside", label: "Inside" },
  { name: "vibe-row", label: "Layout" },
  { name: "knob", label: "Knob" },
  { name: "specs", label: "Switch" },
];

// the product page below the story
const PAGE = [["buy", "Details"]] as const;

// The product bar under the store header: the sections of this page, and the buy button.
// Where the tabs don't fit in a row (900px and under) they fold into a menu: the bar names the
// section you're in, and tapping it drops down the full list.
export function Nav({ ref, active, onGo }: { ref?: Ref<HTMLElement>; active: SectionName | null; onGo: (name: SectionName) => void }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  // past the end of the story there's no 3D section: the reader is in the details
  const current = LINKS.find((l) => l.name === active)?.label ?? "Details";

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !toggle.current?.contains(t)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const go = (name: SectionName) => (e: MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    onGo(name);
  };
  const jump = (id: string) => (e: MouseEvent) => {
    setOpen(false);
    jumpTo(id)(e);
  };

  return (
    <nav ref={ref} className={`${styles.nav} ${open ? styles.open : ""}`} aria-label="Swarm 75 sections">
      <a className={styles.product} href="#overview" onClick={go("overview")}>
        Swarm 75
      </a>
      <button ref={toggle} type="button" className={styles.toggle} aria-expanded={open} aria-controls="section-menu" onClick={() => setOpen((o) => !o)}>
        <small>Swarm 75</small>
        <span>
          {current}
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div ref={menu} id="section-menu" className={styles.links}>
        {LINKS.map(({ name, label }) => (
          <a
            key={name}
            href={`#${name}`}
            className={active === name ? styles.active : undefined}
            aria-current={active === name ? "true" : undefined}
            onClick={go(name)}
          >
            {label}
          </a>
        ))}
        {PAGE.map(([id, label]) => (
          <a key={id} href={`#${id}`} className={active === null ? styles.active : undefined} onClick={jump(id)}>
            {label}
          </a>
        ))}
      </div>
      <div className={styles.buy}>
        <Button small href="#buy" onClick={jump("buy")}>
          Buy now · ₹4,799
        </Button>
      </div>
    </nav>
  );
}

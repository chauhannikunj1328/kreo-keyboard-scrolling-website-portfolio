import type { MouseEvent, Ref } from "react";
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

// the product bar under the store header: the sections of this page, and the buy button
export function Nav({ ref, active, onGo }: { ref?: Ref<HTMLElement>; active: SectionName | null; onGo: (name: SectionName) => void }) {
  const go = (name: SectionName) => (e: MouseEvent) => {
    e.preventDefault();
    onGo(name);
  };
  return (
    <nav ref={ref} className={styles.nav} aria-label="Swarm 75 sections">
      <a className={styles.product} href="#overview" onClick={go("overview")}>
        Swarm 75
      </a>
      <div className={styles.links}>
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
          <a key={id} href={`#${id}`} className={styles.extra} onClick={jumpTo(id)}>
            {label}
          </a>
        ))}
      </div>
      <div className={styles.buy}>
        <Button small href="#buy" onClick={jumpTo("buy")}>
          Buy now · ₹4,799
        </Button>
      </div>
    </nav>
  );
}

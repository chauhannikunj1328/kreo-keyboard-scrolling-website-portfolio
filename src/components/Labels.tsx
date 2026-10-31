import type { Ref } from "react";
import styles from "./Labels.module.css";

const LAYERS = [
  ["caps", "Keycaps", "PBT double-shot · RGB passes through"],
  ["switch", "Mechanical switches", "Starling linear · pre-lubed · hot-swap"],
  ["frame", "Top case", "White bezel · the switches sit in it"],
  ["plate", "Plate", "PC plate · gasket mounted"],
  ["foam", "Dampening foam", "5-layer sound absorption"],
  ["pcb", "Logic board", "Hot-swap · Bluetooth, 2.4GHz, USB-C"],
  ["battery", "Battery", "4000 mAh · 270+ hours"],
  ["base", "Unibody case", "Unibody case · two-level foot lift"],
] as const;

const PARTS = [
  ["cap", "Keycap", "PBT · double-shot"],
  ["switch", "Linear switch", "Starling · 3.5 mm travel"],
  ["spring", "Spring", "43 gf operating force"],
  ["pad", "Key light", "RGB passes through the cap"],
] as const;

export function Labels({ ref }: { ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={styles.labels}>
      {LAYERS.map(([layer, title, note]) => (
        <div key={layer} className={`${styles.label} ${styles.left}`} data-layer={layer}>
          <div className={styles.box}>
            <b>{title}</b>
            <span>{note}</span>
          </div>
        </div>
      ))}
      {PARTS.map(([part, title, note]) => (
        <div key={part} className={`${styles.label} ${styles.right}`} data-part={part}>
          <div className={styles.box}>
            <b>{title}</b>
            <span>{note}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

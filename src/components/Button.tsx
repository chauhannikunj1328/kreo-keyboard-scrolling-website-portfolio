import type { MouseEventHandler, ReactNode } from "react";
import styles from "./Button.module.css";

export function Button({ href = "#", small, ghost, onClick, children }: { href?: string; small?: boolean; ghost?: boolean; onClick?: MouseEventHandler; children: ReactNode }) {
  const cls = [styles.button, small && styles.small, ghost && styles.ghost].filter(Boolean).join(" ");
  return (
    <a className={cls} href={href} onClick={onClick}>
      {children}
    </a>
  );
}

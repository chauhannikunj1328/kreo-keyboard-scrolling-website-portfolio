import type { Ref } from "react";
import { Button } from "./Button";
import { jumpTo } from "../lib/jump";
import styles from "./Final.module.css";

export function Final({ ref }: { ref?: Ref<HTMLElement> }) {
  return (
    <section ref={ref} className={styles.final}>
      <h2 className={styles.title}>
        Built to sound <br />
        this good.
      </h2>
      <p className={styles.closer}>Kreo Swarm 75. Wireless, in White Purple.</p>
      <div className={styles.buttons}>
        <Button href="#buy" onClick={jumpTo("buy")}>
          Buy now · ₹4,799
        </Button>
        <Button ghost href="/">All keyboards</Button>
      </div>
      <small className={styles.footnote}>© 2026 Kreo</small>
    </section>
  );
}

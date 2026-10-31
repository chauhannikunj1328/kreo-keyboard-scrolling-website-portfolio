import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { KREO_K } from "../lib/kreo-mark";
import styles from "./Loader.module.css";

export interface LoaderHandle {
  // the share of the download that's done, 0–1 (it only ever moves forward)
  progress(fraction: number): void;
  // run the bar up to 100%; resolves once it's there
  finish(): Promise<void>;
}

// How long the bar rests on 100% before the intro takes over, so the full knob turn reads.
const HOLD = 260;

// The loading capsule: a glowing fill in the buy button's purple, and the keyboard's silver volume
// knob at the end of it, turning one full circle as the bar goes from 1 to 100%. Downloads arrive
// in a few lumps, so the bar creeps on ahead of them and never sits still.
export function Loader({ ref }: { ref?: Ref<LoaderHandle> }) {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const state = useRef({ real: 0, shown: 0, finishing: false, full: false, waiting: [] as (() => void)[] });

  useImperativeHandle(
    ref,
    () => ({
      progress(fraction) {
        state.current.real = Math.max(state.current.real, fraction);
      },
      finish() {
        const s = state.current;
        s.finishing = true;
        return new Promise((resolve) => (s.full ? resolve() : s.waiting.push(resolve)));
      },
    }),
    [],
  );

  useEffect(() => {
    const s = state.current;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const goal = s.finishing ? 1 : Math.min(0.94, s.real + 0.2);
      s.shown += (goal - s.shown) * (1 - Math.exp(-dt * (s.finishing ? 6 : 1.3)));
      if (s.finishing && s.shown > 0.996) s.shown = 1;
      const pct = Math.max(1, Math.round(s.shown * 100));
      root.current!.style.setProperty("--p", s.shown.toFixed(4));
      root.current!.setAttribute("aria-valuenow", String(pct));
      label.current!.textContent = `${pct}%`;
      if (s.shown === 1) {
        setTimeout(() => {
          s.full = true;
          s.waiting.splice(0).forEach((resolve) => resolve());
        }, HOLD);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={root} className={styles.loader} role="progressbar" aria-label="Loading the 3D keyboard" aria-valuemin={1} aria-valuemax={100} aria-valuenow={1}>
      <span className={styles.halo} aria-hidden="true" />
      <div className={styles.capsule}>
        <div className={styles.track}>
          <span className={styles.fill} />
          <span ref={label} className={styles.label}>
            1%
          </span>
        </div>
        <span className={styles.knob} aria-hidden="true">
          <span className={styles.face}>
            <svg viewBox="-60 -10 610 720">
              <path d={KREO_K} />
              <circle cx="244" cy="622" r="54" />
            </svg>
          </span>
        </span>
      </div>
      <span className={styles.shadow} aria-hidden="true" />
      <span className={styles.reflection} aria-hidden="true" />
    </div>
  );
}

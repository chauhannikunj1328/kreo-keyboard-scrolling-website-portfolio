import { useEffect, useRef, useState } from "react";
import type { Experience } from "../lib/stage";
import type { SectionName } from "../lib/ui";
import { Header } from "./Header";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Panel } from "./Panel";
import { Labels } from "./Labels";
import { Final } from "./Final";
import { Product } from "./Product";
import type { CatalogItem } from "../lib/catalog";
import styles from "./Story.module.css";

const INSIDE = { eyebrow: "Inside", title: <>Five layers of <br />sound absorption.</> };
const VIBE_ROW = { eyebrow: "75% layout", title: <>Compact, with <br /><em>every key you need.</em></> };
const KNOB = {
  eyebrow: "Metal volume knob",
  title: <>Seamless control, <br /><em>premium feel.</em></>,
  body: "A solid metal knob at the corner of the board, for your volume without leaving the keys.",
};
const ACCEPT = {
  eyebrow: "The switch",
  title: <>Smooth, <br />quiet and <br /><em>pre-lubed.</em></>,
  body: "Kreo Starling linear switches: 43 gf operating force and 3.5 mm of travel, factory lubed for fast activation and less noise.",
};

// The page is one fixed WebGL canvas (the keyboard) under one fixed layer of
// copy; a tall empty <main> gives the scroll that drives both (src/lib/scroll.ts).
export function Story({ item }: { item: CatalogItem }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  const hero = useRef<HTMLElement>(null);
  const cue = useRef<HTMLSpanElement>(null);
  const inside = useRef<HTMLElement>(null);
  const vibe = useRef<HTMLElement>(null);
  const knob = useRef<HTMLElement>(null);
  const key = useRef<HTMLElement>(null);
  const final = useRef<HTMLElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const story = useRef<HTMLElement>(null);
  const experience = useRef<Experience | null>(null);
  const [active, setActive] = useState<SectionName | null>("overview");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const cancelled = new AbortController();
    // three.js and the post-processing load in their own chunk
    import("../lib/stage")
      .then(({ startExperience }) =>
        startExperience({
          canvas: canvas.current!,
          ui: {
            veil: veil.current!,
            nav: nav.current!,
            hero: hero.current!,
            scrollCue: cue.current!,
            inside: inside.current!,
            vibeCopy: vibe.current!,
            knobCopy: knob.current!,
            keyCopy: key.current!,
            final: final.current!,
            labels: labels.current!,
            story: story.current!,
          },
          onSection: setActive,
          cancelled: cancelled.signal,
        }),
      )
      .then((exp) => {
        if (cancelled.signal.aborted) exp?.dispose();
        else experience.current = exp;
      })
      .catch((err) => {
        // the textures or WebGL failed: show the page's copy rather than a blank screen
        console.error(err);
        if (cancelled.signal.aborted) return;
        document.body.classList.remove("is-locked");
        veil.current!.style.display = "none";
        nav.current!.style.opacity = "1";
        hero.current!.style.opacity = "1";
        setFailed(true);
      });
    return () => {
      cancelled.abort();
      experience.current?.dispose();
      experience.current = null;
    };
  }, []);

  return (
    <>
      <canvas ref={canvas} className={styles.gl} aria-hidden="true" />
      <div className={styles.bars}>
        <Header />
        <Nav ref={nav} active={active} onGo={(name) => experience.current?.goToSection(name)} />
      </div>
      <div className={styles.ui}>
        <div ref={veil} className={styles.veil}>
          <div className={styles.loader} role="status" aria-label="Loading">
            <span className={styles.mark}>kreo</span>
            <span className={styles.bar} />
          </div>
        </div>
        {failed && (
          <p className={styles.error}>
            The 3D keyboard couldn't load. Check your connection, then{" "}
            <button type="button" onClick={() => location.reload()}>
              reload
            </button>
            .
          </p>
        )}
        <Hero ref={hero} cueRef={cue} onCue={() => experience.current?.goToSection("inside")} />
        <Panel ref={inside} place="inside" {...INSIDE} />
        <Panel ref={vibe} place="vibe" {...VIBE_ROW} />
        <Labels ref={labels} />
        <Panel ref={knob} place="key" {...KNOB} />
        <Panel ref={key} place="key" {...ACCEPT} />
        <Final ref={final} />
      </div>
      <main ref={story} className={styles.scroll} aria-label="Kreo" />
      <Product item={item} under3D />
    </>
  );
}

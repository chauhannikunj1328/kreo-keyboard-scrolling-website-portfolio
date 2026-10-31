// The DOM the 3D experience drives: React renders it, the timelines fade and
// move it (see preloader.ts, scroll.ts) and the labels follow the model.
export interface UiRefs {
  veil: HTMLElement;
  nav: HTMLElement;
  hero: HTMLElement;
  scrollCue: HTMLElement;
  inside: HTMLElement;
  vibeCopy: HTMLElement;
  keyCopy: HTMLElement;
  knobCopy: HTMLElement;
  final: HTMLElement;
  labels: HTMLElement;
  // the tall empty element whose height is the length of the 3D story (the product page follows it)
  story: HTMLElement;
}

// Where each nav link lands on the scroll timeline (progress 0–1): the hero,
// the split layers with their callouts, the vibe row as it starts lighting
// up, the volume knob, and one key split into its parts.
export const SECTIONS = { overview: 0, inside: 0.283, "vibe-row": 0.475, knob: 0.725, specs: 0.9 } as const;
export type SectionName = keyof typeof SECTIONS;
export const sectionAt = (p: number): SectionName | null =>
  p < 0.142 ? "overview" : p < 0.383 ? "inside" : p < 0.59 ? "vibe-row" : p < 0.755 ? "knob" : p < 0.958 ? "specs" : null;
export const isSection = (name: string): name is SectionName => name in SECTIONS;

// Swarm 75 layout, measured from a top-down product photo. Units are centimetres; one key unit
// (u) is a 19 mm pitch. Positions below are in u from the top-left key. The F row stands apart
// from the main block, the right-hand column sits half a unit away, and the arrows drop below it.

export const U = 1.9;
export const CAP_GAP = 0.1; // pitch minus cap size: the caps nearly touch at the skirt
export const WELL_PAD = 0.07; // clearance between a cap and its well wall
export const MARGIN_X = 0.76;
export const MARGIN_Z = 0.8;

export type VibeKind = "prompt" | "talk" | "reject" | "accept";
export type ArrowDir = "left" | "up" | "down" | "right" | "back";
export type Tone = "white" | "purple" | "dark";

// What's printed on a cap (see textures.ts → drawAtlas): one centred glyph,
// a pair side by side, a small word, an arrow, or the space bar's light line.
export interface Legend {
  c?: string;
  t?: string;
  b?: string;
  s?: string;
  arrow?: ArrowDir;
  spacebar?: boolean;
}

export interface Key {
  id: string;
  index: number;
  row: number;
  x: number;
  z: number;
  w: number;
  d: number;
  wellW: number;
  wellD: number;
  legend: Legend;
  tone: Tone;
  vibe: VibeKind | null;
}

// a key may fix its own column (x, in u) and drop below its row (dv, in u)
type KeyDef = [id: string, width: number, legend: Legend, at?: { x?: number; dv?: number }];
const L = (c: string): Legend => ({ c });
const N = (t: string, b: string): Legend => ({ t, b });
const word = (s: string): Legend => ({ s });
const GAP: KeyDef = ["_", 0.25, {}];

const ROW_V = [0.5, 1.8, 2.8, 3.8, 4.8, 5.8]; // row centres, from the top edge of the F row
const DROP = 0.25; // how far the arrow cluster sits below its row
const WIDE = 16.5;
const DEEP = 6.55;
const RIGHT = 15.5; // the left edge of the separate right-hand column

const ROWS: KeyDef[][] = [
  [
    ["esc", 1, word("ESC")],
    GAP,
    ...[1, 2, 3, 4].map((n): KeyDef => [`F${n}`, 1, L(`F${n}`)]),
    GAP,
    ...[5, 6, 7, 8].map((n): KeyDef => [`F${n}`, 1, L(`F${n}`)]),
    GAP,
    ...[9, 10, 11, 12].map((n): KeyDef => [`F${n}`, 1, L(`F${n}`)]),
    GAP,
    ["prtsc", 1, word("PRTSC")],
  ],
  [
    ["`", 1, N("~", "`")],
    ["1", 1, N("!", "1")],
    ["2", 1, N("@", "2")],
    ["3", 1, N("#", "3")],
    ["4", 1, N("$", "4")],
    ["5", 1, N("%", "5")],
    ["6", 1, N("^", "6")],
    ["7", 1, N("&", "7")],
    ["8", 1, N("*", "8")],
    ["9", 1, N("(", "9")],
    ["0", 1, N(")", "0")],
    ["-", 1, N("_", "-")],
    ["=", 1, N("+", "=")],
    ["backspace", 2, { arrow: "back" }],
    ["del", 1, word("DEL"), { x: RIGHT }],
  ],
  [
    ["tab", 1.5, word("TAB")],
    ..."QWERTYUIOP".split("").map((k): KeyDef => [k, 1, L(k)]),
    ["[", 1, N("{", "[")],
    ["]", 1, N("}", "]")],
    ["\\", 1.5, N("|", "\\")],
    ["pgup", 1, word("PGUP"), { x: RIGHT }],
  ],
  [
    ["caps", 1.75, word("CAPS")],
    ..."ASDFGHJKL".split("").map((k): KeyDef => [k, 1, L(k)]),
    [";", 1, N(":", ";")],
    ["'", 1, N('"', "'")],
    ["enter", 2.25, word("ENTER")],
    ["pgdn", 1, word("PGDN"), { x: RIGHT }],
  ],
  [
    ["shift", 2.25, word("SHIFT")],
    ..."ZXCVBNM".split("").map((k): KeyDef => [k, 1, L(k)]),
    [",", 1, N("<", ",")],
    [".", 1, N(">", ".")],
    ["/", 1, N("?", "/")],
    ["rshift", 1.75, word("SHIFT")],
    ["up", 1, { arrow: "up" }, { x: 14.13, dv: DROP }],
    ["end", 1, word("END"), { x: RIGHT }],
  ],
  [
    ["ctrl", 1.25, word("CTRL")],
    ["win", 1.25, word("WIN")],
    ["alt", 1.25, word("ALT")],
    ["space", 6.25, { spacebar: true }],
    ["ralt", 1, word("ALT")],
    ["fn", 1, word("FN")],
    ["rctrl", 1, word("CTRL")],
    ["left", 1, { arrow: "left" }, { x: 13.13, dv: DROP }],
    ["down", 1, { arrow: "down" }, { x: 14.13, dv: DROP }],
    ["right", 1, { arrow: "right" }, { x: 15.13, dv: DROP }],
  ],
];

// white caps, with purple modifiers and F5–F8, and dark Esc, Enter, space and arrows
const PURPLE = new Set(["tab", "caps", "shift", "rshift", "ctrl", "win", "alt", "ralt", "fn", "rctrl", "backspace", "del", "pgup", "pgdn", "end", "prtsc", "F5", "F6", "F7", "F8"]);
const DARK = new Set(["esc", "enter", "space", "up", "left", "down", "right"]);
const toneOf = (id: string): Tone => (PURPLE.has(id) ? "purple" : DARK.has(id) ? "dark" : "white");

export const BODY_W = WIDE * U + MARGIN_X * 2;
export const BODY_D = DEEP * U + MARGIN_Z * 2;

// from layout units to centimetres in the keyboard's own frame
export const uX = (u: number) => (u - WIDE / 2) * U;
export const uZ = (v: number) => (v - DEEP / 2) * U;

export const KNOB = { x: uX(16), z: uZ(0.5) };
export const STATUS_LEDS = [1.51, 1.8, 2.09].map((v) => ({ x: uX(15.2), z: uZ(v) }));

// the recessed windows in the top case, each a list of corners in layout units
const box = (l: number, t: number, r: number, b: number): [number, number][] => [[l, t], [r, t], [r, b], [l, b]];
export const WINDOWS: [number, number][][] = [
  box(0, 0, 1, 1),
  box(1.25, 0, 5.25, 1),
  box(5.5, 0, 9.5, 1),
  box(9.75, 0, 13.75, 1),
  box(14, 0, 15, 1),
  box(RIGHT, 1.3, RIGHT + 1, 5.3),
  // the main block steps in along the bottom right, around the arrows
  [[0, 1.3], [15, 1.3], [15, 4.3], [14, 4.3], [14, 5.3], [13, 5.3], [13, 6.3], [0, 6.3]],
  // the arrows, an inverted T
  [[14.13, 4.55], [15.13, 4.55], [15.13, 5.55], [16.13, 5.55], [16.13, 6.55], [13.13, 6.55], [13.13, 5.55], [14.13, 5.55]],
];

// Flattened key list with centres (x, z), cap size (w, d) and well size.
export const KEYS: Key[] = (() => {
  const keys: Key[] = [];
  ROWS.forEach((row, r) => {
    let u = 0;
    for (const [id, w, legend, at] of row) {
      if (at?.x !== undefined) u = at.x;
      if (id !== "_") {
        const capW = w * U - CAP_GAP;
        const capD = U - CAP_GAP;
        keys.push({
          id,
          index: keys.length,
          row: r,
          x: uX(u + w / 2),
          z: uZ(ROW_V[r] + (at?.dv ?? 0)),
          w: capW,
          d: capD,
          wellW: capW + WELL_PAD * 2,
          wellD: capD + WELL_PAD * 2,
          legend,
          tone: toneOf(id),
          vibe: null,
        });
      }
      u += w;
    }
  });
  return keys;
})();

const indexOf = (id: string) => KEYS.findIndex((k) => k.id === id);
// the home row, which the scroll story frames; and the key that comes apart into its parts
export const VIBE = KEYS.filter((k) => k.row === 3).map((k) => k.index);
export const ACCEPT_INDEX = indexOf("H");

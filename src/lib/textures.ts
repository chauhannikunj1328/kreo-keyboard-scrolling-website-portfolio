import * as THREE from "three";
import { KEYS, type Key } from "./layout";
import type { KeyboardInputs } from "./keyboard";

const BASE = "https://assets.uberdesigner.ai/vibetyper/";

const PX = 96; // atlas pixels per cm
const ATLAS = 2048;
const FONT = '"Inter", system-ui, sans-serif';

// Legend colours follow the backlight across the board, as in the product photos: red, orange,
// then blue on the white caps; pink to white on the purple ones; white on the dark ones.
function inkOf(k: Key) {
  const t = k.x / 31.4 + 0.5;
  if (k.tone === "dark") return "#f4efff";
  if (k.tone === "purple") {
    if (/^F[5-7]$/.test(k.id)) return "#ff8a2a";
    if (k.id === "F8") return "#c23cff";
    return t < 0.3 ? "#ffc2d6" : t < 0.6 ? "#f6dcff" : "#f4f2ff";
  }
  if (k.id === "F12") return "#39c6f5";
  return t < 0.4 ? "#e8392f" : t < 0.53 ? "#f07a1a" : "#1f86e0";
}
// the k from the Kreo logo (public/kreo-logo.svg), in that file's coordinates: 490 wide, 640 tall from y 32
const KREO_K = "M0.0 251.5L0.0 32.0L41.5 32.0L83.0 32.0L83.0 167.5C83.0 242.0 83.4 303.0 83.8 303.0C84.2 303.0 90.4 300.5 97.6 297.4C104.7 294.3 122.0 287.1 136.0 281.3C241.1 237.8 263.9 227.9 305.0 207.3C339.9 189.9 348.3 184.7 359.5 173.5C385.8 147.1 399.8 106.1 403.6 44.8L404.3 33.0L446.8 33.0L489.3 33.0L488.6 48.6C485.0 132.0 462.1 192.5 417.1 237.8C379.2 275.8 337.8 297.0 214.0 341.5C128.5 372.3 93.5 388.8 57.7 415.3C39.8 428.5 17.2 449.9 5.6 464.8C2.9 468.2 0.5 471.0 0.4 471.0C0.2 471.0 0.0 372.2 0.0 251.5ZM406.6 670.6C393.4 598.9 369.5 561.7 322.3 539.3C252.7 506.2 182.8 512.9 137.6 556.8C111.0 582.7 95.2 613.8 82.0 666.8L80.9 671.0L41.0 671.0L1.0 671.0L0.8 665.8C-2.7 554.4 85.1 454.7 205.2 433.8C223.0 430.7 263.1 430.5 280.5 433.4C395.0 452.4 482.9 547.3 487.7 657.0L488.3 671.7L485.6 672.2C484.2 672.5 465.9 672.7 445.0 672.7C407.4 672.6 406.9 672.6 406.6 670.6Z";

interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
}

// One atlas cell per key, shelf-packed in key order (2 px padding); each key
// gets a uv rect (offset.xy, scale.zw) into the legends image.
function packAtlas() {
  const cells: Cell[] = [];
  const rects: [number, number, number, number][] = [];
  let x = 0;
  let y = 0;
  let shelf = 0;
  for (const k of KEYS) {
    const w = Math.ceil(k.w * PX) + 4;
    const h = Math.ceil(k.d * PX) + 4;
    if (x + w > ATLAS) {
      x = 0;
      y += shelf;
      shelf = 0;
    }
    cells.push({ x: x + 2, y: y + 2, w: w - 4, h: h - 4 });
    rects.push([(x + 2) / ATLAS, 1 - (y + 2 + h - 4) / ATLAS, (w - 4) / ATLAS, (h - 4) / ATLAS]);
    x += w;
    shelf = Math.max(shelf, h);
  }
  return { cells, rects };
}

// The legends are drawn here, in the key layout's own order, so the atlas
// always matches the layout (the legend plane scales each cell onto its cap's face).
function drawAtlas(cells: Cell[]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = ATLAS;
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  KEYS.forEach((k, i) => {
    const { x, y, w, h } = cells[i];
    const lg = k.legend;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.translate(x + w / 2, y + h / 2);
    const ink = inkOf(k);
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.lineWidth = h * 0.05;
    ctx.lineCap = ctx.lineJoin = "round";
    const text = (s: string, size: number, dy = 0, weight = 600) => {
      ctx.font = `${weight} ${size}px ${FONT}`;
      const fit = Math.min(1, (w * 0.8) / ctx.measureText(s).width);
      ctx.font = `${weight} ${size * fit}px ${FONT}`;
      ctx.fillText(s, 0, dy);
    };
    if (lg.c) text(lg.c, h * (lg.c.length > 1 ? 0.3 : 0.36));
    if (lg.b) text(`${lg.b} ${lg.t}`, h * 0.3);
    if (lg.s) text(lg.s, h * 0.27, 0, 700);
    if (lg.arrow === "back") {
      const a = w * 0.22;
      ctx.beginPath();
      ctx.moveTo(a, 0);
      ctx.lineTo(-a, 0);
      ctx.moveTo(-a + h * 0.12, -h * 0.12);
      ctx.lineTo(-a, 0);
      ctx.lineTo(-a + h * 0.12, h * 0.12);
      ctx.stroke();
    } else if (lg.arrow) {
      const s = h * 0.085;
      const d = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[lg.arrow];
      const [dx, dy] = d;
      ctx.beginPath();
      ctx.moveTo(-dx * s + dy * s, -dy * s + dx * s);
      ctx.lineTo(dx * s, dy * s);
      ctx.lineTo(-dx * s - dy * s, -dy * s - dx * s);
      ctx.stroke();
    }
    if (lg.spacebar) {
      ctx.strokeStyle = "#ffb4cf";
      ctx.lineWidth = h * 0.025;
      ctx.beginPath();
      ctx.moveTo(-w * 0.05, 0);
      ctx.lineTo(w * 0.05, 0);
      ctx.stroke();
    }
    ctx.restore();
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

// The knob's top: spun silver (a conic sweep of light, with fine turned rings) and the Kreo
// mark etched into it, drawn large so it stays sharp when the camera is close.
function drawKnobFace() {
  const S = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const sweep = ctx.createConicGradient(0.6, S / 2, S / 2);
  const stops = ["#f6f7fa", "#c9ccd4", "#eef0f4", "#b9bdc7", "#f8f9fb", "#c6cad3", "#eff1f5", "#bcc0ca", "#f6f7fa"];
  stops.forEach((c, i) => sweep.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, S, S);
  ctx.lineWidth = 1.5;
  for (let r = 8; r < S * 0.72; r += 6) {
    ctx.strokeStyle = `rgba(${r % 12 ? "255,255,255" : "70,74,86"},0.05)`;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // the mark: dark enough to read at a glance, with a light lower edge like a real etch
  const k = new Path2D(KREO_K);
  const scale = (S * 0.5) / 640;
  const place = (dy: number) => {
    ctx.setTransform(scale, 0, 0, scale, S / 2 - 244 * scale, S / 2 - 352 * scale + dy);
  };
  const dot = () => {
    ctx.beginPath();
    ctx.arc(244, 622, 54, 0, Math.PI * 2);
    ctx.fill();
  };
  place(5);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill(k);
  dot();
  place(0);
  ctx.fillStyle = "#3f424c";
  ctx.fill(k);
  dot();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

// the soft glow around the knob's well: a cool silver tint, because plain white light can't
// show up on a white case
function drawGlow() {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.2, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(128,146,205,0.85)");
  g.addColorStop(0.35, "rgba(150,166,220,0.42)");
  g.addColorStop(1, "rgba(170,184,232,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// the soft shadow under the keyboard: a blurred rounded block, drawn off-canvas so only its
// shadow lands on the texture
function drawShadow() {
  const W = 768;
  const H = 384;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.shadowColor = "rgba(62, 50, 96, 1)";
  ctx.shadowBlur = 42;
  ctx.shadowOffsetX = W * 2;
  ctx.fillRect(W * 0.11 - W * 2, H * 0.18, W * 0.78, H * 0.64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export async function loadTextures(): Promise<KeyboardInputs> {
  const loader = new THREE.TextureLoader();
  const load = async (file: string, { srgb = true, aniso = 8 } = {}) => {
    const t = await loader.loadAsync(BASE + file);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    return t;
  };
  const [padTexture, pcbTexture, batteryTexture, grain, smudge] = await Promise.all([
    load("light-pool.png", { srgb: false, aniso: 4 }),
    load("pcb.webp"),
    load("battery.webp"),
    load("grain-normal.png", { srgb: false }),
    load("smudge.png", { srgb: false, aniso: 4 }),
    // the legends use these faces: wait for them before drawing
    ...['500 40px "Inter"', '600 40px "Inter"'].map((f) => document.fonts.load(f)),
  ]);
  const { cells, rects } = packAtlas();
  // the surface maps tile: ExtrudeGeometry UVs are in centimetres, so repeat sets the physical scale
  const tiled = (tex: THREE.Texture, cm: number) => {
    const t = tex.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / cm, 1 / cm);
    t.needsUpdate = true;
    return t;
  };
  return {
    legend: { texture: drawAtlas(cells), rects },
    knobFace: drawKnobFace(),
    knobGlow: drawGlow(),
    softShadow: drawShadow(),
    padTexture,
    pcbTexture,
    batteryTexture,
    surface: { metalNormal: tiled(grain, 1.6), capNormal: tiled(grain, 0.9), smudge: tiled(smudge, 14), capSmudge: tiled(smudge, 6) },
  };
}

/* ------------------------------------------------------------- metal env */

// What polished metal and glass reflect: bright softbox strips on a mid grey room. The strips
// run top to bottom, so a turned cylinder picks them up as long vertical bands of light.
export function createMetalEnvironment(renderer: THREE.WebGLRenderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const room = ctx.createLinearGradient(0, 0, 0, 1024);
  room.addColorStop(0, "#ffffff");
  room.addColorStop(0.42, "#a9adb8");
  room.addColorStop(0.6, "#6f737e");
  room.addColorStop(1, "#c4c7d0");
  ctx.fillStyle = room;
  ctx.fillRect(0, 0, 2048, 1024);
  for (const [x, w, a] of [[120, 150, 1], [520, 70, 0.9], [860, 220, 1], [1290, 60, 0.85], [1620, 190, 1]]) {
    const strip = ctx.createLinearGradient(x, 0, x + w, 0);
    strip.addColorStop(0, "rgba(255,255,255,0)");
    strip.addColorStop(0.5, `rgba(255,255,255,${a})`);
    strip.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = strip;
    ctx.fillRect(x, 0, w, 1024);
  }
  for (const [x, w] of [[400, 90], [1120, 110], [1480, 70]]) {
    const band = ctx.createLinearGradient(x, 0, x + w, 0);
    band.addColorStop(0, "rgba(40,43,54,0)");
    band.addColorStop(0.5, "rgba(40,43,54,0.75)");
    band.addColorStop(1, "rgba(40,43,54,0)");
    ctx.fillStyle = band;
    ctx.fillRect(x, 0, w, 1024);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

/* ------------------------------------------------------------ studio env */

// A black room with a few softboxes, so the satin caps and the case pick up
// crisp product-shot highlights rather than a grey wash.
export function createStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const box = (w: number, h: number, color: number, intensity: number, pos: [number, number, number], look: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(...look);
    scene.add(m);
  };
  box(7, 3, 0xffffff, 3.2, [0, 8, -3], [0, 0, 0]);
  box(14, 1.6, 0xffffff, 2.2, [0, 6.5, -10], [0, 0, 0]);
  box(14, 0.8, 0xffffff, 0.7, [0, 2.2, -10], [0, 0, 0]);
  box(2.2, 6, 0xdde6ff, 1.4, [-10, 3, 3], [0, 0, 0]);
  box(2.5, 4, 0xa66bff, 1.3, [10, 2, -1], [0, 0, 0]);
  box(10, 1, 0xffffff, 0.6, [0, 1.5, 11], [0, 0, 0]);
  // a dim warm bounce from below, so nothing falls to pure black
  box(40, 40, 0x2a1d14, 0.35, [0, -8, 0], [0, 0, 0]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.02).texture;
  pmrem.dispose();
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return env;
}

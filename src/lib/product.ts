import { CATALOG, type CatalogItem } from "./catalog";

// What the product pages say. Prices, ratings and specs are facts about the products; the
// marketing lines are written for this portfolio concept. Everything is local to this project.

export const STORY_HANDLE = "swarm-white-purple-wireless-gaming-keyboard";
export const productPath = (handle: string) => `/products/${handle}`;
export const findProduct = (handle: string) => CATALOG.find((p) => p.handle === handle);
export const catalogImage = (file: string) => `/catalog/${file}`;
// the same photo at full size (1000–1200px), for where it's shown large: 800px reads soft there on 2x screens
export const catalogLarge = (file: string) => `/catalog/large/${file}`;
export const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const discountOf = (p: CatalogItem) => Math.round((1 - p.price / p.mrp) * 100);

const MODELS = ["Swarm 75", "Swarm65", "Swarm X", "Hive98 V2", "Hive75 V2", "Hive75 HE", "Hive65"];
export const modelOf = (p: CatalogItem) => MODELS.find((m) => p.title.startsWith(m)) ?? p.title;
export const colourOf = (p: CatalogItem) =>
  p.title
    .replace(modelOf(p), "")
    .replace(/(Edition\s+)?(Wireless|Wired).*$/, "")
    .trim();
export const colourways = (p: CatalogItem) => CATALOG.filter((o) => modelOf(o) === modelOf(p));
export const isWireless = (p: CatalogItem) => /wireless/i.test(p.title);

// the Swarm 75 and Swarm X share the long product story; other products show the buy box
export const hasStory = (p: CatalogItem) => ["Swarm 75", "Swarm X"].includes(modelOf(p));

export const REVIEW_COUNT: Record<string, number> = {
  "swarm-white-purple-wireless-gaming-keyboard": 387,
  "swarm-x-all-white-wireless-gaming-keyboard": 66,
};

const SWARM_75_PHOTOS: { src: string; thumb?: string; alt: string }[] = [
  { src: "/product/swarm-75-angle.webp", alt: "Swarm 75 White Purple keyboard, three-quarter view" },
  { src: "/product/swarm-75-front.webp", alt: "Swarm 75 keyboard, front view" },
  { src: "/product/swarm-75-top.webp", alt: "Swarm 75 keyboard, top-down view of the 75% layout" },
  { src: "/product/swarm-75-angle-side.webp", alt: "Swarm 75 keyboard, from the left" },
  { src: "/product/swarm-75-knob.webp", alt: "Close-up of the metal volume knob and purple keycaps" },
  { src: "/product/swarm-75-switch.webp", alt: "A clear-housing purple linear switch" },
  { src: "/product/swarm-75-layers.webp", alt: "Exploded view of the keyboard's layers" },
];
// src is the large photo; thumb, where given, is a lighter file for the thumbnail strip
export const galleryOf = (p: CatalogItem): { src: string; thumb?: string; alt: string }[] =>
  p.handle === STORY_HANDLE ? SWARM_75_PHOTOS : p.images.map((f, i) => ({ src: catalogLarge(f), thumb: catalogImage(f), alt: `${p.title}, photo ${i + 1}` }));

export const chipsOf = (p: CatalogItem) => (hasStory(p) ? ["Wireless", "Metal Volume Knob", "Pre Lubed Switches"] : [isWireless(p) ? "Wireless" : "Wired", "Hot Swappable"]);

export const bulletsOf = (p: CatalogItem): [string, string][] => {
  if (!hasStory(p)) return [];
  const x = modelOf(p) === "Swarm X";
  return [
    ["Compact 75% layout", "82 keys that save desk space and keep everything you use."],
    ["Tri-mode connectivity", "Bluetooth 5.0, 2.4 GHz wireless or wired USB-C."],
    [x ? "Huano linear switches" : "Pre-lubed switches", x ? "Smooth, quiet and quick to actuate." : "Kreo Starling linear or GTMX Sense tactile, smooth from day one."],
    ["5-pin hot-swappable PCB", "Change switches without soldering."],
    ["Gasket-mounted design", "A softer, quieter typing feel."],
  ];
};

export const STATS: [value: string, label: string][] = [
  ["4000mAh", "Battery"],
  ["75%", "Layout"],
  ["1000Hz", "Wireless Polling Rate"],
];

// The lifestyle shots and the exploded view are of the Swarm 75, so the Swarm X shows its own
// colourway's studio photos instead (lavender backdrop, matched by the .studio cards).
const studio = (p: CatalogItem) => modelOf(p) === "Swarm X";

export const bannersTop = (p: CatalogItem) => [
  studio(p)
    ? { img: "meet", photo: catalogLarge(p.images[2]), title: `Meet ${modelOf(p)}`, body: "Great looking on your desk, even better under your fingers.", dark: true }
    : { img: "meet", title: `Meet ${modelOf(p)}`, body: "Great looking on your desk, even better under your fingers.", dark: false },
  { img: "space", title: "There's Space!", body: "A compact 75% layout that leaves your desk clear.", dark: true, right: true },
];

export const filmOf = (p: CatalogItem) =>
  studio(p)
    ? { src: catalogLarge(p.images[3]), alt: `${p.title}, from above`, title: "Soft and quiet", body: "A gasket-mounted design cushions every keystroke, for a softer, quieter feel.", studio: true }
    : { src: "/product/swarm-75-layers.webp", alt: "Exploded view of the keyboard's layers", title: "Built in layers", body: "A gasket-mounted stack with five layers of sound absorption, for a softer, quieter keystroke.", studio: false };
export const BANNERS_BOTTOM = [
  { img: "wireless", title: "Use Wirelessly", body: "Sit however you like, with no cable in the way.", dark: false },
  { img: "platforms", title: "Windows, Mac, Linux, Android", body: "Every setup, covered.", dark: true },
];

export const cardsOf = (p: CatalogItem) => [
  { img: "card-keycaps", title: "Keycaps that don't fade", body: `${modelOf(p) === "Swarm X" ? "Double-shot ABS" : "Double-shot PBT"} legends built to last.` },
  { img: "card-switches", title: "Replace your switches with ease", body: "A 5-pin hot-swappable PCB takes 3-pin and 5-pin switches." },
  { img: "card-knob", title: "Control volume with style", body: "A dedicated metal knob, right at the corner of the board." },
];

export const ICONS: [icon: string, label: string][] = [
  ["layout", "75% Layout"],
  ["knob", "Metal Volume Knob"],
  ["switch", "Hot Swappable Mechanical Switches"],
  ["battery", "270+ Hours battery life"],
  ["software", "Software Support"],
  ["wireless", "BT, 2.4GHz or Wired"],
];

export const specsOf = (p: CatalogItem): [string, [string, string][]][] => {
  const x = modelOf(p) === "Swarm X";
  return [
    ["General Info", [["Product Name", modelOf(p)], ["Product Type", "Mechanical Keyboard"], ["Size / Form Factor", "75%"], ["Dimensions", "331 × 145 × 38.5 mm"], ["Weight", x ? "780 g" : "820 g"]]],
    ["Connectivity", [["Connection Type", "Wired and wireless"], ["Wired Connectivity", "Type C to Type A"], ["Wireless Technology", "BT 5.0, 2.4 GHz"], ["Detachable Cable", "Yes"], ["Cable Length", "1.8 m"]]],
    ["Ergonomics", [["Wrist Rest", "N/A"], ["Adjustable Feet", "Yes, 2 level"], ["Keycap Profile", "Sculpted"]]],
    ["Customization", [["Programmable Keys", "Yes"], ["Macro Support", "Yes, via software"], ["Custom Key Mapping", "Yes, via software"], ["Hot-Swappable Switches", "Yes"], ["Media Keys", "Secondary via FN key"], ["Volume Control", "Metal volume wheel"]]],
    ["Build & Durability", [["Frame Material", "ABS plastic"], ["Key Rollover", "NKRO"], ["Anti-Ghosting", "Yes"], ["Water & Dust Resistant", "N/A"]]],
    ["Software & Compatibility", [["Customization Software", "Yes"], ["Operating Systems", "Windows, macOS, Linux, Android, iOS"], ["Platforms", "PC, console, smartphones"], ["Driverless Mode", "Yes"]]],
    ["In The Box", [["USB-C / USB-A Cable", "Included"], ["Keycap Puller Tool", "Included"], ["Switch Puller Tool", "Included"], ["User Manual", "Included"], ["Additional Switches", "Yes"]]],
    ["Switches & Keycaps", [["Switch Type", "Mechanical"], ["Switch Variant", x ? "Linear" : "Linear or soft tactile"], ["Switch Compatibility", "3 pin, 5 pin"], ["Switch Brand", x ? "Huano" : "Kreo Starling, GTMX Sense"], ["Keycap Material", x ? "ABS" : "PBT"], ["Legends", "Pass through"], ["Keycap Compatibility", "Standard ANSI"]]],
  ];
};

export const FAQ: [q: string, a: string][] = [
  ["What type of switches are used on the Swarm?", "Pre-lubricated switches, so typing feels smooth and consistent from the first day."],
  ["Does it support N-key rollover and anti-ghosting?", "Yes. You get NKRO on 2.4 GHz and wired, and up to 6-key rollover over Bluetooth."],
  ["What's the polling rate in different modes?", "1000 Hz over USB-C and over the 2.4 GHz dongle, and 125 Hz over direct Bluetooth 5.0."],
  ["How many devices can I connect at a time?", "Three. Hold Fn + 1, 2 or 3 to pair, then use the same keys to swap between them."],
  ["How do I factory reset it?", "Hold Fn + Esc for a few seconds. That restores the defaults, including RGB and key mappings."],
  ["Does it have on-board memory?", "Yes. Lighting, key remaps and macros are saved on the keyboard and work on any device."],
];

export const THEMES: { good: string[]; note: string[] } = {
  good: ["Value for money", "Looks great on the desk", "Smooth, comfortable typing", "Easy switching between devices"],
  note: ["A few buyers measured less than 1000 Hz in online polling tests", "Some found the linear switches quieter than they expected"],
};

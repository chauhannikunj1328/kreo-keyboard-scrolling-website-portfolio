import * as THREE from "three";
import { loadTextures, createStudioEnvironment, createMetalEnvironment } from "./textures";
import { createKeyboard } from "./keyboard";
import { createRig } from "./rig";
import { createPost } from "./post";
import { createPreloader } from "./preloader";
import { createScroll, type Scroll } from "./scroll";
import { createLabels } from "./labels";
import { createKeyHover } from "./hover";
import { KEYS, VIBE, ACCEPT_INDEX } from "./layout";
import { SECTIONS, sectionAt, isSection, type SectionName, type UiRefs } from "./ui";

// values the timelines tween; the frame loop reads them
// tilt: how much the keyboard leans toward the cursor (0 in the preloader);
// hoverKeys: keys rise under the cursor (hero only);
// light: a dimmer on the studio lights (the preloader starts inside, in the dark);
// rim: the back light alone (seen low and flat, the keyboard mirrors it);
// rake: the same light swung round low across the logic board (preloader)
export interface Stage {
  desk: number;
  idle: number;
  shadow: number;
  tilt: number;
  hoverKeys: number;
  light: number;
  rim: number;
  rake: number;
  kbPose: { y: number; rx: number; ry: number; rz: number };
  focusOverride: "keyStack" | null;
}

// every face the page uses, loaded (with the textures) before anything is drawn
const FONTS = ['400 1em "Inter"', '500 1em "Inter"', '600 1em "Inter"', '700 1em "Inter"'];

// the white page: the backdrop is bright enough to tone-map to white
const BACKDROP = 3;

export interface Experience {
  goToSection: (name: string) => void;
  dispose: () => void;
}

export async function startExperience({
  canvas,
  ui,
  onSection,
  onProgress,
  ready,
  cancelled,
}: {
  canvas: HTMLCanvasElement;
  ui: UiRefs;
  onSection: (name: SectionName | null) => void;
  // the share of the textures and fonts downloaded so far, 0–1
  onProgress?: (fraction: number) => void;
  // resolves when the loading bar has filled: the intro waits for it
  ready?: () => Promise<void>;
  // the caller gave up while the fonts loaded (React StrictMode's first mount)
  cancelled: AbortSignal;
}): Promise<Experience | null> {
  // a stalled download shouldn't leave the page blank for ever: give up after 20 s
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Loading the 3D keyboard timed out")), 20000));
  let files = [0, 1];
  let fonts = 0;
  const report = () => onProgress?.((files[0] + fonts) / (files[1] + FONTS.length));
  const loading = Promise.all([
    loadTextures((loaded, total) => {
      files = [loaded, total];
      report();
    }),
    ...FONTS.map((f) => document.fonts.load(f).then(() => (fonts++, report()))),
  ]);
  const [textures] = await Promise.race([loading, timeout]);
  if (cancelled.aborted) return null;
  await ready?.();
  if (cancelled.aborted) return null;
  const abort = new AbortController();
  const { signal } = abort;

  history.scrollRestoration = "manual";
  scrollTo(0, 0);

  // DEV stills: ?t=2.1 pins the preloader, ?p=0.35 pins the scroll timeline,
  // both with the clock stopped (for comparing screenshots)
  const params = import.meta.env.DEV ? new URLSearchParams(location.search) : new URLSearchParams();
  const FROZEN = params.has("t") || params.has("p");

  /* ----------------------------------------------------------- renderer */

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    stencil: false,
    depth: false,
    // let dual-GPU Macs stay on the integrated GPU
    powerPreference: "default",
  });
  // resolution: the screen's own density, up to 2x (below that, Retina and phone screens upscale
  // the picture and it reads soft), stepped down to 1x on machines that can't hold the frame
  // rate; see adaptResolution
  const DPR_CAP = Math.min(devicePixelRatio, 2);
  const DPR_FLOOR = Math.min(DPR_CAP, 1);
  let dprScale = 1;
  renderer.setPixelRatio(DPR_CAP);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKDROP, BACKDROP, BACKDROP);
  const env = createStudioEnvironment(renderer);
  scene.environment = env;
  scene.environmentIntensity = 0.9;

  const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.3, 400);

  /* -------------------------------------------------------------- stage */

  const kb = createKeyboard(textures);
  scene.add(kb.root);
  // polished metal and glass get a brighter room of their own to reflect
  const metalEnv = createMetalEnvironment(renderer);
  kb.mats.knob.envMap = metalEnv;
  kb.mats.housing.envMap = metalEnv;

  // matte only: a specular desk sheens grey at grazing angles
  const deskMat = new THREE.MeshLambertMaterial({ color: 0x1c1815 });
  const deskColor = deskMat.color.clone();
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), deskMat);
  desk.receiveShadow = true;
  scene.add(desk);

  const keyLight = new THREE.SpotLight(0xffffff, 3.0, 0, 0.62, 0.6, 0);
  keyLight.position.set(-8, 36, 20);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 15;
  keyLight.shadow.camera.far = 90;
  keyLight.shadow.bias = -0.0002;
  keyLight.shadow.normalBias = 0.02;
  keyLight.shadow.radius = 4;
  scene.add(keyLight, keyLight.target);

  const rim = new THREE.DirectionalLight(0xffffff, 0.9);
  const RIM_HOME = new THREE.Vector3(5, 10, -26);
  const RAKE_DIR = new THREE.Vector3(14, 1.7, 8); // low from the front right
  rim.position.copy(RIM_HOME);
  scene.add(rim);
  // soft white fill, so white caps read white under the black studio room
  const fill = new THREE.HemisphereLight(0xffffff, 0xd8d0ea, 1.0);
  scene.add(fill);

  const stage: Stage = { desk: 0, idle: 0, shadow: 1, tilt: 0, hoverKeys: 0, light: 1, rim: 1, rake: 0, kbPose: { y: 0, rx: 0, ry: 0, rz: 0 }, focusOverride: null };

  // the middle of the vibe row, in the keyboard's own frame, for focus pulls
  const rowFocus = new THREE.Vector3(VIBE.reduce((x, i) => x + KEYS[i].x, 0) / VIBE.length, 2.0, KEYS[VIBE[0]].z);
  const focusTmp = new THREE.Vector3();

  const rig = createRig(signal);
  // a light spring toward the cursor, so the lean overshoots a touch and settles
  const lean = { x: 0, y: 0, vx: 0, vy: 0 };
  function springLean(dt: number) {
    const h = Math.min(dt, 1 / 30);
    lean.vx += ((rig.pointer.x - lean.x) * 38 - lean.vx * 8.5) * h;
    lean.vy += ((rig.pointer.y - lean.y) * 38 - lean.vy * 8.5) * h;
    lean.x += lean.vx * h;
    lean.y += lean.vy * h;
  }

  const post = createPost(renderer, scene, camera);
  // ?lite turns off the heaviest effects (ambient occlusion, shadows, antialiasing, high-res
  // rendering): a quick way to find out which one a particular GPU or browser struggles with
  if (new URLSearchParams(location.search).has("lite")) {
    post.ao.enabled = false;
    renderer.shadowMap.enabled = false;
    post.composer.multisampling = 0;
    dprScale = 0.8 / DPR_CAP;
    renderer.setPixelRatio(DPR_CAP * dprScale);
  }
  const labels = createLabels({ kb, camera, root: ui.labels });
  const hover = createKeyHover({ kb, camera, signal });

  let W = 0;
  let H = 0;
  function resize() {
    W = innerWidth;
    H = innerHeight;
    renderer.setSize(W, H, false);
    post.composer.setSize(W, H, false);
  }
  addEventListener("resize", resize, { signal });
  resize();

  /* ----------------------------------------------------------- sequence */

  let scroll: Scroll | null = null;
  const preloader = createPreloader({ kb, rig, post, stage, ui, onDone: finishPreloader });

  function finishPreloader() {
    if (scroll) return;
    preloader.tl.pause();
    preloader.update();
    document.body.classList.remove("is-locked");
    scroll = createScroll({ kb, rig, post, stage, ui, signal });
  }

  function skipPreloader() {
    if (scroll) return;
    preloader.tl.seek(preloader.end);
    finishPreloader();
  }

  // nav: glide to a section (skipping the preloader if it's still running) and
  // keep the address shareable
  function goToSection(name: string) {
    if (!isSection(name)) return;
    skipPreloader();
    scroll!.goTo(SECTIONS[name]);
    history.replaceState(null, "", name === "overview" ? location.pathname : `#${name}`);
  }
  let activeSection: SectionName | null | undefined;
  function markSection() {
    const name = scroll ? sectionAt(scroll.progress()) : "overview";
    if (name === activeSection) return;
    activeSection = name;
    onSection(name);
  }

  // The page is never locked: scrolling (or swiping, or paging) during the intro is a
  // request to get on with it, and the same gesture carries on scrolling the page.
  const impatient = () => skipPreloader();
  addEventListener("wheel", (e) => e.deltaY > 0 && impatient(), { passive: true, signal });
  addEventListener("touchmove", impatient, { passive: true, signal });
  addEventListener("scroll", () => scrollY > 24 && impatient(), { passive: true, signal });
  addEventListener("keydown", (e) => ["ArrowDown", "PageDown", "End", " ", "Escape"].includes(e.key) && impatient(), { signal });

  // if the intro stalls on a slow machine, get on with the page after a while
  const failsafe = setTimeout(skipPreloader, 9000);

  // Self-healing: if the page has been scrolled but the scene hasn't followed for a couple of
  // seconds (for whatever reason), snap the scene to where the scroll bar says it should be.
  let drift = 0;
  const watchdog = setInterval(() => {
    if (!scroll || scroll.isGliding()) return;
    const want = Math.min(1, Math.max(0, scrollY / scroll.maxScroll()));
    if (Math.abs(want - scroll.progress()) > 0.06) {
      if (++drift >= 4) {
        console.warn("Kreo 3D: the scene fell behind the scroll position; resyncing");
        scroll.pin(want);
        drift = 0;
      }
    } else drift = 0;
  }, 500);

  /* --------------------------------------------------------------- loop */

  let last = performance.now();

  function frame(now = performance.now()) {
    const dt = FROZEN ? 0 : Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    const t = FROZEN ? 0 : now / 1000;

    if (scroll) scroll.update(dt);
    else {
      preloader.advance(dt);
      preloader.update();
    }
    markSection();

    const idle = stage.idle;
    springLean(dt);
    const tilt = stage.tilt;
    kb.root.position.y = stage.kbPose.y + Math.sin(t * 0.9) * 0.16 * idle - lean.y * 0.3 * tilt;
    kb.root.rotation.set(
      stage.kbPose.rx + Math.sin(t * 0.7 + 1) * 0.012 * idle + lean.y * 0.07 * tilt,
      stage.kbPose.ry + Math.sin(t * 0.45) * 0.02 * idle + lean.x * 0.15 * tilt,
      stage.kbPose.rz + Math.sin(t * 0.55) * 0.012 * idle - lean.x * 0.03 * tilt,
    );
    kb.root.updateMatrixWorld();
    hover.update(dt, stage.hoverKeys);
    kb.update();

    deskMat.color.copy(deskColor).multiplyScalar(stage.desk);
    desk.visible = stage.desk > 0.002;
    keyLight.target.position.set(0, kb.root.position.y, 0);
    keyLight.shadow.intensity = stage.shadow;
    keyLight.intensity = 3.0 * stage.light;
    rim.position.lerpVectors(RIM_HOME, RAKE_DIR, stage.rake);
    rim.intensity = THREE.MathUtils.lerp(0.9 * stage.light * stage.rim, 0.9, stage.rake);
    scene.environmentIntensity = 0.9 * (0.25 + 0.75 * stage.light);
    fill.intensity = 1.0 * stage.light;

    rig.apply(camera, W, H, dt);
    // labels project through the camera before the render would update it
    camera.updateMatrixWorld();
    if (stage.focusOverride === "keyStack") kb.keyPart(ACCEPT_INDEX, "switch", post.focusTarget);
    else post.focusTarget.lerpVectors(rig.target, kb.root.localToWorld(focusTmp.copy(rowFocus)), post.fx.focusRow);
    post.apply();

    labels.update(W, H, scroll?.glow);
    kb.renderGlow(renderer, scene);
    post.composer.render(dt);
  }

  renderer.compile(scene, camera);

  // Watch real frame intervals while rendering at full rate: sustained slow
  // frames step the resolution down. It never steps back up: going up and down
  // repeatedly made the picture visibly flash on mid-range GPUs.
  let slowFor = 0;
  function adaptResolution(interval: number) {
    if (interval > 1 / 40) slowFor += interval;
    else slowFor = Math.max(0, slowFor - interval * 0.5);
    let next = dprScale;
    if (slowFor > 1) next = Math.max(DPR_FLOOR / DPR_CAP, dprScale - 0.12);
    if (next !== dprScale) {
      dprScale = next;
      slowFor = 0;
      renderer.setPixelRatio(DPR_CAP * dprScale);
      post.composer.setSize(W, H, false);
    }
  }

  // (idle frames are still drawn every time: skipping draws made the canvas blink black)
  let lastInput = performance.now();
  for (const type of ["pointermove", "pointerdown", "wheel", "scroll", "keydown", "touchstart"]) {
    addEventListener(type, () => (lastInput = performance.now()), { passive: true, signal });
  }
  let lastLoop = 0;
  function loop(now: number) {
    // the product page covers the whole canvas once the story is over: no need to draw it
    if (!FROZEN && scroll && scrollY >= ui.story.offsetHeight) return;
    const resting = scroll !== null && scroll.isSettled() && now - lastInput > 1500;
    // (not during the preloader: reallocating the buffers would hitch the flight)
    if (!resting && lastLoop && scroll && !FROZEN) adaptResolution((now - lastLoop) / 1000);
    lastLoop = resting ? 0 : now;
    try {
      frame(now);
    } catch (err) {
      // report it once, keep the loop alive (the next frame may well succeed), and
      // meanwhile still draw the plain scene so the page never freezes on a stale image
      if (!frameFailed) console.error("Kreo 3D: a frame failed to render", err);
      frameFailed = true;
      try {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
      } catch {
        /* nothing more to try this frame */
      }
    }
  }
  let frameFailed = false;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setAnimationLoop(loop);

  const hash = location.hash.slice(1);
  if (params.has("t")) {
    preloader.tl.seek(Number(params.get("t")));
  } else if (params.has("p")) {
    skipPreloader();
    scroll!.pin(Number(params.get("p")));
  } else if (isSection(hash) && hash !== "overview") {
    // arriving on a section link: skip the preloader and land there
    skipPreloader();
    const p = SECTIONS[hash];
    scrollTo({ top: p * (ui.story.offsetHeight - innerHeight), behavior: "instant" });
    scroll!.pin(p);
  } else if (reduced) skipPreloader();
  else preloader.play();

  return {
    goToSection,
    dispose() {
      clearTimeout(failsafe);
      clearInterval(watchdog);
      abort.abort();
      renderer.setAnimationLoop(null);
      preloader.tl.kill();
      (scroll as Scroll | null)?.dispose();
      post.composer.dispose();
      kb.dispose();
      env.dispose();
      metalEnv.dispose();
      deskMat.dispose();
      desk.geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

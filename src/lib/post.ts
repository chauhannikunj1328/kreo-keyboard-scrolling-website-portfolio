import * as THREE from "three";
import {
  Effect,
  EffectAttribute,
  EffectComposer,
  RenderPass,
  EffectPass,
  DepthOfFieldEffect,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from "postprocessing";
import { N8AOPostPass } from "n8ao";

// Camera motion blur: each pixel is reprojected with last frame's camera to
// find how far it moved on screen, and the image is smeared along that path
// (a 180° shutter at `amount` 0.5). Only the camera's motion; skipped on
// jumps (a seek, the first frame).
class MotionBlurEffect extends Effect {
  constructor() {
    super(
      "MotionBlurEffect",
      `
uniform mat4 uReproject;
uniform float uAmount;
void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  vec4 prev = uReproject * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  vec2 vel = (uv - (prev.xy / max(prev.w, 1e-5)) * 0.5 - 0.5) * uAmount;
  float len = length(vel);
  vel *= len > 0.25 ? 0.0 : min(1.0, 0.035 / max(len, 1e-5));
  vec4 acc = inputColor;
  for (int i = 1; i < 10; i++) acc += texture2D(inputBuffer, uv + vel * (float(i) / 9.0 - 0.5));
  outputColor = acc / 10.0;
}`,
      {
        attributes: EffectAttribute.DEPTH | EffectAttribute.CONVOLUTION,
        uniforms: new Map<string, THREE.Uniform>([
          ["uReproject", new THREE.Uniform(new THREE.Matrix4())],
          ["uAmount", new THREE.Uniform(0)],
        ]),
      },
    );
  }
}

// One stray overflowing pixel (a glint off the glass switches) is enough for
// the bloom blur to spread NaN over the whole frame, which shows as a black
// flash. This runs before the tone mapping: NaN becomes black, and everything is
// capped well above anything the scene should show.
class GuardEffect extends Effect {
  constructor() {
    super(
      "GuardEffect",
      `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb;
  if (!(c.r == c.r)) c.r = 0.0;
  if (!(c.g == c.g)) c.g = 0.0;
  if (!(c.b == c.b)) c.b = 0.0;
  outputColor = vec4(clamp(c, vec3(0.0), vec3(12.0)), clamp(inputColor.a, 0.0, 1.0));
}`,
    );
  }
}

// (Bloom is deliberately not here: its mipmap blur drew black frames on about
// one frame in six, which showed as blinking. The scene doesn't need it.)
//
// the tweenable look; applied every frame. focusRow pulls focus from the
// camera's target toward the vibe row (0–1); motionBlur is the shutter.
export interface Look {
  bokeh: number;
  focusRange: number;
  bloom: number;
  exposure: number;
  focusRow: number;
  motionBlur: number;
}

export type Post = ReturnType<typeof createPost>;

// Ambient occlusion on the raw render, then shallow focus (its bokeh then
// blooms), camera motion blur, bloom, tone mapping and a little vignette
// (no film grain: it shimmers on every frame). Tuned for GPU budget: 2x MSAA, low-quality half-res AO, half-res
// focus and motion blur that switch off when they'd be invisible.
export function createPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, { samples = 2 } = {}) {
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
    multisampling: Math.min(samples, renderer.capabilities.maxSamples),
  });
  composer.addPass(new RenderPass(scene, camera));

  // contact shadows: caps in their wells, the wells in the frame
  const ao = new N8AOPostPass(scene, camera, 1, 1);
  ao.configuration.aoRadius = 0.45;
  ao.configuration.distanceFalloff = 1;
  ao.configuration.intensity = 1.3;
  ao.configuration.halfRes = true;
  ao.configuration.gammaCorrection = false;
  ao.setQualityMode("Low");
  composer.addPass(ao);

  const dof = new DepthOfFieldEffect(camera, {
    focusDistance: 10,
    focusRange: 3,
    bokehScale: 4,
    resolutionScale: 0.5,
  });
  const focusTarget = new THREE.Vector3();
  dof.target = focusTarget;

  const tone = new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL });
  const vignette = new VignetteEffect({ offset: 0.32, darkness: 0.1 });

  const focusPass = new EffectPass(camera, dof);
  composer.addPass(focusPass);
  const blur = new MotionBlurEffect();
  const blurPass = new EffectPass(camera, blur);
  composer.addPass(blurPass);
  composer.addPass(new EffectPass(camera, new GuardEffect()));
  composer.addPass(new EffectPass(camera, tone, vignette));

  const fx: Look = { bokeh: 4, focusRange: 3, bloom: 1.1, exposure: 1, focusRow: 0, motionBlur: 0 };

  const vp = new THREE.Matrix4();
  const prevVP = new THREE.Matrix4();
  const reproject = blur.uniforms.get("uReproject")!;
  const amount = blur.uniforms.get("uAmount")!;
  let hasPrev = false;
  function apply() {
    // below ~0.6 the bokeh is imperceptible: skip the whole focus chain
    focusPass.enabled = fx.bokeh > 0.6;
    // reprojection: this frame's clip space back to last frame's
    vp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    blurPass.enabled = fx.motionBlur > 0.01 && hasPrev;
    (reproject.value as THREE.Matrix4).copy(vp).invert().premultiply(prevVP);
    amount.value = fx.motionBlur * 0.5;
    prevVP.copy(vp);
    hasPrev = true;
    dof.bokehScale = fx.bokeh;
    dof.cocMaterial.focusRange = fx.focusRange;
    renderer.toneMappingExposure = fx.exposure;
  }

  return { composer, focusTarget, ao, fx, apply };
}

import type { StoryScene } from "./StorySchema";

export type CameraState = { x: number; y: number; zoom: number };

const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export const resolveCamera = (
  scene: Pick<StoryScene, "camera" | "cameraMotion">,
  frame: number,
  fps: number,
): CameraState => {
  let state: CameraState = {
    x: scene.camera?.x ?? 0.5,
    y: scene.camera?.y ?? 0.5,
    zoom: scene.camera?.zoom ?? 1,
  };
  let previousFrame = 0;

  for (const keyframe of scene.cameraMotion ?? []) {
    const keyframeFrame = Math.round(keyframe.timeSeconds * fps);
    const target = { x: keyframe.x, y: keyframe.y, zoom: keyframe.zoom };
    if (frame < keyframeFrame) {
      if (keyframe.ease === "cut") {
        return state;
      }
      const progress = ease((frame - previousFrame) / Math.max(1, keyframeFrame - previousFrame));
      return {
        x: state.x + (target.x - state.x) * progress,
        y: state.y + (target.y - state.y) * progress,
        zoom: state.zoom + (target.zoom - state.zoom) * progress,
      };
    }
    state = target;
    previousFrame = keyframeFrame;
  }

  return state;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// Centers the focus point while keeping the zoomed frame inside the scene.
// Scenes with a static camera and no cameraMotion keep the original origin-based zoom.
export const getCameraTransform = (camera: CameraState, width: number, height: number, legacy = false) => {
  if (legacy) {
    return { tx: camera.x * width * (1 - camera.zoom), ty: camera.y * height * (1 - camera.zoom), zoom: camera.zoom };
  }
  const tx = clamp(width / 2 - camera.x * width * camera.zoom, width - width * camera.zoom, 0);
  const ty = clamp(height / 2 - camera.y * height * camera.zoom, height - height * camera.zoom, 0);
  return { tx, ty, zoom: camera.zoom };
};

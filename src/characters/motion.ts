import { getCharacterPose, type CharacterPose } from "./animations";
import type { StoryCharacter } from "../story/StorySchema";

const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

const blendPose = (from: CharacterPose, to: CharacterPose, amount: number): CharacterPose => ({
  leftArm: from.leftArm + (to.leftArm - from.leftArm) * amount,
  rightArm: from.rightArm + (to.rightArm - from.rightArm) * amount,
  leftLeg: from.leftLeg + (to.leftLeg - from.leftLeg) * amount,
  rightLeg: from.rightLeg + (to.rightLeg - from.rightLeg) * amount,
  leftKnee: from.leftKnee + (to.leftKnee - from.leftKnee) * amount,
  rightKnee: from.rightKnee + (to.rightKnee - from.rightKnee) * amount,
  bodyRotation: from.bodyRotation + (to.bodyRotation - from.bodyRotation) * amount,
  headRotation: from.headRotation + (to.headRotation - from.headRotation) * amount,
  verticalOffset: from.verticalOffset + (to.verticalOffset - from.verticalOffset) * amount,
});

export const resolveCharacterMotion = (character: StoryCharacter, frame: number, fps: number) => {
  const keyframes = character.motion ?? [];
  let x = character.x;
  let y = character.y;
  let previousFrame = 0;
  let action = character.action;
  let pose = getCharacterPose(action, frame, fps);
  let direction = 0;

  for (const keyframe of keyframes) {
    const keyframeFrame = Math.round(keyframe.timeSeconds * fps);
    if (frame < keyframeFrame) {
      const progress = ease((frame - previousFrame) / (keyframeFrame - previousFrame));
      direction = Math.sign(keyframe.x - x);
      x += (keyframe.x - x) * progress;
      y += (keyframe.y - y) * progress;
      break;
    }

    x = keyframe.x;
    y = keyframe.y;
    if (action !== keyframe.action) {
      action = keyframe.action;
      const incoming = getCharacterPose(action, frame - keyframeFrame, fps);
      pose = blendPose(pose, incoming, ease((frame - keyframeFrame) / Math.max(1, fps * 0.3)));
    }
    previousFrame = keyframeFrame;
  }

  return { character: { ...character, x, y, action }, pose, direction };
};

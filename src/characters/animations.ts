import type { StoryCharacter } from "../story/StorySchema";

export type CharacterPose = {
  leftArm: number;
  rightArm: number;
  leftLeg: number;
  rightLeg: number;
  leftKnee: number;
  rightKnee: number;
  bodyRotation: number;
  headRotation: number;
  verticalOffset: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getCharacterPose = (
  action: StoryCharacter["action"],
  frame: number,
  fps: number,
): CharacterPose => {
  const slow = Math.sin((frame * Math.PI * 2) / Math.max(1, fps * 2));
  const walk = Math.sin((frame * Math.PI * 2) / Math.max(1, fps * 0.8));
  const run = Math.sin((frame * Math.PI * 2) / Math.max(1, fps * 0.38));
  const pose: CharacterPose = {
    leftArm: -12,
    rightArm: 12,
    leftLeg: 0,
    rightLeg: 0,
    leftKnee: 0,
    rightKnee: 0,
    bodyRotation: 0,
    headRotation: 0,
    verticalOffset: 0,
  };

  switch (action) {
    case "walking":
      pose.leftArm = -12 + walk * 28;
      pose.rightArm = 12 - walk * 28;
      pose.leftLeg = walk * 24;
      pose.rightLeg = -walk * 24;
      pose.leftKnee = Math.max(0, -walk) * 28;
      pose.rightKnee = Math.max(0, walk) * 28;
      pose.verticalOffset = -Math.abs(Math.cos((frame * Math.PI * 2) / Math.max(1, fps * 0.8))) * 4;
      break;
    case "running":
      pose.leftArm = -18 + run * 48;
      pose.rightArm = 18 - run * 48;
      pose.leftLeg = run * 42;
      pose.rightLeg = -run * 42;
      pose.leftKnee = Math.max(0, -run) * 52;
      pose.rightKnee = Math.max(0, run) * 52;
      pose.bodyRotation = -12;
      pose.verticalOffset = -Math.abs(Math.cos((frame * Math.PI * 2) / Math.max(1, fps * 0.38))) * 13;
      break;
    case "jumping": {
      const progress = (frame % Math.max(1, fps * 1.2)) / Math.max(1, fps * 1.2);
      pose.verticalOffset = -150 * 4 * progress * (1 - progress);
      pose.leftArm = -145;
      pose.rightArm = 145;
      pose.leftLeg = 18;
      pose.rightLeg = -18;
      break;
    }
    case "falling":
      pose.bodyRotation = 78;
      pose.leftArm = -120;
      pose.rightArm = 120;
      pose.leftLeg = 30;
      pose.rightLeg = -20;
      pose.verticalOffset = clamp(frame * 2, 0, 90);
      break;
    case "sitting":
      pose.leftArm = -30;
      pose.rightArm = 30;
      pose.leftLeg = 72;
      pose.rightLeg = 72;
      pose.leftKnee = -112;
      pose.rightKnee = -112;
      pose.bodyRotation = 8;
      break;
    case "standing-up": {
      const progress = clamp(frame / Math.max(1, fps * 0.8), 0, 1);
      pose.leftLeg = 72 * (1 - progress);
      pose.rightLeg = 72 * (1 - progress);
      pose.leftKnee = -112 * (1 - progress);
      pose.rightKnee = -112 * (1 - progress);
      pose.bodyRotation = 8 * (1 - progress);
      pose.leftArm = -30 + progress * 18;
      pose.rightArm = 30 - progress * 18;
      break;
    }
    case "waving":
      pose.rightArm = -155 + Math.sin((frame * Math.PI * 2) / Math.max(1, fps * 0.45)) * 18;
      pose.leftArm = -8;
      break;
    case "talking":
      pose.leftArm = -18 + slow * 14;
      pose.rightArm = 18 - slow * 14;
      break;
    case "thinking":
      pose.rightArm = -115;
      pose.leftArm = -5;
      pose.headRotation = slow * 4;
      break;
    case "pointing":
      pose.rightArm = -75;
      pose.leftArm = -10;
      break;
    case "celebrating":
      pose.leftArm = -155 + slow * 8;
      pose.rightArm = 155 - slow * 8;
      pose.leftLeg = -18;
      pose.rightLeg = 18;
      pose.verticalOffset = -Math.abs(slow) * 14;
      break;
    case "looking-around":
      pose.headRotation = Math.sin((frame * Math.PI * 2) / Math.max(1, fps * 1.5)) * 20;
      break;
    case "shaking-head":
      pose.headRotation = Math.sin((frame * Math.PI * 2) / Math.max(1, fps * 0.55)) * 24;
      break;
    case "surprised":
      pose.leftArm = -110;
      pose.rightArm = 110;
      pose.verticalOffset = -Math.max(0, Math.sin((frame * Math.PI) / Math.max(1, fps * 0.5))) * 18;
      break;
    case "sleeping":
      pose.leftArm = -40;
      pose.rightArm = 42;
      pose.bodyRotation = 90;
      pose.verticalOffset = slow * 2;
      break;
    case "stretching":
      pose.leftArm = -155 + Math.sin((frame * Math.PI) / Math.max(1, fps * 1.5)) * 12;
      pose.rightArm = 155 - Math.sin((frame * Math.PI) / Math.max(1, fps * 1.5)) * 12;
      pose.bodyRotation = -5;
      break;
    case "idle":
      pose.leftArm = -12 + slow * 2;
      pose.rightArm = 12 - slow * 2;
      pose.verticalOffset = slow * 2;
      break;
  }

  return pose;
};

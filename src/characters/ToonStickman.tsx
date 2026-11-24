import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { CharacterPose } from "./animations";
import type { StoryCharacter } from "../story/StorySchema";

type Props = {
  character: StoryCharacter;
  pose: CharacterPose;
  direction?: number;
};

const browPaths: Record<StoryCharacter["expression"], [string, string]> = {
  neutral: ["M -38 -330 L -10 -322", "M 10 -322 L 38 -330"],
  angry: ["M -38 -334 L -9 -318", "M 9 -318 L 38 -334"],
  happy: ["M -38 -326 Q -24 -340 -8 -330", "M 8 -330 Q 24 -340 38 -326"],
  laughing: ["M -38 -326 Q -24 -340 -8 -330", "M 8 -330 Q 24 -340 38 -326"],
  sad: ["M -38 -320 L -10 -332", "M 10 -332 L 38 -320"],
  crying: ["M -38 -320 L -10 -332", "M 10 -332 L 38 -320"],
  scared: ["M -38 -326 Q -24 -342 -10 -336", "M 10 -336 Q 24 -342 38 -326"],
  surprised: ["M -38 -334 Q -24 -348 -10 -340", "M 10 -340 Q 24 -348 38 -334"],
  confused: ["M -38 -324 L -10 -324", "M 10 -336 Q 24 -344 38 -332"],
  thinking: ["M -38 -324 L -10 -326", "M 10 -334 Q 24 -342 38 -330"],
};

const Glove: React.FC<{ x: number; y: number; side: -1 | 1; color: string }> = ({ x, y, side, color }) => (
  <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth="5" fill="white">
    <ellipse cx={side * 8} cy="-6" rx="7" ry="10" transform={`rotate(${side * 35} ${side * 8} -6)`} />
    <path d="M -15 -6 Q -17 18 0 20 Q 17 18 15 -6 Q 12 -16 0 -16 Q -12 -16 -15 -6 Z" />
    <path d="M -6 6 V 15 M 2 7 V 16" fill="none" strokeWidth="3" />
  </g>
);

const Sneaker: React.FC<{ side: -1 | 1; facing: number; color: string }> = ({ side, facing, color }) => {
  const toe = facing === 0 ? side * 6 : facing * 12;
  return (
    <g transform={`translate(${toe} 52)`} stroke={color} strokeWidth="5">
      <path d="M -22 4 Q -24 -14 -6 -15 Q 14 -16 22 -2 Q 26 10 12 12 H -14 Q -22 12 -22 4 Z" fill="white" />
      <path d="M -20 6 H 22" fill="none" strokeWidth="3" />
    </g>
  );
};

const capDirection = (direction: number) => (direction < 0 ? -1 : 1);
const facingCapSide = (direction: number) => 20 * capDirection(direction);

export const ToonStickman: React.FC<Props> = ({ character, pose, direction = 0 }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const scale = character.scale * height / 1920;
  const color = character.lineColor;
  const facing = character.action === "walking" || character.action === "running" ? direction : 0;
  const look = facing * 6;
  const expression = character.expression;
  const [leftBrow, rightBrow] = browPaths[expression];
  const talking = character.action === "talking";
  const lift = Math.max(0, -pose.verticalOffset);
  const shadowScale = Math.max(0.45, 1 - lift / 260);

  let mouth: React.ReactNode;
  if (talking) {
    mouth = <ellipse cx={look} cy="-268" rx="12" ry={3 + Math.abs(Math.sin(frame / 3.2)) * 8} fill={color} />;
  } else if (expression === "happy" || expression === "laughing") {
    mouth = <path d={`M ${-24 + look} -280 Q ${look} -246 ${24 + look} -280 Z`} fill={color} stroke={color} strokeWidth="4" strokeLinejoin="round" />;
  } else if (expression === "surprised" || expression === "scared") {
    mouth = <ellipse cx={look} cy="-266" rx="9" ry="12" fill={color} />;
  } else if (["sad", "crying"].includes(expression)) {
    mouth = <path d={`M ${-16 + look} -262 Q ${look} -278 ${16 + look} -262`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />;
  } else if (expression === "angry") {
    mouth = <path d={`M ${-15 + look} -268 L ${15 + look} -271`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />;
  } else if (expression === "thinking" || expression === "confused") {
    mouth = <path d={`M ${-12 + look} -268 Q ${4 + look} -273 ${16 + look} -264`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />;
  } else {
    mouth = <path d={`M ${-20 + look} -274 Q ${look} -258 ${20 + look} -275`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />;
  }

  return (
    <svg
      viewBox="-150 -420 300 440"
      width={300 * scale}
      height={440 * scale}
      style={{
        position: "absolute",
        left: character.x * width - 150 * scale,
        top: character.y * height - 420 * scale,
        overflow: "visible",
      }}
      aria-label={`Toon stickman ${character.action} with ${expression} expression`}
    >
      <ellipse cx="0" cy="6" rx={68 * shadowScale} ry={12 * shadowScale} fill="rgba(0,0,0,0.2)" />
      <g transform={`translate(0 ${pose.verticalOffset}) rotate(${character.rotation + pose.bodyRotation} 0 -170)`}>
        <g fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 0 -242 L 0 -118" />
          <g transform={`translate(-4 -226) rotate(${pose.leftArm})`}>
            <path d="M 0 0 L -9 50 L -15 96" />
            <Glove x={-15} y={104} side={1} color={color} />
          </g>
          <g transform={`translate(4 -226) rotate(${pose.rightArm})`}>
            <path d="M 0 0 L 9 50 L 15 96" />
            <Glove x={15} y={104} side={-1} color={color} />
          </g>
          <g transform={`translate(-5 -118) rotate(${pose.leftLeg})`}>
            <path d="M 0 0 L -2 56" />
            <g transform={`translate(-2 56) rotate(${pose.leftKnee})`}>
              <path d="M 0 0 L -1 44" />
              <Sneaker side={-1} facing={facing} color={color} />
            </g>
          </g>
          <g transform={`translate(5 -118) rotate(${pose.rightLeg})`}>
            <path d="M 0 0 L 2 56" />
            <g transform={`translate(2 56) rotate(${pose.rightKnee})`}>
              <path d="M 0 0 L 1 44" />
              <Sneaker side={1} facing={facing} color={color} />
            </g>
          </g>
        </g>
        <g transform={`rotate(${pose.headRotation} 0 -300)`}>
          {character.accessory !== "cap" && (
            <g fill={color}>
              <path d="M -16 -356 Q -14 -386 0 -396 Q -6 -376 -2 -358 Z" />
              <path d="M -2 -360 Q 10 -394 30 -398 Q 16 -380 14 -358 Z" />
              <path d="M 12 -356 Q 30 -382 50 -380 Q 34 -370 28 -350 Z" />
            </g>
          )}
          <circle cx="0" cy="-300" r="60" fill="white" stroke={color} strokeWidth="7" />
          {character.accessory === "cap" && (
            <g stroke={color} strokeWidth="6" strokeLinejoin="round">
              <path d="M -58 -318 Q -56 -372 0 -374 Q 56 -372 58 -318 Z" fill="#4f7fc0" />
              <path d={`M ${facingCapSide(direction)} -320 H ${facingCapSide(direction) + 70 * capDirection(direction)}`} strokeWidth="14" strokeLinecap="round" stroke="#3d6aa6" />
            </g>
          )}
          {character.accessory === "bow" && (
            <g fill="#e0567a" stroke={color} strokeWidth="4">
              <path d="M 30 -352 L 58 -372 L 58 -336 Z" />
              <path d="M 30 -352 L 6 -378 L 4 -340 Z" />
              <circle cx="30" cy="-354" r="8" />
            </g>
          )}
          <g fill="none" stroke={color} strokeWidth="6" strokeLinecap="round">
            <path d={leftBrow} transform={`translate(${look} 0)`} />
            <path d={rightBrow} transform={`translate(${look} 0)`} />
          </g>
          {expression === "laughing" ? (
            <g fill="none" stroke={color} strokeWidth="5" strokeLinecap="round">
              <path d={`M ${-28 + look} -300 Q ${-20 + look} -310 ${-12 + look} -300`} />
              <path d={`M ${12 + look} -300 Q ${20 + look} -310 ${28 + look} -300`} />
            </g>
          ) : (
            <g>
              <ellipse cx={-20 + look} cy="-302" rx="8" ry="12" fill={color} />
              <ellipse cx={20 + look} cy="-302" rx="8" ry="12" fill={color} />
              <circle cx={-17 + look} cy="-307" r="3" fill="white" />
              <circle cx={23 + look} cy="-307" r="3" fill="white" />
            </g>
          )}
          {expression === "crying" && (
            <path d={`M ${-22 + look} -290 Q ${-27 + look} -276 ${-22 + look} -270 Q ${-17 + look} -276 ${-22 + look} -290`} fill="#7cc3ef" />
          )}
          {mouth}
        </g>
      </g>
    </svg>
  );
};

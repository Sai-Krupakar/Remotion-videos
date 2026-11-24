import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { getCharacterPose, type CharacterPose } from "./animations";
import type { StoryCharacter } from "../story/StorySchema";

type StickmanProps = {
  character: StoryCharacter;
  pose?: CharacterPose;
};

export const Stickman: React.FC<StickmanProps> = ({ character, pose: suppliedPose }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const pose = suppliedPose ?? getCharacterPose(character.action, frame, fps);
  const displayScale = character.scale * (height / 1920);
  const isSleeping = character.action === "sleeping";
  const viewWidth = isSleeping ? 500 : 240;
  const strokeWidth = 9;
  const stroke = character.lineColor;
  const eyeY = -303;
  const isClosedEyes = isSleeping;
  const isSurprised = character.expression === "surprised";
  const isLaughing =
    character.expression === "laughing" || character.action === "talking";
  const isCrying = character.expression === "crying";

  const mouthPath = (() => {
    switch (character.expression) {
      case "happy":
      case "laughing":
        return "M -15 -278 Q 0 -258 15 -278";
      case "sad":
      case "crying":
      case "scared":
        return "M -14 -268 Q 0 -284 14 -268";
      case "angry":
        return "M -13 -272 L 0 -278 L 13 -272";
      case "confused":
        return "M -10 -271 Q 0 -278 12 -270";
      case "thinking":
        return "M -8 -271 Q 0 -277 8 -271";
      case "surprised":
        return "";
      default:
        return "M -12 -274 Q 0 -270 12 -274";
    }
  })();

  return (
    <svg
      viewBox={isSleeping ? "-250 -420 500 420" : "-120 -420 240 420"}
      width={viewWidth * displayScale}
      height={420 * displayScale}
      style={{
        position: "absolute",
        left: character.x * useVideoConfig().width - (viewWidth / 2) * displayScale,
        top:
          character.y * height -
          (isSleeping ? 210 : 420) * displayScale,
        overflow: "visible",
      }}
      aria-label={`Stickman ${character.action} with ${character.expression} expression`}
    >
      <g
        transform={`translate(0 ${pose.verticalOffset}) rotate(${character.rotation + pose.bodyRotation} 0 -170)`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 0 -245 L 0 -102" />
        <g transform={`translate(-22 -231) rotate(${pose.leftArm})`}>
          <path d="M 0 0 L 0 56 L -12 108" />
          <circle cx="0" cy="56" r="5" fill={stroke} stroke="none" />
        </g>
        <g transform={`translate(22 -231) rotate(${pose.rightArm})`}>
          <path d="M 0 0 L 0 56 L 12 108" />
          <circle cx="0" cy="56" r="5" fill={stroke} stroke="none" />
        </g>
        <g transform={`translate(-10 -102) rotate(${pose.leftLeg})`}>
          <path d="M 0 0 L 0 70" />
          <circle cx="0" cy="70" r="5" fill={stroke} stroke="none" />
          <g transform={`translate(0 70) rotate(${pose.leftKnee})`}>
            <path d="M 0 0 L 0 65 M 0 65 L -18 65" />
          </g>
        </g>
        <g transform={`translate(10 -102) rotate(${pose.rightLeg})`}>
          <path d="M 0 0 L 0 70" />
          <circle cx="0" cy="70" r="5" fill={stroke} stroke="none" />
          <g transform={`translate(0 70) rotate(${pose.rightKnee})`}>
            <path d="M 0 0 L 0 65 M 0 65 L 18 65" />
          </g>
        </g>
        <g transform={`rotate(${pose.headRotation} 0 -290)`}>
          <circle
            cx="0"
            cy="-290"
            r="46"
            fill={character.headColor}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {isClosedEyes ? (
            <>
              <path d={`M -22 ${eyeY} Q -14 ${eyeY - 5} -6 ${eyeY}`} />
              <path d={`M 6 ${eyeY} Q 14 ${eyeY - 5} 22 ${eyeY}`} />
            </>
          ) : (
            <>
              <ellipse cx="-15" cy={eyeY} rx="4" ry="6" fill={stroke} stroke="none" />
              <ellipse cx="15" cy={eyeY} rx="4" ry="6" fill={stroke} stroke="none" />
            </>
          )}
          {character.expression === "angry" && (
            <>
              <path d="M -24 -316 L -7 -310" />
              <path d="M 7 -310 L 24 -316" />
            </>
          )}
          {character.expression === "sad" && (
            <>
              <path d="M -24 -310 L -8 -316" />
              <path d="M 8 -316 L 24 -310" />
            </>
          )}
          {isSurprised ? (
            <ellipse cx="0" cy="-272" rx="8" ry="12" fill="#6d4545" stroke="none" />
          ) : isLaughing ? (
            <path d="M -14 -276 Q 0 -254 14 -276 Z" fill="#6d4545" />
          ) : (
            <path d={mouthPath} stroke={stroke} />
          )}
          {isCrying && (
            <>
              <path d="M -15 -297 Q -19 -283 -15 -277" stroke="#4aa7e8" strokeWidth="5" />
              <path d="M 15 -297 Q 19 -283 15 -277" stroke="#4aa7e8" strokeWidth="5" />
            </>
          )}
          {character.expression === "thinking" && (
            <circle cx="46" cy="-347" r="5" fill={stroke} stroke="none" />
          )}
        </g>
      </g>
    </svg>
  );
};

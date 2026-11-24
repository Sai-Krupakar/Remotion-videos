import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { getCharacterPose, type CharacterPose } from "./animations";
import type { StoryCharacter } from "../story/StorySchema";

type StickmanNW052Props = {
  character: StoryCharacter;
  pose?: CharacterPose;
};

export const StickmanNW052: React.FC<StickmanNW052Props> = ({ character, pose: suppliedPose }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pose = suppliedPose ?? getCharacterPose(character.action, frame, fps);
  const displayScale = character.scale * (height / 1920);
  const strokeWidth = 14;
  const stroke = character.lineColor;
  const jointRadius = 18 * displayScale;
  const isSleeping = character.action === "sleeping";
  const isSurprised = character.expression === "surprised";
  const isLaughing =
    character.expression === "laughing" || character.action === "talking";
  const isCrying = character.expression === "crying";

  const mouthPath = (() => {
    switch (character.expression) {
      case "happy":
      case "laughing":
        return "M -18 -268 Q 0 -248 18 -268";
      case "sad":
      case "crying":
      case "scared":
        return "M -18 -258 Q 0 -274 18 -258";
      case "angry":
        return "M -16 -262 L 0 -268 L 16 -262";
      case "confused":
        return "M -12 -261 Q 0 -268 14 -260";
      case "thinking":
        return "M -10 -261 Q 0 -267 10 -261";
      case "surprised":
        return "";
      default:
        return "M -14 -264 Q 0 -260 14 -264";
    }
  })();

  return (
    <svg
      viewBox={isSleeping ? "-250 -420 500 420" : "-140 -420 280 420"}
      width={isSleeping ? 500 * displayScale : 280 * displayScale}
      height={420 * displayScale}
      style={{
        position: "absolute",
        left:
          character.x * width -
          (isSleeping ? 250 : 140) * displayScale,
        top:
          character.y * height -
          (isSleeping ? 210 : 420) * displayScale,
        overflow: "visible",
      }}
      aria-label={`Character ${character.action} with ${character.expression} expression`}
    >
      <g
        transform={`translate(0 ${pose.verticalOffset}) rotate(${character.rotation + pose.bodyRotation} 0 -170)`}
        fill={stroke}
        stroke="none"
      >
        <line x1="0" y1="-245" x2="0" y2="-102" strokeWidth={strokeWidth} stroke={stroke} strokeLinecap="round" />
        <g transform={`translate(-22 -231) rotate(${pose.leftArm})`}>
          <line x1="0" y1="0" x2="0" y2="56" strokeWidth={strokeWidth} stroke={stroke} strokeLinecap="round" />
          <line x1="0" y1="56" x2="-12" y2="108" strokeWidth={strokeWidth} stroke={stroke} strokeLinecap="round" />
          <circle cx="0" cy="56" r={jointRadius} fill={stroke} />
          <circle cx="-12" cy="108" r={jointRadius * 0.8} fill={stroke} />
        </g>
        <g transform={`translate(22 -231) rotate(${pose.rightArm})`}>
          <line x1="0" y1="0" x2="0" y2="56" strokeWidth={strokeWidth} stroke={stroke} strokeLinecap="round" />
          <line x1="0" y1="56" x2="12" y2="108" strokeWidth={strokeWidth} stroke={stroke} strokeLinecap="round" />
          <circle cx="0" cy="56" r={jointRadius} fill={stroke} />
          <circle cx="12" cy="108" r={jointRadius * 0.8} fill={stroke} />
        </g>
        <circle cx="-22" cy="-231" r={jointRadius} fill={stroke} />
        <circle cx="22" cy="-231" r={jointRadius} fill={stroke} />
        <g transform={`translate(-10 -102) rotate(${pose.leftLeg})`}>
          <line x1="0" y1="0" x2="0" y2="70" strokeWidth={strokeWidth} stroke={stroke} strokeLinecap="round" />
          <circle cx="0" cy="70" r={jointRadius} fill={stroke} />
          <g transform={`translate(0 70) rotate(${pose.leftKnee})`}>
            <line x1="0" y1="0" x2="0" y2="65" strokeWidth={strokeWidth} stroke={stroke} strokeLinecap="round" />
            <circle cx="0" cy="65" r={jointRadius * 0.85} fill={stroke} />
            <line x1="0" y1="65" x2="-18" y2="65" strokeWidth={strokeWidth} stroke={stroke} strokeLinecap="round" />
          </g>
        </g>
        <g transform={`translate(10 -102) rotate(${pose.rightLeg})`}>
          <line x1="0" y1="0" x2="0" y2="70" strokeWidth={strokeWidth} stroke={stroke} strokeLinecap="round" />
          <circle cx="0" cy="70" r={jointRadius} fill={stroke} />
          <g transform={`translate(0 70) rotate(${pose.rightKnee})`}>
            <line x1="0" y1="0" x2="0" y2="65" strokeWidth={strokeWidth} stroke={stroke} strokeLinecap="round" />
            <circle cx="0" cy="65" r={jointRadius * 0.85} fill={stroke} />
            <line x1="0" y1="65" x2="18" y2="65" strokeWidth={strokeWidth} stroke={stroke} strokeLinecap="round" />
          </g>
        </g>
        <g transform={`rotate(${pose.headRotation} 0 -290)`}>
          <circle cx="0" cy="-290" r="54" fill={stroke} stroke="none" />
          {isSleeping ? (
            <>
              <path d="M -26 -308 Q -18 -313 -10 -308" strokeWidth="3" stroke="white" fill="none" strokeLinecap="round" />
              <path d="M 10 -308 Q 18 -313 26 -308" strokeWidth="3" stroke="white" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="-18" cy="-308" r="9" fill="white" stroke="none" />
              <circle cx="18" cy="-308" r="9" fill="white" stroke="none" />
              <circle cx="-18" cy="-305" r="5" fill={stroke} stroke="none" />
              <circle cx="18" cy="-305" r="5" fill={stroke} stroke="none" />
            </>
          )}
          {character.expression === "angry" && (
            <>
              <path d="M -28 -324 L -8 -318" strokeWidth="2.5" stroke="white" strokeLinecap="round" />
              <path d="M 8 -318 L 28 -324" strokeWidth="2.5" stroke="white" strokeLinecap="round" />
            </>
          )}
          {character.expression === "sad" && (
            <>
              <path d="M -28 -318 L -8 -324" strokeWidth="2.5" stroke="white" strokeLinecap="round" />
              <path d="M 8 -324 L 28 -318" strokeWidth="2.5" stroke="white" strokeLinecap="round" />
            </>
          )}
          {isSurprised ? (
            <ellipse cx="0" cy="-262" rx="10" ry="14" fill="white" stroke="none" />
          ) : isLaughing ? (
            <path d="M -16 -266 Q 0 -246 16 -266 Z" fill="white" />
          ) : (
            <path d={mouthPath} stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
          {isCrying && (
            <>
              <path d="M -18 -297 Q -22 -283 -18 -275" stroke="#4aa7e8" strokeWidth="4" strokeLinecap="round" />
              <path d="M 18 -297 Q 22 -283 18 -275" stroke="#4aa7e8" strokeWidth="4" strokeLinecap="round" />
            </>
          )}
          {character.expression === "thinking" && (
            <>
              <circle cx="56" cy="-355" r="6" fill="white" stroke="none" />
              <circle cx="48" cy="-340" r="5" fill="white" stroke="none" />
            </>
          )}
        </g>
      </g>
    </svg>
  );
};

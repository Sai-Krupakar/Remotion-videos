import type React from "react";
import { useVideoConfig } from "remotion";
import type { CharacterPose } from "./animations";
import type { StoryCharacter } from "../story/StorySchema";

type Props = {
  character: StoryCharacter;
  pose: CharacterPose;
};

export const ExplainerStickman: React.FC<Props> = ({ character, pose }) => {
  const { width, height } = useVideoConfig();
  const scale = character.scale * height / 1920;
  const color = character.lineColor;
  const sad = ["sad", "crying", "scared"].includes(character.expression);
  const happy = ["happy", "laughing"].includes(character.expression);
  const mouth = sad ? "M -14 -278 Q 0 -292 14 -278" : happy
    ? "M -14 -285 Q 0 -270 14 -285"
    : "M -11 -282 Q 0 -278 11 -282";

  return (
    <svg
      viewBox="-150 -420 300 420"
      width={300 * scale}
      height={420 * scale}
      style={{
        position: "absolute",
        left: character.x * width - 150 * scale,
        top: character.y * height - 420 * scale,
        overflow: "visible",
      }}
      aria-label={`Explainer character ${character.action} with ${character.expression} expression`}
    >
      <g transform={`translate(0 ${pose.verticalOffset}) rotate(${character.rotation + pose.bodyRotation} 0 -170)`}>
        <g fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 0 -245 Q -3 -181 0 -102" />
          <g transform={`translate(-5 -228) rotate(${pose.leftArm})`}>
            <path d="M 0 0 L -4 57 L -12 108" />
            <circle cx="-12" cy="108" r="7" fill={color} stroke="none" />
          </g>
          <g transform={`translate(5 -228) rotate(${pose.rightArm})`}>
            <path d="M 0 0 L 4 57 L 12 108" />
            <circle cx="12" cy="108" r="7" fill={color} stroke="none" />
          </g>
          <g transform={`translate(-3 -102) rotate(${pose.leftLeg})`}>
            <path d="M 0 0 L 0 55" />
            <g transform={`translate(0 55) rotate(${pose.leftKnee})`}>
              <path d="M 0 0 L -4 47" />
            </g>
          </g>
          <g transform={`translate(3 -102) rotate(${pose.rightLeg})`}>
            <path d="M 0 0 L 0 55" />
            <g transform={`translate(0 55) rotate(${pose.rightKnee})`}>
              <path d="M 0 0 L 4 47" />
            </g>
          </g>
        </g>
        <g transform={`rotate(${pose.headRotation} 0 -303)`}>
          <circle cx="0" cy="-303" r="54" fill={color} />
          <ellipse cx="-18" cy="-308" rx="9" ry="13" fill="white" />
          <ellipse cx="18" cy="-308" rx="9" ry="13" fill="white" />
          <circle cx="-16" cy="-306" r="4" fill={color} />
          <circle cx="20" cy="-306" r="4" fill={color} />
          {sad && (
            <g stroke="white" strokeWidth="3" strokeLinecap="round">
              <path d="M -27 -327 L -11 -332" />
              <path d="M 11 -332 L 27 -327" />
            </g>
          )}
          {character.expression === "surprised"
            ? <ellipse cx="0" cy="-283" rx="5" ry="7" fill="white" />
            : <path d={mouth} stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />}
        </g>
      </g>
    </svg>
  );
};

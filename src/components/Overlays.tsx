import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { StoryTag } from "../story/StorySchema";

export const TagPill: React.FC<{ tag: StoryTag }> = ({ tag }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const start = Math.round(tag.startSeconds * fps);
  const end = tag.endSeconds === undefined ? Infinity : Math.round(tag.endSeconds * fps);
  if (frame < start || frame > end) {
    return null;
  }
  const pop = spring({ frame: frame - start, fps, config: { damping: 12, stiffness: 180 } });
  const fadeOut = Number.isFinite(end)
    ? interpolate(frame, [end - 6, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: `${tag.x * 100}%`,
        top: `${tag.y * 100}%`,
        transform: `translate(-50%, -50%) scale(${pop})`,
        opacity: fadeOut,
        padding: "0.3em 0.8em",
        borderRadius: "999px",
        backgroundColor: "#1f2433",
        color: "#f5bd4b",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontWeight: 900,
        fontSize: Math.round(height * 0.02),
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {tag.text}
    </div>
  );
};

export const Letterbox: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const bar = interpolate(frame, [0, 8], [0, height * 0.07], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: bar, backgroundColor: "#0d0d10" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bar, backgroundColor: "#0d0d10" }} />
    </>
  );
};

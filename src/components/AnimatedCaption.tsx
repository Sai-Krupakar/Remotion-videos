import type React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { StoryCaption } from "../story/StorySchema";

type AnimatedCaptionProps = {
  caption: StoryCaption;
};

export const AnimatedCaption: React.FC<AnimatedCaptionProps> = ({ caption }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const start = Math.round(caption.startSeconds * fps);
  const end = Math.round(caption.endSeconds * fps);
  const duration = Math.max(1, end - start);

  if (frame < start || frame > end) {
    return null;
  }

  const localFrame = frame - start;
  const fadeFrames = Math.min(8, Math.floor(duration / 3));
  const opacity = interpolate(
    localFrame,
    [0, fadeFrames, Math.max(fadeFrames, duration - fadeFrames), duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const words = caption.text.trim().split(/\s+/);
  const explainer = caption.mode === "explainer";
  const timedWords = caption.words;
  const activeWordIndex = timedWords
    ? timedWords.findIndex(
        (word) =>
          frame >= Math.round(word.startSeconds * fps) &&
          frame <= Math.round(word.endSeconds * fps),
      )
    : Math.min(
        words.length - 1,
        Math.floor((localFrame / duration) * words.length),
      );
  const visibleCount = timedWords || explainer
    ? words.length
    : Math.max(1, Math.min(words.length, activeWordIndex + 1));

  return (
    <div
      style={{
        position: "absolute",
        left: explainer ? "50%" : "7%",
        width: explainer ? "max-content" : "86%",
        maxWidth: explainer ? "86%" : undefined,
        top:
          caption.position === "top"
            ? "12%"
            : caption.position === "middle"
              ? "46%"
              : undefined,
        bottom: caption.position === "bottom" ? "12%" : undefined,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "0.28em",
        padding: caption.mode === "dialogue" ? "0.55em 0.8em" : "0.25em 0.4em",
        borderRadius: caption.mode === "dialogue" ? "1em" : "0.35em",
        backgroundColor:
          caption.mode === "dialogue" ? "rgba(30, 30, 42, 0.84)" : "rgba(30, 30, 42, 0.72)",
        color: "white",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: caption.fontSize ?? (explainer ? Math.round(height * 0.028) : "clamp(28px, 4.5vw, 58px)"),
        fontWeight: 800,
        lineHeight: 1.2,
        textAlign: "center",
        textShadow: "0 2px 3px rgba(0,0,0,0.3)",
        opacity,
        transform: `${explainer ? "translateX(-50%) " : ""}scale(${interpolate(localFrame, [0, 6], [0.92, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })})`,
      }}
    >
      {words.slice(0, visibleCount).map((word, index) => {
        const timedText = timedWords?.[index]?.text ?? word;
        const isTimedActive = timedWords
          ? index === activeWordIndex
          : index === activeWordIndex;
        const bareWord = word.toLowerCase().replace(/[^\p{L}\p{N}'-]/gu, "");
        const isKeyword = caption.highlightWords?.some(
          (keyword) => keyword.toLowerCase().replace(/[^\p{L}\p{N}'-]/gu, "") === bareWord,
        );

        return (
          <span
            key={`${caption.id}-${index}`}
            style={{
              color: isKeyword || (!explainer && isTimedActive) ? "#f5bd4b" : "white",
            }}
          >
            {timedText}
          </span>
        );
      })}
    </div>
  );
};

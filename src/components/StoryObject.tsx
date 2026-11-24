import type React from "react";
import type { StoryObject as StoryObjectConfig } from "../story/StorySchema";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

type StoryObjectProps = {
  object: StoryObjectConfig;
};

const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

export const resolveObjectPosition = (object: StoryObjectConfig, frame: number, fps: number) => {
  let x = object.x;
  let y = object.y;
  let previousFrame = 0;
  for (const keyframe of object.motion ?? []) {
    const keyframeFrame = Math.round(keyframe.timeSeconds * fps);
    if (frame < keyframeFrame) {
      const progress = smooth((frame - previousFrame) / (keyframeFrame - previousFrame));
      return { x: x + (keyframe.x - x) * progress, y: y + (keyframe.y - y) * progress };
    }
    x = keyframe.x;
    y = keyframe.y;
    previousFrame = keyframeFrame;
  }
  return { x, y };
};

const swayingTypes = new Set(["flower", "sprout", "tree", "plant-pot"]);

export const StoryObject: React.FC<StoryObjectProps> = ({ object }) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scale = object.scale * (height / 1920);
  const viewWidth = 400;
  const viewHeight = 250;
  const rotation = object.rotation;
  const position = resolveObjectPosition(object, frame, fps);
  const appearFrame = object.appearSeconds === undefined ? null : Math.round(object.appearSeconds * fps);
  if (appearFrame !== null && frame < appearFrame) {
    return null;
  }
  const pop = appearFrame === null || appearFrame === 0
    ? 1
    : spring({ frame: frame - appearFrame, fps, config: { damping: 11, stiffness: 160 } });
  const sway = swayingTypes.has(object.type)
    ? Math.sin(frame / 22 + object.x * 9) * (object.type === "tree" ? 1.2 : 4)
    : 0;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      width={viewWidth * scale}
      height={viewHeight * scale}
      style={{
        position: "absolute",
        left: position.x * width - (viewWidth * scale) / 2,
        top: position.y * height - (viewHeight * scale) / 2,
        overflow: "visible",
        transform: `translateY(${object.type === "bee" ? Math.sin(frame / 8) * 8 * scale : 0}px) rotate(${rotation}deg) scale(${pop})`,
        transformOrigin: "center",
      }}
      aria-label={object.type}
    >
      <g transform={`rotate(${sway} 200 235)`}>
      {object.type === "bench" && (
        <g stroke="#5a3f2a" strokeWidth="6">
          <rect x="60" y="110" width="280" height="22" rx="6" fill="#b5784a" />
          <rect x="60" y="145" width="280" height="22" rx="6" fill="#b5784a" />
          <path d="M 90 167 V 235 M 310 167 V 235 M 90 132 V 145 M 310 132 V 145" fill="none" strokeWidth="10" />
        </g>
      )}
      {object.type === "lamp-post" && (
        <g stroke="#2c2e35" strokeWidth="6">
          <rect x="192" y="-180" width="16" height="415" fill="#3a3d46" />
          <path d="M 170 -175 H 230 L 220 -210 H 180 Z" fill="#fff1a8" />
        </g>
      )}
      {object.type === "sofa" && (
        <g stroke="#2f4867" strokeWidth="6">
          <rect x="40" y="60" width="320" height="100" rx="26" fill="#5b7fae" />
          <rect x="20" y="120" width="360" height="80" rx="22" fill="#6a8fbe" />
          <path d="M 60 200 V 232 M 340 200 V 232" strokeWidth="12" />
        </g>
      )}
      {object.type === "plant-pot" && (
        <>
          <path d="M 160 160 H 240 L 228 235 H 172 Z" fill="#c8704f" stroke="#8a4a33" strokeWidth="6" />
          <path d="M 200 160 Q 160 90 130 80 Q 175 100 200 160 Q 205 70 230 40 Q 215 100 200 160 Q 245 100 275 95 Q 240 120 200 160" fill="#5aa04f" stroke="#3d7337" strokeWidth="5" />
        </>
      )}
      {object.type === "seed" && (
        <ellipse cx="200" cy="145" rx="38" ry="55" transform="rotate(30 200 145)" fill="#b87942" stroke="#674427" strokeWidth="6" />
      )}
      {object.type === "garden-bed" && (
        <>
          <ellipse cx="200" cy="175" rx="155" ry="45" fill="#806042" stroke="#664b33" strokeWidth="6" />
          <path d="M 75 172 Q 100 150 126 168 M 239 168 Q 270 148 306 173" fill="none" stroke="#a58057" strokeWidth="5" />
        </>
      )}
      {object.type === "sprout" && (
        <>
          <path d="M 200 222 Q 200 165 200 111" fill="none" stroke="#548749" strokeWidth="9" />
          <path d="M 199 169 Q 145 171 145 129 Q 184 125 199 157 M 200 145 Q 210 96 253 100 Q 254 137 200 155" fill="#7ebb68" stroke="#548749" strokeWidth="5" />
        </>
      )}
      {object.type === "watering-can" && (
        <>
          <path d="M 130 103 H 250 L 237 202 H 143 Z" fill="#7ab5c2" stroke="#4f7881" strokeWidth="6" />
          <path d="M 158 103 Q 159 56 210 58 Q 242 58 238 103 M 250 130 L 302 102 L 312 113 L 251 154" fill="none" stroke="#4f7881" strokeWidth="9" />
          <path d="M 310 94 L 325 116" fill="none" stroke="#4f7881" strokeWidth="9" />
        </>
      )}
      <g
        stroke="#34323b"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {object.type === "flower" && (
          <>
            <path d="M 200 225 V 123 M 200 185 Q 170 150 151 174 M 200 196 Q 230 160 252 181" fill="none" stroke="#59874e" strokeWidth="10" />
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <ellipse key={angle} cx="200" cy="85" rx="16" ry="34" fill="#f3a650" stroke="none" transform={`rotate(${angle} 200 110)`} />
            ))}
            <circle cx="200" cy="110" r="19" fill="#f4d45d" stroke="#855d32" strokeWidth="5" />
          </>
        )}
        {object.type === "bee" && (
          <g transform={`translate(${Math.sin(frame / 15) * 10} 0)`}>
            <ellipse cx="183" cy="91" rx="22" ry="29" fill="#e2f5fc" strokeWidth="4" transform="rotate(-35 183 91)" />
            <ellipse cx="217" cy="91" rx="22" ry="29" fill="#e2f5fc" strokeWidth="4" transform="rotate(35 217 91)" />
            <ellipse cx="200" cy="127" rx="48" ry="30" fill="#f6c443" strokeWidth="5" />
            <path d="M 187 101 Q 177 127 187 153 M 213 99 Q 203 127 213 155" fill="none" strokeWidth="10" />
            <circle cx="231" cy="120" r="3" fill="#34323b" stroke="none" />
          </g>
        )}
        {object.type === "bed" && (
          <>
            <path d="M 25 88 H 375 V 206 H 25 Z" fill="#d87978" />
            <path d="M 25 88 V 206 M 375 88 V 206 M 55 206 V 240 M 345 206 V 240" fill="none" />
            <path d="M 35 100 H 180 V 153 H 35 Z" fill="#f3e8d8" />
            <path d="M 180 120 H 365 V 165 H 180 Z" fill="#9ab6dc" />
          </>
        )}
        {object.type === "clock" && (
          <>
            <circle cx="200" cy="130" r="78" fill="#fff4d2" />
            <path d="M 200 130 V 78 M 200 130 L 241 148" fill="none" />
            <circle cx="200" cy="130" r="6" fill="#34323b" />
          </>
        )}
        {object.type === "alarm" && (
          <>
            <path d="M 135 87 Q 200 40 265 87" fill="#f2bf57" />
            <circle cx="200" cy="145" r="70" fill="#f2bf57" />
            <path d="M 200 145 V 102 M 200 145 L 231 161 M 155 215 L 142 238 M 245 215 L 258 238" fill="none" />
            <path d="M 105 53 L 84 33 M 295 53 L 316 33" fill="none" />
          </>
        )}
        {object.type === "obstacle" && (
          <>
            <path d="M 80 205 L 133 89 L 188 205 Z" fill="#f1b94f" />
            <path d="M 212 205 L 267 89 L 320 205 Z" fill="#f1b94f" />
            <path d="M 118 150 H 150 M 250 150 H 283" fill="none" />
          </>
        )}
        {object.type === "chair" && (
          <>
            <path d="M 115 70 H 285 V 160 H 115 Z M 95 161 H 305 V 190 H 95 Z M 120 190 V 240 M 280 190 V 240" fill="#b8794f" />
          </>
        )}
        {object.type === "table" && (
          <>
            <path d="M 50 90 H 350 V 125 H 50 Z M 82 125 V 235 M 318 125 V 235" fill="#bb8156" />
          </>
        )}
        {object.type === "door" && (
          <>
            <path d="M 102 28 H 298 V 238 H 102 Z" fill="#a96c48" />
            <circle cx="267" cy="145" r="8" fill="#f7d27b" />
          </>
        )}
        {object.type === "phone" && (
          <>
            <rect x="140" y="24" width="120" height="210" rx="22" fill="#343943" />
            <rect x="153" y="48" width="94" height="150" rx="8" fill="#a9d8e9" stroke="none" />
            <circle cx="200" cy="216" r="6" fill="#fff" stroke="none" />
          </>
        )}
        {object.type === "box" && (
          <>
            <path d="M 80 90 L 200 35 L 320 90 L 200 145 Z" fill="#d9a966" />
            <path d="M 80 90 V 200 L 200 242 V 145 Z M 320 90 V 200 L 200 242" fill="#c28b4d" />
          </>
        )}
        {object.type === "tree" && (
          <>
            <path d="M 170 130 H 230 V 240 H 170 Z" fill="#8a603e" />
            <circle cx="200" cy="95" r="73" fill="#67aa68" />
            <circle cx="147" cy="127" r="47" fill="#78bb73" />
            <circle cx="253" cy="128" r="47" fill="#78bb73" />
          </>
        )}
        {object.type === "car" && (
          <>
            <path d="M 58 154 L 92 96 H 283 L 340 154 V 200 H 58 Z" fill="#5f9bce" />
            <path d="M 115 100 L 91 151 H 191 V 100 Z M 207 100 V 151 H 301 L 268 100 Z" fill="#d7eff8" />
            <circle cx="112" cy="201" r="25" fill="#34323b" />
            <circle cx="285" cy="201" r="25" fill="#34323b" />
          </>
        )}
        {object.type === "house" && (
          <>
            <path d="M 70 115 L 200 30 L 330 115 V 230 H 70 Z" fill="#e3b681" />
            <path d="M 48 116 L 200 18 L 352 116" fill="none" stroke="#a9574d" strokeWidth="20" />
            <path d="M 165 150 H 230 V 230 H 165 Z" fill="#805943" />
            <rect x="96" y="135" width="42" height="40" fill="#d9edf1" />
            <rect x="264" y="135" width="42" height="40" fill="#d9edf1" />
          </>
        )}
        {object.type === "laptop" && (
          <>
            <path d="M 100 48 H 300 V 175 H 100 Z" fill="#596b7d" />
            <rect x="113" y="62" width="174" height="98" fill="#b9e5ed" stroke="none" />
            <path d="M 62 184 H 338 L 310 213 H 90 Z" fill="#8996a2" />
          </>
        )}
      </g>
      </g>
    </svg>
  );
};

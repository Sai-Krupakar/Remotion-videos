import type React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { StoryScene } from "../story/StorySchema";

type BackgroundProps = Pick<StoryScene, "background" | "backgroundColor"> & {
  skyTransform?: string;
};

const Cloud: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g transform={`translate(${x} ${y}) scale(${size})`} fill="white">
    <ellipse cx="0" cy="0" rx="70" ry="26" />
    <ellipse cx="-30" cy="-14" rx="34" ry="26" />
    <ellipse cx="22" cy="-22" rx="40" ry="32" />
  </g>
);

const Sky: React.FC<{ width: number; height: number; frame: number; sunX: number }> = ({ width, height, frame, sunX }) => {
  const drift = (offset: number, speed: number) =>
    ((offset * width + frame * speed) % (width * 1.5)) - width * 0.25;
  const glow = 1 + Math.sin(frame / 25) * 0.06;
  return (
    <>
      <circle cx={width * sunX} cy={height * 0.13} r={height * 0.09 * glow} fill="#fff6c4" opacity="0.45" />
      <circle cx={width * sunX} cy={height * 0.13} r={height * 0.045} fill="#ffe680" />
      <Cloud x={drift(0.7, 0.45)} y={height * 0.12} size={height / 1400} />
      <Cloud x={drift(0.15, 0.3)} y={height * 0.24} size={height / 2000} />
    </>
  );
};

export const Background: React.FC<BackgroundProps> = ({
  background,
  backgroundColor,
  skyTransform,
}) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const sky = backgroundColor ?? (background === "night" ? "#18243d" : background === "garden" ? "#a9d8ed" : background === "sidewalk" ? "#a6daf3" : background === "living-room" ? "#efe5d3" : "#cfeeff");
  const floorColor =
    background === "street" ? "#525664" : background === "park" ? "#70b879" : "#d8c6a9";
  const outdoorSky = background === "garden" || background === "park" || background === "sidewalk";

  return (
    <AbsoluteFill style={{ backgroundColor: sky }}>
      {background === "solid" ? null : (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden="true"
        >
          {outdoorSky && (
            <g transform={skyTransform}>
              <Sky width={width} height={height} frame={frame} sunX={background === "park" ? 0.78 : 0.14} />
            </g>
          )}
          {background === "sidewalk" && (
            <>
              {[0.05, 0.22, 0.4, 0.58].map((x, index) => (
                <g key={x} fill={index % 2 ? "#5c9e57" : "#4f8f4c"}>
                  <circle cx={width * x} cy={height * 0.5} r={height * 0.055} />
                  <circle cx={width * (x + 0.07)} cy={height * 0.52} r={height * 0.045} />
                </g>
              ))}
              <rect x={width * 0.66} y={height * 0.42} width={width * 0.34} height={height * 0.2} fill="#f2d27e" />
              <path d={`M ${width * 0.62} ${height * 0.43} L ${width * 0.83} ${height * 0.35} L ${width * 1.04} ${height * 0.43} Z`} fill="#c8694f" />
              <rect x={width * 0.72} y={height * 0.47} width={width * 0.09} height={height * 0.05} fill="#9fd0e6" stroke="#8a6d45" strokeWidth="5" />
              <rect x={width * 0.87} y={height * 0.47} width={width * 0.09} height={height * 0.05} fill="#9fd0e6" stroke="#8a6d45" strokeWidth="5" />
              <rect x={width * 0.86} y={height * 0.16} width={width * 0.018} height={height * 0.5} fill="#8b7a6b" />
              <rect x={width * 0.82} y={height * 0.19} width={width * 0.1} height={height * 0.008} fill="#8b7a6b" />
              <path d={`M 0 ${height * 0.22} Q ${width * 0.45} ${height * 0.26} ${width * 0.83} ${height * 0.195} M 0 ${height * 0.25} Q ${width * 0.45} ${height * 0.29} ${width * 0.91} ${height * 0.195}`} fill="none" stroke="#4b4f58" strokeWidth="3" />
              <rect x="0" y={height * 0.6} width={width} height={height * 0.09} fill="#f0cf73" />
              {Array.from({ length: 6 }, (_, index) => (
                <rect key={index} x={width * (index * 0.2 - 0.01)} y={height * 0.585} width={width * 0.06} height={height * 0.105} fill="#e6bf5d" />
              ))}
              {Array.from({ length: 30 }, (_, index) => (
                <rect key={index} x={width * (index / 30)} y={height * 0.54} width="6" height={height * 0.05} fill="#2c2e35" />
              ))}
              <rect x="0" y={height * 0.54} width={width} height="8" fill="#2c2e35" />
              {[0.08, 0.3, 0.48].map((x) => (
                <ellipse key={x} cx={width * x} cy={height * 0.585} rx={width * 0.1} ry={height * 0.04} fill="#5aa04f" />
              ))}
              <rect x="0" y={height * 0.69} width={width} height={height * 0.18} fill="#c9c6c0" />
              <path d={`M 0 ${height * 0.775} H ${width}`} stroke="#8f8b85" strokeWidth="5" />
              {Array.from({ length: 7 }, (_, index) => (
                <path key={index} d={`M ${width * (index * 0.19 - 0.02)} ${height * 0.69} L ${width * (index * 0.19 - 0.05)} ${height * 0.87}`} stroke="#8f8b85" strokeWidth="5" />
              ))}
              <rect x="0" y={height * 0.87} width={width} height={height * 0.018} fill="#ece8e1" />
              <rect x="0" y={height * 0.888} width={width} height={height * 0.112} fill="#666a72" />
              <path d={`M 0 ${height * 0.95} H ${width}`} stroke="#f4f1e8" strokeWidth="7" strokeDasharray={`${width * 0.09} ${width * 0.07}`} />
            </>
          )}
          {background === "living-room" && (
            <>
              <rect x={width * 0.58} y={height * 0.2} width={width * 0.3} height={height * 0.2} fill="#a6daf3" stroke="#fff" strokeWidth="14" />
              <path d={`M ${width * 0.73} ${height * 0.2} V ${height * 0.4} M ${width * 0.58} ${height * 0.3} H ${width * 0.88}`} stroke="#fff" strokeWidth="9" />
              <g transform={`translate(${(frame * 0.25) % (width * 0.2)} 0)`}>
                <ellipse cx={width * 0.64} cy={height * 0.25} rx={width * 0.035} ry={height * 0.008} fill="white" />
              </g>
              <rect x={width * 0.12} y={height * 0.25} width={width * 0.2} height={height * 0.08} fill="#f2c36b" stroke="#8c6b3d" strokeWidth="8" />
              <path d={`M ${width * 0.13} ${height * 0.325} L ${width * 0.19} ${height * 0.28} L ${width * 0.23} ${height * 0.31} L ${width * 0.27} ${height * 0.285} L ${width * 0.31} ${height * 0.325} Z`} fill="#d9774f" />
              <rect x="0" y={height * 0.74} width={width} height={height * 0.26} fill="#c9925f" />
              <rect x="0" y={height * 0.735} width={width} height={height * 0.012} fill="#fffaf0" />
              {Array.from({ length: 5 }, (_, index) => (
                <path key={index} d={`M 0 ${height * (0.79 + index * 0.05)} H ${width}`} stroke="#b07d4f" strokeWidth="4" />
              ))}
              <ellipse cx={width * 0.5} cy={height * 0.83} rx={width * 0.36} ry={height * 0.03} fill="#e5a6a0" />
              <rect x={width * 0.08} y={height * 0.5} width="8" height={height * 0.24} fill="#5b4a3d" />
              <path d={`M ${width * 0.03} ${height * 0.5} L ${width * 0.06} ${height * 0.45} H ${width * 0.12} L ${width * 0.15} ${height * 0.5} Z`} fill="#f3c55f" />
            </>
          )}
          {(background === "room" || background === "bedroom") && (
            <>
              <rect x="0" y={height * 0.72} width={width} height={height * 0.28} fill={floorColor} />
              <path d={`M 0 ${height * 0.72} H ${width}`} stroke="#b09b7f" strokeWidth="8" />
              <rect x={width * 0.12} y={height * 0.16} width={width * 0.28} height={height * 0.22} rx="18" fill="#fff3cd" stroke="#8c7c69" strokeWidth="10" />
              <path d={`M ${width * 0.26} ${height * 0.16} V ${height * 0.38} M ${width * 0.12} ${height * 0.27} H ${width * 0.4}`} stroke="#8c7c69" strokeWidth="8" />
              <circle cx={width * 0.78} cy={height * 0.2} r={height * 0.055} fill="#f2bc63" />
              <rect x={width * 0.66} y={height * 0.28} width={width * 0.24} height={height * 0.11} rx="12" fill="#e1b5b1" />
            </>
          )}
          {background === "garden" && (
            <>
              <rect x="0" y={height * 0.635} width={width} height={height * 0.012} fill="#c99a63" />
              <rect x="0" y={height * 0.68} width={width} height={height * 0.012} fill="#c99a63" />
              {Array.from({ length: 17 }, (_, index) => (
                <path
                  key={index}
                  d={`M ${width * (index * 0.062)} ${height * 0.73} V ${height * 0.62} L ${width * (index * 0.062 + 0.02)} ${height * 0.605} L ${width * (index * 0.062 + 0.04)} ${height * 0.62} V ${height * 0.73} Z`}
                  fill="#e2b77f"
                  stroke="#a77d4d"
                  strokeWidth="4"
                />
              ))}
              {Array.from({ length: 9 }, (_, index) => (
                <g key={index}>
                  <path d={`M ${width * (0.05 + index * 0.115)} ${height * 0.72} V ${height * 0.69}`} stroke="#59874e" strokeWidth="5" />
                  <circle cx={width * (0.05 + index * 0.115)} cy={height * 0.685} r={height * 0.009} fill={["#e46b8a", "#f3a650", "#8f78d6", "#fff2e0"][index % 4]} />
                  <circle cx={width * (0.05 + index * 0.115)} cy={height * 0.685} r={height * 0.0035} fill="#f4d45d" />
                </g>
              ))}
              <path d={`M 0 ${height * 0.72} Q ${width * 0.25} ${height * 0.67} ${width * 0.5} ${height * 0.72} Q ${width * 0.75} ${height * 0.66} ${width} ${height * 0.72} V ${height} H 0 Z`} fill="#91bd72" />
            </>
          )}
          {background === "street" && (
            <>
              <rect x="0" y={height * 0.64} width={width} height={height * 0.12} fill="#c7c2b9" />
              <rect x="0" y={height * 0.76} width={width} height={height * 0.24} fill={floorColor} />
              <path d={`M 0 ${height * 0.76} H ${width}`} stroke="#eee5d3" strokeWidth="10" />
              <path d={`M 0 ${height * 0.9} H ${width}`} stroke="#f8d978" strokeWidth="8" strokeDasharray={`${width * 0.08} ${width * 0.06}`} />
              <rect x={width * 0.04} y={height * 0.35} width={width * 0.23} height={height * 0.29} fill="#e6a47e" />
              <rect x={width * 0.73} y={height * 0.28} width={width * 0.24} height={height * 0.36} fill="#dfc18d" />
              <circle cx={width * 0.82} cy={height * 0.12} r={height * 0.045} fill="#ffd66e" />
            </>
          )}
          {background === "park" && (
            <>
              <rect x="0" y={height * 0.72} width={width} height={height * 0.28} fill={floorColor} />
              <path d={`M 0 ${height * 0.72} Q ${width * 0.5} ${height * 0.65} ${width} ${height * 0.72}`} fill="#8bd18a" />
            </>
          )}
          {background === "night" && (
            <>
              <circle cx={width * 0.78} cy={height * 0.17} r={height * 0.055} fill="#fff1bc" />
              <circle cx={width * 0.8} cy={height * 0.15} r={height * 0.05} fill={sky} />
              <circle cx={width * 0.2} cy={height * 0.18} r="5" fill="white" />
              <circle cx={width * 0.4} cy={height * 0.3} r="4" fill="white" />
              <rect x="0" y={height * 0.74} width={width} height={height * 0.26} fill="#253b38" />
            </>
          )}
        </svg>
      )}
    </AbsoluteFill>
  );
};

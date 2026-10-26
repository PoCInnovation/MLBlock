import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";

// Rectangle qui s'inscrit autour d'une zone (px écran 1920x1080) + libellé. `at` = frame d'apparition.
export const Callout: React.FC<{ x: number; y: number; w: number; h: number; label?: string; at?: number; color?: string; labelSide?: "top" | "bottom"; labelDx?: number }> =
  ({ x, y, w, h, label, at = 0, color = C.primary, labelSide = "bottom", labelDx = 0 }) => {
    const f = useCurrentFrame(); const { fps } = useVideoConfig();
    const p = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 120 } });
    const o = interpolate(f - at, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    if (f < at) return null;
    return (
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: o, transform: `scale(${0.92 + 0.08 * p})`,
        border: `4px solid ${color}`, borderRadius: 16, boxShadow: `0 0 0 6px ${color}33, 0 0 40px ${color}66` }}>
        {label && (
          <div style={{ position: "absolute", left: labelDx, ...(labelSide === "top" ? { bottom: "100%", marginBottom: 18 } : { top: "100%", marginTop: 18 }), whiteSpace: "nowrap",
            background: color, color: "#fff", fontFamily: FONT, fontWeight: 700, fontSize: 30, padding: "10px 22px", borderRadius: 12 }}>
            {label}
          </div>
        )}
      </div>
    );
  };

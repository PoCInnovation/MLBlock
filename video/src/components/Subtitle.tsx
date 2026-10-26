import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";

// Bandeau bas ; apparition mot à mot sur ~1 s.
export const Subtitle: React.FC<{ text: string; at?: number }> = ({ text, at = 6 }) => {
  const f = useCurrentFrame(); const words = text.split(" ");
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", justifyContent: "center" }}>
      <div style={{ background: "rgba(23,19,17,0.86)", border: `1px solid ${C.border}`, borderRadius: 18, padding: "18px 38px",
        fontFamily: FONT, fontWeight: 600, fontSize: 44, color: C.fg, maxWidth: 1700, textAlign: "center", lineHeight: 1.25 }}>
        {words.map((w, i) => (
          <span key={i} style={{ opacity: interpolate(f, [at + i * 3, at + i * 3 + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{w}{" "}</span>
        ))}
      </div>
    </div>
  );
};

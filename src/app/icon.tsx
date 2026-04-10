import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "1px",
          fontFamily: "sans-serif",
          fontWeight: 800,
          letterSpacing: "-1px",
        }}
      >
        <span style={{ color: "#60a5fa", fontSize: 13 }}>P</span>
        <span style={{ color: "#facc15", fontSize: 13 }}>F</span>
        <span style={{ color: "#4ade80", fontSize: 13 }}>C</span>
      </div>
    </div>,
    size
  );
}

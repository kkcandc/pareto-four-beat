import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#090a0e",
          color: "#f4efe4",
          padding: "64px",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#e6c27a" }}>
          Four beats · personal educational demo
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, lineHeight: 0.92, fontStyle: "italic" }}>
          <span>A composite,</span>
          <span style={{ color: "#e6c27a" }}>not a router.</span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#b7b1a6" }}>
          Request · Parallel · Select · Return · $0.80 / $3.20
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

export const alt = "IQ.Pulse — Medición cognitiva honesta y de acceso libre";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 96,
            fontWeight: 700,
            color: "#F5F5F7",
            letterSpacing: -2,
          }}
        >
          IQ
          <span style={{ color: "#0A84FF" }}>.</span>
          Pulse
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            color: "#98989D",
            maxWidth: 800,
            textAlign: "center",
          }}
        >
          Medición cognitiva honesta y de acceso libre
        </div>
      </div>
    ),
    { ...size }
  );
}

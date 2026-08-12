import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          color: "#1D1D1F",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: 90,
          letterSpacing: -4,
        }}
      >
        IQ
        <span style={{ color: "#007AFF" }}>.</span>
      </div>
    ),
    { ...size }
  );
}

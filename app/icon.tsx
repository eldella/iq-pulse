import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 18,
          letterSpacing: -1,
        }}
      >
        IQ
        <span style={{ color: "#007AFF" }}>.</span>
      </div>
    ),
    { ...size }
  );
}

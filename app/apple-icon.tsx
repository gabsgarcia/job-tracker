import { ImageResponse } from "next/og";

// Icon used when the app is added to an iPhone home screen.
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
          background: "#4f46e5",
        }}
      >
        {/* Briefcase: handle on top of the case */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 40,
              height: 22,
              border: "12px solid white",
              borderBottom: "none",
              borderRadius: "10px 10px 0 0",
            }}
          />
          <div
            style={{
              display: "flex",
              width: 100,
              height: 70,
              border: "12px solid white",
              borderRadius: 14,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}

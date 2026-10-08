import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
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
          background: "linear-gradient(135deg, #18191d 0%, #0d0e10 100%)",
          borderRadius: 40,
          border: "2px solid #2a2c34",
          position: "relative",
        }}
      >
        {/* Subtle glow / shadow card backing */}
        <div
          style={{
            position: "absolute",
            width: 104,
            height: 122,
            background: "#23252c",
            borderRadius: 14,
            border: "1.5px solid #333640",
            transform: "translate(4px, 4px)",
          }}
        />

        {/* Foreground Folio */}
        <div
          style={{
            width: 102,
            height: 120,
            background: "#f4f4f1",
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            border: "1px solid #ffffff",
          }}
        >
          {/* Accent dot on top tab */}
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 12,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#d97706",
              boxShadow: "0 0 6px rgba(217,119,6,0.6)",
            }}
          />

          {/* S Monogram */}
          <span
            style={{
              fontSize: 66,
              fontWeight: 900,
              color: "#111111",
              fontFamily: "sans-serif",
              lineHeight: 1,
              marginTop: -6,
              letterSpacing: "-0.04em",
            }}
          >
            S
          </span>

          {/* Index lines */}
          <div
            style={{
              width: 58,
              height: 4,
              background: "#9e9e98",
              borderRadius: 2,
              marginTop: 6,
            }}
          />
          <div
            style={{
              width: 36,
              height: 3,
              background: "#c0c0b8",
              borderRadius: 2,
              marginTop: 4,
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

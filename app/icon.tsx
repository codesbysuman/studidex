import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
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
          background: "linear-gradient(135deg, #18191d 0%, #0d0e10 100%)",
          borderRadius: 7,
          border: "1px solid #2a2c34",
        }}
      >
        <div
          style={{
            width: 19,
            height: 23,
            background: "#f4f4f1",
            borderRadius: 3.5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 2px 5px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              right: 2.5,
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "#d97706",
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 900,
              color: "#111111",
              fontFamily: "sans-serif",
              lineHeight: 1,
              marginTop: -2,
            }}
          >
            S
          </span>
          <div
            style={{
              width: 11,
              height: 1.5,
              background: "#9e9e98",
              borderRadius: 1,
              marginTop: 1,
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

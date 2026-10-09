import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Studidex — Your Academic Life, Indexed";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(145deg, #131418 0%, #0a0b0d 100%)",
          color: "#f4f4f1",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle background glow effect */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(0,0,0,0) 70%)",
          }}
        />

        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Logo Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* Logo Mark */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "#f4f4f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#d97706",
                }}
              />
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#111111",
                  lineHeight: 1,
                  marginTop: -2,
                }}
              >
                S
              </span>
            </div>

            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#ffffff",
              }}
            >
              Studidex
            </span>
          </div>

          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 999,
              background: "#1c1d22",
              border: "1px solid #2e3038",
              fontSize: 14,
              color: "#a3a39e",
              fontWeight: 500,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
              }}
            />
            Personal Study Workspace
          </div>
        </div>

        {/* Center Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: 960,
          }}
        >
          <h1
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              color: "#ffffff",
              margin: 0,
            }}
          >
            Your Academic Life, Indexed.
          </h1>
          <p
            style={{
              fontSize: 24,
              color: "#9e9e98",
              lineHeight: 1.45,
              margin: 0,
              fontWeight: 400,
              maxWidth: 820,
            }}
          >
            The unified academic workspace for university students. Track timetables,
            syllabus mastery, assignments, and exam prep in one connected index.
          </p>
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          {[
            "Live Agenda & Timetable",
            "Action Deliverables",
            "Syllabus Mastery",
            "Exam Readiness Cockpit",
          ].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                background: "#16171b",
                border: "1px solid #272830",
                fontSize: 16,
                fontWeight: 600,
                color: "#deded9",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

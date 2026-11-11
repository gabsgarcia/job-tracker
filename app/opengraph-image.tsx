import { ImageResponse } from "next/og";

// The picture shown when a link to the app is shared (WhatsApp, Slack, LinkedIn,
// X, iMessage…). Generated at build time from this code, in the Indigo scheme.
export const alt = "Job Tracker: your job search, organized";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PRIMARY = "#4f46e5";
const columns = [
  { label: "saved", bg: "#ede9fe", fg: "#5b21b6", cards: ["Airbnb", "Hotmart"] },
  { label: "applied", bg: "#dbeafe", fg: "#1e40af", cards: ["Nubank", "Stone"] },
  { label: "interviewing", bg: "#fef3c7", fg: "#92400e", cards: ["iFood"] },
  { label: "offered", bg: "#dcfce7", fg: "#166534", cards: ["PicPay"] },
];

// Geist (the app's font) in regular and extra bold, from Google Fonts. If the
// download fails, the image still renders with the built-in font.
async function loadFont(weight: 400 | 800) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Geist:wght@${weight}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return { name: "Geist", data: await (await fetch(url)).arrayBuffer(), weight, style: "normal" as const };
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const fonts = (await Promise.all([loadFont(400), loadFont(800)])).filter((f) => f !== null);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 48,
          padding: "0 72px",
          background: "linear-gradient(135deg, #f5f3ff 0%, #eef2ff 45%, #e0e7ff 100%)",
          fontFamily: "Geist",
        }}
      >
        {/* Left: brand and promise */}
        <div style={{ display: "flex", flexDirection: "column", width: 530 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: PRIMARY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 24, height: 18, border: "4px solid white", borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: PRIMARY }}>Job Tracker</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 36,
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -2,
              color: "#1e1b4b",
            }}
          >
            <span>Your job search,</span>
            <span style={{ color: PRIMARY }}>organized.</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 28, lineHeight: 1.35, color: "#4b5563" }}>
            Paste a job link and AI fills in the details. Track every application on a Kanban
            board.
          </div>
        </div>

        {/* Right: a small picture of the board */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: 20,
            borderRadius: 24,
            background: "white",
            boxShadow: "0 24px 60px rgba(79, 70, 229, 0.18)",
            transform: "rotate(-2deg)",
          }}
        >
          {columns.map((column) => (
            <div
              key={column.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                width: 112,
                minHeight: 300,
                padding: 10,
                borderRadius: 14,
                background: "#f3f4f6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 15,
                  fontWeight: 600,
                  background: column.bg,
                  color: column.fg,
                }}
              >
                {column.label}
              </div>
              {column.cards.map((company) => (
                <div
                  key={company}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: 10,
                    borderRadius: 10,
                    background: "white",
                    border: column.label === "offered" ? `3px solid ${PRIMARY}` : "1px solid #e5e7eb",
                    fontSize: 17,
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {company}
                  <div style={{ marginTop: 4, height: 8, width: 70, borderRadius: 4, background: "#e5e7eb" }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

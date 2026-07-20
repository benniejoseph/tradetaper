import { ImageResponse } from "next/og";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

export const OG_IMAGE_SIZE = {
  width: OG_WIDTH,
  height: OG_HEIGHT,
};

export const OG_IMAGE_CONTENT_TYPE = "image/png";

type SeoImageOptions = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  accentFrom?: string;
  accentTo?: string;
};

export function createSeoImage({
  title,
  subtitle,
  eyebrow = "TradeTaper",
  accentFrom = "#10b981",
  accentTo = "#0f766e",
}: SeoImageOptions) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#03110c",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(16,185,129,0.28), transparent 45%), radial-gradient(circle at 85% 80%, rgba(15,118,110,0.3), transparent 45%)",
          color: "#ecfdf5",
          padding: "68px 72px",
          fontFamily:
            "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          {eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.05,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.25,
              color: "#c7f9e9",
            }}
          >
            {subtitle}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              fontSize: 28,
              color: "#d1fae5",
              opacity: 0.92,
            }}
          >
            tradetaper.com
          </div>
          <div
            style={{
              width: 280,
              height: 12,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
            }}
          />
        </div>
      </div>
    ),
    {
      ...OG_IMAGE_SIZE,
    },
  );
}

import {
  createSeoImage,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/lib/seo-image";

export const alt = "TradeTaper - AI Trading Journal";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createSeoImage({
    title: "AI Trading Journal for Disciplined Traders",
    subtitle:
      "Journal executions, review with AI, and improve risk discipline with measurable feedback loops.",
    accentFrom: "#10b981",
    accentTo: "#0f766e",
  });
}

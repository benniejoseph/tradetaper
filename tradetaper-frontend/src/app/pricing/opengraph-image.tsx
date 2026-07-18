import {
  createSeoImage,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/lib/seo-image";

export const alt = "TradeTaper Pricing Plans";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createSeoImage({
    title: "Pricing Plans",
    subtitle:
      "Compare Free, Essential, and Premium plans with feature gates, AI tools, and MT5 sync capacity.",
    accentFrom: "#34d399",
    accentTo: "#059669",
  });
}

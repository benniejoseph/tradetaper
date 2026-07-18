import {
  createSeoImage,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/lib/seo-image";

export const alt = "TradeTaper Support Center";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createSeoImage({
    title: "Support Center",
    subtitle:
      "Find guides, troubleshooting help, and direct support channels for the TradeTaper platform.",
    accentFrom: "#22c55e",
    accentTo: "#16a34a",
  });
}

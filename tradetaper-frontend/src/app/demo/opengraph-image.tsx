import {
  createSeoImage,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/lib/seo-image";

export const alt = "TradeTaper Product Demo";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createSeoImage({
    title: "Product Demo",
    subtitle:
      "See how TradeTaper turns trade history into structured reviews, AI insights, and measurable progress.",
    accentFrom: "#10b981",
    accentTo: "#0891b2",
  });
}

import {
  createSeoImage,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/lib/seo-image";

export const alt = "Contact TradeTaper";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createSeoImage({
    title: "Contact TradeTaper",
    subtitle:
      "Reach support, billing, or sales to get help with your account and trading workflow setup.",
    accentFrom: "#22d3ee",
    accentTo: "#0e7490",
  });
}

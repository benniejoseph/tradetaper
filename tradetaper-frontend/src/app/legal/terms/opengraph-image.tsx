import {
  createSeoImage,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/lib/seo-image";

export const alt = "TradeTaper Terms of Service";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createSeoImage({
    title: "Terms of Service",
    subtitle:
      "Understand the legal terms, responsibilities, and usage conditions for TradeTaper services.",
    accentFrom: "#60a5fa",
    accentTo: "#1d4ed8",
  });
}

import {
  createSeoImage,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/lib/seo-image";

export const alt = "TradeTaper Legal Documents";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createSeoImage({
    title: "Legal Documents",
    subtitle:
      "Access TradeTaper terms, privacy, and cancellation policies with clear and transparent language.",
    accentFrom: "#60a5fa",
    accentTo: "#2563eb",
  });
}

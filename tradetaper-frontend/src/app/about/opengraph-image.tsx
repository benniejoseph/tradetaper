import {
  createSeoImage,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/lib/seo-image";

export const alt = "About TradeTaper";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createSeoImage({
    title: "About TradeTaper",
    subtitle:
      "Built for traders who want cleaner execution data, stronger discipline, and continuous improvement.",
    accentFrom: "#14b8a6",
    accentTo: "#0f766e",
  });
}

import {
  createSeoImage,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/lib/seo-image";

export const alt = "TradeTaper Privacy Policy";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createSeoImage({
    title: "Privacy Policy",
    subtitle:
      "Learn how TradeTaper collects, secures, and manages personal data across the platform.",
    accentFrom: "#4ade80",
    accentTo: "#16a34a",
  });
}

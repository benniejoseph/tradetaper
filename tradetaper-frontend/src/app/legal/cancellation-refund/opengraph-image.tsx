import {
  createSeoImage,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/lib/seo-image";

export const alt = "TradeTaper Cancellation and Refund Policy";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createSeoImage({
    title: "Cancellation & Refund Policy",
    subtitle:
      "Review cancellation terms, billing details, and refund eligibility for TradeTaper subscriptions.",
    accentFrom: "#c084fc",
    accentTo: "#7c3aed",
  });
}

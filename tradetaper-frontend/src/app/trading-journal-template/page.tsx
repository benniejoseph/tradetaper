import LandingPageView, {
  buildLandingMetadata,
} from "@/components/marketing/LandingPageView";

const SLUG = "trading-journal-template";

export const metadata = buildLandingMetadata(SLUG);

export default function Page() {
  return <LandingPageView slug={SLUG} />;
}

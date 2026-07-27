import LandingPageView, {
  buildLandingMetadata,
} from "@/components/marketing/LandingPageView";

const SLUG = "forex-trading-journal";

export const metadata = buildLandingMetadata(SLUG);

export default function Page() {
  return <LandingPageView slug={SLUG} />;
}

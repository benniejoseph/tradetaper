import LandingPageView, {
  buildLandingMetadata,
} from "@/components/marketing/LandingPageView";

const SLUG = "trading-journal-app";

export const metadata = buildLandingMetadata(SLUG);

export default function Page() {
  return <LandingPageView slug={SLUG} />;
}

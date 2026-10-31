import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/coming-soon";
import { COMING_SOON } from "@/lib/labels";

// Screens that aren't built yet, so the navigation never leads to a broken page.
export function generateStaticParams() {
  return Object.keys(COMING_SOON).map((section) => ({ section }));
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!(section in COMING_SOON)) notFound();
  return <ComingSoon section={section as keyof typeof COMING_SOON} />;
}

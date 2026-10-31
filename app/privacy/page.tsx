import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { LEGAL } from "@/lib/labels";

export const metadata: Metadata = { title: `${LEGAL.privacyTitle} · EDITH` };

export default function Privacy() {
  return <LegalPage title={LEGAL.privacyTitle} sections={LEGAL.privacy} />;
}

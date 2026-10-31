import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { LEGAL } from "@/lib/labels";

export const metadata: Metadata = { title: `${LEGAL.termsTitle} · EDITH` };

export default function Terms() {
  return <LegalPage title={LEGAL.termsTitle} sections={LEGAL.terms} />;
}

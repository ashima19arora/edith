import type { ReactNode } from "react";
import { SampleBanner } from "@/components/sample-banner";
import { ClientOnly } from "@/lib/theme";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ClientOnly>
      <SampleBanner />
      {children}
    </ClientOnly>
  );
}

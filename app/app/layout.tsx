import type { ReactNode } from "react";
import { ClientOnly } from "@/lib/theme";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <ClientOnly>{children}</ClientOnly>;
}

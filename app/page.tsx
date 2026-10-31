import Image from "next/image";
import Link from "next/link";
import { LEGAL } from "@/lib/labels";

// Placeholder until the landing page is built (last step).
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center text-white">
      <Image src="/brand/edith-wordmark.png" alt="EDITH" width={282} height={120} priority />
      <p className="max-w-md text-[#cfc8f5]">{LEGAL.about}</p>
      <Link href="/app" className="underline">
        Get started
      </Link>
      <nav className="flex gap-4 text-sm text-[#cfc8f5]">
        <Link href="/privacy" className="underline">
          {LEGAL.privacyTitle}
        </Link>
        <Link href="/terms" className="underline">
          {LEGAL.termsTitle}
        </Link>
      </nav>
    </main>
  );
}

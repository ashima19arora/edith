import Image from "next/image";
import Link from "next/link";

// Placeholder until the landing page is built (last step).
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 text-white">
      <Image src="/brand/edith-wordmark.png" alt="EDITH" width={282} height={120} priority />
      <Link href="/app" className="underline">
        Get started
      </Link>
    </main>
  );
}

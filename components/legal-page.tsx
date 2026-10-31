import Link from "next/link";
import { LEGAL } from "@/lib/labels";

interface LegalPageProps {
  title: string;
  sections: { heading: string; body: string }[];
}

export function LegalPage({ title, sections }: LegalPageProps) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 text-[#cfc8f5]">
      <Link href="/" className="underline">
        {LEGAL.home}
      </Link>
      <h1 className="mt-6 text-3xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm">{LEGAL.updated}</p>
      {sections.map(({ heading, body }) => (
        <section key={heading} className="mt-8">
          <h2 className="text-lg font-semibold text-white">{heading}</h2>
          <p className="mt-2 leading-relaxed">{body}</p>
        </section>
      ))}
      <p className="mt-10">
        {LEGAL.contactPrefix}{" "}
        <a href={`mailto:${LEGAL.email}`} className="underline">
          {LEGAL.email}
        </a>
      </p>
    </main>
  );
}

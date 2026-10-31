import type { Metadata } from "next";
import { Bangers, Comic_Neue, Inter } from "next/font/google";
import "./globals.css";

const comic = Bangers({ variable: "--font-comic", subsets: ["latin"], weight: "400" });
const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const label = Comic_Neue({ variable: "--font-label", subsets: ["latin"], weight: "700" });

export const metadata: Metadata = {
  title: "EDITH",
  description: "Environmental Defence & Impact Tracking Hero: India-first air quality and carbon footprint companion.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${comic.variable} ${body.variable} ${label.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

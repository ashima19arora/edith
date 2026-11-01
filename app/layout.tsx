import type { Metadata, Viewport } from "next";
import { Bangers, Comic_Neue, Inter, Silkscreen } from "next/font/google";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

const comic = Bangers({ variable: "--font-comic", subsets: ["latin"], weight: "400" });
const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const label = Comic_Neue({ variable: "--font-label", subsets: ["latin"], weight: "700" });
const pixel = Silkscreen({ variable: "--font-pixel", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "EDITH",
  description: "Environmental Defence & Impact Tracking Hero: India-first air quality and carbon footprint companion.",
  appleWebApp: { capable: true, title: "EDITH", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0e0b1f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${comic.variable} ${body.variable} ${label.variable} ${pixel.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}

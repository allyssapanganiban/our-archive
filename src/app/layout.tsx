import type { Metadata } from "next";
import { Archivo, Caveat, Courier_Prime, Instrument_Serif } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-serif" });
const hand = Caveat({ weight: ["400", "600", "700"], subsets: ["latin"], variable: "--font-hand" });
const mono = Courier_Prime({ weight: ["400", "700"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-mono" });
const card = Archivo({ weight: ["400", "600", "800"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-card" });

export const metadata: Metadata = {
  title: "Our Scrapbook",
  description: "A little archive for Allyssa & Justin.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${hand.variable} ${mono.variable} ${card.variable}`}>
      <body>{children}</body>
    </html>
  );
}

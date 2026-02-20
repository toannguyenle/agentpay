import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "AgentPay",
  description: "Let your AI agents spend money safely.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrains.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

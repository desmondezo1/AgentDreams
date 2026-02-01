import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "zzzclaw | The Operating System for Autonomous Labor",
  description: "Escrow payments. Agent verification. Real-time settlement on Base.",
  keywords: "blockchain, agents, AI, escrow, Base, USDC, autonomous, openclaw",
  authors: [{ name: "zzzclaw Protocol" }],
  openGraph: {
    title: "zzzclaw Protocol",
    description: "The Operating System for Autonomous Labor",
    type: "website",
    url: "https://zzzclaw.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "zzzclaw Protocol",
    description: "The Operating System for Autonomous Labor",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
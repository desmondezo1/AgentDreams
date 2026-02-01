import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "AgentDreams | The Operating System for Autonomous Labor",
  description: "Escrow payments. Agent verification. Real-time settlement on Base.",
  keywords: "blockchain, agents, AI, escrow, Base, USDC, autonomous",
  authors: [{ name: "AgentDreams Protocol" }],
  openGraph: {
    title: "AgentDreams Protocol",
    description: "The Operating System for Autonomous Labor",
    type: "website",
    url: "https://agentdreams.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentDreams Protocol",
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
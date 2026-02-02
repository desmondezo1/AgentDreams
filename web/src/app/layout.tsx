import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "zzzclaw | Agent Intelligence Network",
  description: "A decentralized network where autonomous agents discover, share, and verify real-world opportunities.",
  keywords: "agents, AI, intelligence, opportunities, skills, autonomous, zzzclaw",
  authors: [{ name: "ZzzClaw Network" }],
  openGraph: {
    title: "ZzzClaw - Agent Intelligence Network",
    description: "Autonomous agents sharing intelligence. Post discoveries. Earn clout. Build reputation.",
    type: "website",
    url: "https://zzzclaw.xyz",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZzzClaw - Agent Intelligence Network",
    description: "Autonomous agents sharing intelligence. Post discoveries. Earn clout. Build reputation.",
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
        <SpeedInsights />
      </body>
    </html>
  );
}

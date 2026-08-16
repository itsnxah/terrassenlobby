import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Aurora } from "@/components/Aurora";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terrassenlobby",
  description: "Finde Partys in deiner Nähe – wie das Beitreten eines Servers.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#07060d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-ink-950 text-white antialiased">
        <Aurora />
        <TopBar />
        <main className="mx-auto max-w-3xl px-4 pt-6">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}

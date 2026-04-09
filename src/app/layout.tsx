import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Shared/Footer/Footer";
import { TopNav } from "@/components/Shared/TopNav/TopNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Online Assessment Platform",
  description: "Role-based online assessment platform for employers and candidates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-screen flex-col bg-background text-text-primary">
        <TopNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

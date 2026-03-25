import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Invoice Processor",
  description: "Auto-extract and process invoice data effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <Toaster theme="dark" position="top-right" closeButton richColors />
      </body>
    </html>
  );
}

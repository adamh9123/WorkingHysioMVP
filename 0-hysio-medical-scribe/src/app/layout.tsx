import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Hysio Medical Scribe",
  description: "AI-ondersteunde documentatie voor fysiotherapeuten. Professioneel, efficiënt en conform Nederlandse richtlijnen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={`${inter.variable} font-sans antialiased`} style={{ backgroundColor: '#A5E1C5', color: '#003728' }}>
        {children}
      </body>
    </html>
  );
}

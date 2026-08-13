import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const title = "Cirqut — PCB creation made easy";
const description = "Move from an idea to a clear PCB project handoff with guided setup, source-backed research, an editable starting schematic, and board-specific review material.";
const appUrl = process.env.APP_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3001");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title,
  description,
  applicationName: "Cirqut",
  openGraph: { title, description, images: ["/og-v4.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["/og-v4.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Stack+Sans+Headline:wght@200..700&family=Stack+Sans+Text:wght@200..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={geistMono.variable}>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://aswbcoaching.com"),
  title: "ASWB Mastery | Premium Coaching for LCSW, LMSW, BSW",
  description: "Your dedicated platform for ASWB exam preparation and coaching. Master the new ASWB exam format with proven strategies, tools, and personalized tutoring.",
  keywords: [
    "ASWB", "LCSW", "LMSW", "LSW", "LCSW-C", "BSW", "MSW", "ASWB exam", 
    "ASWB test prep", "ASWB coaching", "ASWB tutoring", "Social work exam prep",
    "LCSW exam strategies", "LMSW study guide", "proven ASWB strategies", 
    "ASWB tools", "ASWB new format update", "clinical social work exam",
    "master social work exam", "social work licensing exam", "ASWB practice test",
    "ASWB exam questions", "LCSW prep course", "LMSW prep course", "ASWB passing score",
    "how to pass ASWB exam", "ASWB 2024 update", "ASWB 2025 format"
  ],
  openGraph: {
    title: "ASWB Mastery | Premium Coaching",
    description: "Master the new ASWB exam format with proven strategies, tools, and personalized tutoring for LCSW, LMSW, and BSW.",
    url: "https://aswbcoaching.com",
    siteName: "ASWB Mastery",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ASWB Mastery | Premium Coaching",
    description: "Master the new ASWB exam format with proven strategies, tools, and personalized tutoring for LCSW, LMSW, and BSW.",
  },
  alternates: {
    canonical: "https://aswbcoaching.com",
  },
  verification: {
    google: "VOcw1F29UI390UJpBfymQZIs-iOsk5m7zhgFZ4g4yjs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={inter.className}>
        {children}
        <FloatingChatWidget />
      </body>
    </html>
  );
}

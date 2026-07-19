import type { Metadata } from "next";
import "./globals.css";
import LoadingScreenWrapper from "@/components/LoadingScreenWrapper";

export const metadata: Metadata = {
  title: "Road Safety Dar es Salaam — Real-time Accident Intelligence",
  description: "Crowdsourced accident hotspot intelligence for Tanzania's commercial capital.",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="theme-color" content="#1E3A5F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Road Safety Dar" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js" defer />
      </head>
      <body>
        <LoadingScreenWrapper />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F1 TrackMate",
  description: "Live Formula 1 driver standings and latest race results.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

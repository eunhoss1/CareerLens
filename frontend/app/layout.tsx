import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CareerLens",
  description: "CareerLens recommendation prototype"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

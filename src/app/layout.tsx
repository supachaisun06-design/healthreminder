import type { Metadata } from "next";
import { Noto_Sans_Thai, Inter } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-noto",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Health Reminder | Dashboard",
  description: "Modern Health Tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${notoSansThai.variable} ${inter.variable} font-sans antialiased bg-gray-50 text-gray-900`}
      >
        {children}
      </body>
    </html>
  );
}

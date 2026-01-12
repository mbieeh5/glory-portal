import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glory Cell & Glory Service",
  description:
    "Glory Cell menyediakan layanan servis profesional dan penjualan sparepart berkualitas untuk berbagai kebutuhan elektronik dan perangkat Anda. Cepat, terpercaya, dan bergaransi. Juga menyediakan berbagaimacam kuota internet Grosir atau Retail.",
  keywords: [
    "servis HP",
    "sparepart elektronik",
    "servis komputer",
    "servis laptop",
    "GloryService",
    "layanan perbaikan elektronik",
    "Glory Cell",
    "Glorycell",
    "Konter HP",
    "Glory Sukahati",
    "Glory Cikaret",
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

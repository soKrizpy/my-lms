import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "bits2bytes — Platform Belajar Coding Terstruktur",
  description: "Kuasai coding dari nol hingga siap kerja. Kurikulum terstruktur, mentor berpengalaman, quiz interaktif, dan sistem belajar yang terbukti menghasilkan developer profesional.",
  keywords: ["belajar coding", "kursus pemrograman", "web development", "bits2bytes", "belajar javascript", "bootcamp coding indonesia"],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.webp", type: "image/webp" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
  openGraph: {
    title: "bits2bytes — Platform Belajar Coding Terstruktur",
    description: "Dari Bits ke Bytes, dari Pemula ke Developer Profesional.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

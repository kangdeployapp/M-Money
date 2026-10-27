import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { DataStoreProvider } from "@/components/DataStoreContext";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WealthPilot - Financial Navigator",
  description: "ระบบบริหารการเงินส่วนบุคคล วางแผนปลดหนี้ Avalanche/Snowball และที่ปรึกษา AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WealthPilot",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${kanit.variable} dark`}>
      <body className="min-h-screen bg-[#090d16] font-sans text-slate-100 antialiased pb-20 md:pb-8 selection:bg-sky-500/30 selection:text-sky-200">
        <DataStoreProvider>
          <Navbar />
          <main className="container mx-auto px-4 sm:px-6 pt-6">{children}</main>
        </DataStoreProvider>
      </body>
    </html>
  );
}

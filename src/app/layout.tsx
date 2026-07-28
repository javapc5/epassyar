import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import PageProgress from "@/components/PageProgress";
import BottomTabBar from "@/components/BottomTabBar";
import { CartProvider } from "@/components/CartProvider";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://epassyar.com"),
  title: "ePassyar · Bagulin, La Union — Smart Tourism",
  description:
    "ePassyar is the official smart tourism platform of LGU Bagulin, La Union. Plan your visit, book guided tours to waterfalls, heritage caves, hanging bridges and viewdecks.",
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${inter.variable}`}>
      <body>
        <CartProvider>
          <PageProgress />
          {/* pb clears the fixed mobile tab bar; removed at lg where it's hidden */}
          <div className="pb-16 lg:pb-0">{children}</div>
          <BottomTabBar />
        </CartProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MetisProvider } from "@/providers/metis-provider";
import { MetisWidget } from "@/components/metis/metis-widget";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Zuma Stock Dashboard",
  description: "Real-time inventory dashboard for Zuma Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <head>
        <style>{`
          vercel-live-feedback,
          vercel-toolbar,
          #__vercel-toolbar-portal,
          [data-vercel-toolbar] {
            display: none !important;
          }
        `}</style>
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <MetisProvider>
          {children}
          <MetisWidget />
        </MetisProvider>
      </body>
    </html>
  );
}

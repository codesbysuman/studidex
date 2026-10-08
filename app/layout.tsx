import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Header from "@/components/header";
import { Navigation } from "@/components/navigation";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Studidex",
  description: "Your academic life, indexed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Navigation />


        <div className="md:hidden">
          <Header />
        </div>
        <div className="md:pl-[220px]">
          {children}
        </div>
      </body>
    </html>
  );
}
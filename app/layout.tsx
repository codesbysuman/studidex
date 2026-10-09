import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Header from "@/components/header";
import { Navigation } from "@/components/navigation";
import { ThemeProvider } from "@wrksz/themes/next";
import { RememberAiFab } from "@/components/remember-ai-fab";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studidex.vercel.app";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Studidex — Your Academic Life, Indexed",
    template: "%s | Studidex",
  },
  description:
    "The personal academic workspace and study index. Track coursework, timetables, syllabus mastery, study actions, exam preparation, and updates in one connected space.",
  applicationName: "Studidex",
  authors: [{ name: "Studidex", url: siteUrl }],
  creator: "Studidex",
  publisher: "Studidex",
  generator: "Next.js",
  keywords: [
    "Studidex",
    "academic index",
    "student dashboard",
    "study timetable",
    "syllabus tracker",
    "exam preparation",
    "college productivity",
    "course index",
    "homework manager",
    "academic operating system",
  ],
  category: "Education & Productivity",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "./",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Studidex — Your Academic Life, Indexed",
    description:
      "The personal academic workspace and study index. Connect your schedule, syllabus progress, and deadlines in one intuitive space.",
    url: siteUrl,
    siteName: "Studidex",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Studidex — Your Academic Life, Indexed",
    description:
      "The personal academic workspace and study index. Track coursework, timetables, syllabus mastery, study actions, and exams.",
    creator: "@studidex",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Studidex",
  url: siteUrl,
  description:
    "The personal academic workspace and study index. Track coursework, timetables, syllabus mastery, study actions, exam preparation, and updates in one connected space.",
  applicationCategory: "EducationalApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Personal Academic Study Dashboard",
    "Syllabus and Module Mastery Progress",
    "Smart Weekly Agendas and Class Schedules",
    "Action Deliverables and Assignment Deadlines",
    "Subject Material Indexing and Reference Library",
    "Exam Preparation Cockpit and Mock Drills",
    "Real-time Academic Updates and Notices",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute={["class", "data-theme"]}
          storage="hybrid"
          defaultTheme="system"
          enableSystem
        >
          <Navigation />
          <Header />
          <div className="md:pl-55">{children}</div>
          <RememberAiFab />
        </ThemeProvider>
      </body>
    </html>
  );
}
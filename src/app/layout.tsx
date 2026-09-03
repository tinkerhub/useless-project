import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Splash from "./splash";
import SiteNav from "./site-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const drowner = localFont({
  src: "../fonts/Drowner.otf",
  variable: "--font-drowner",
});

const jrk = localFont({
  src: "../fonts/JRK.otf",
  variable: "--font-jrk",
});

const nanumPen = localFont({
  src: "../fonts/NanumPenScript-Regular.ttf",
  variable: "--font-nanum-pen",
});

const helvetica = localFont({
  src: [
    { path: "../fonts/Helvetica.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Helvetica-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-helvetica",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://useless.tinkerhub.org"),
  title: {
    default: "Useless Projects 3.0 | TinkerHub",
    template: "%s | Useless Projects 3.0",
  },
  description:
    "TinkerHub's overnight make-a-thon — campus makers build brilliantly impractical tech, just for the joy of making.",
  keywords: [
    "Useless Projects",
    "Useless Projects 3.0",
    "TinkerHub",
    "TinkerHub Useless Projects",
    "TinkerHub makeathon",
    "TinkerHub campus community",
    "TinkerHub RIT",
    "Kerala hackathon",
    "student makeathon Kerala",
  ],
  authors: [{ name: "TinkerHub" }],
  creator: "TinkerHub",
  publisher: "TinkerHub Foundation",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Useless Projects 3.0 | TinkerHub",
    description:
      "TinkerHub's overnight make-a-thon: build something brilliantly impractical, just for the joy of making.",
    url: "https://useless.tinkerhub.org",
    siteName: "Useless Projects",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Useless Projects 3.0 | TinkerHub",
    description:
      "TinkerHub's overnight make-a-thon for brilliantly impractical tech. Exclusive to the Campus Community.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${drowner.variable} ${jrk.variable} ${nanumPen.variable} ${helvetica.variable} h-full snap-y snap-mandatory scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Splash>{children}</Splash>
        <SiteNav />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { paletteScript } from "@/lib/palettes";
import { siteDescription, siteName, siteTitle, siteUrl } from "@/lib/site";
import "./globals.css";

// Title, description and preview card for Google and for shared links
// (WhatsApp, Slack, LinkedIn, X). The preview image is app/opengraph-image.tsx.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: `%s · ${siteName}` },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "job tracker",
    "job application tracker",
    "job search",
    "kanban",
    "career",
    "interview",
    "vagas",
    "candidaturas",
  ],
  authors: [{ name: "Gabriella Garcia", url: "https://github.com/gabsgarcia" }],
  creator: "Gabriella Garcia",
  openGraph: {
    type: "website",
    siteName,
    title: siteTitle,
    description: siteDescription,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0c17" },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved color scheme before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: paletteScript }} />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

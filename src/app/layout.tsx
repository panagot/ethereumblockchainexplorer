import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ethereum Explorer - The Best Ethereum Blockchain Explorer",
  description: "Easy to Read Transaction Analysis with AI-Powered Explanations, MEV Detection, and Comprehensive Educational Content",
  keywords: ["ethereum", "blockchain", "explorer", "transaction", "defi", "mev", "education", "ai", "web3"],
  authors: [{ name: "Ethereum Explorer Team" }],
  openGraph: {
    title: "Ethereum Explorer - The Best Ethereum Blockchain Explorer",
    description: "Easy to Read Transaction Analysis with AI-Powered Explanations, MEV Detection, and Comprehensive Educational Content",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ethereum Explorer - The Best Ethereum Blockchain Explorer",
    description: "Easy to Read Transaction Analysis with AI-Powered Explanations, MEV Detection, and Comprehensive Educational Content",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

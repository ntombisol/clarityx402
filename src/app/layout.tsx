import type { Metadata } from "next";
import { Inter, Syne, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { GeometricBackground } from "@/components/layout/geometric-background";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Clarityx402 - x402 Intelligence Layer",
  description:
    "Quality and price intelligence for x402 endpoints. Find the best endpoint for any task.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23050508' width='100' height='100' rx='20'/><text x='50' y='68' font-size='50' font-family='system-ui' font-weight='bold' fill='%2306b6d4' text-anchor='middle'>C</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col bg-background`}
      >
        {/* Animated background layers */}
        <div className="fixed inset-0 bg-circuit opacity-50 pointer-events-none" />
        <div className="fixed inset-0 bg-mesh pointer-events-none" />
        <GeometricBackground />
        <Analytics />      
        {/* Main content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 container-neural py-8">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-border/50 py-8 mt-auto">
      {/* Subtle gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container-neural">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
              <span className="text-primary font-display text-xs">C</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Built by{" "}
              <a
                href="https://tonbistudio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors duration-300"
              >
                Tonbi Studio
              </a>
            </span>
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/coinbase/x402"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              x402 Protocol
            </a>
            <a
              href="https://github.com/ntombisol/clarityx402"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              GitHub
            </a>
          </div>
        </div>

        {/* Bottom: Tech decoration */}
        <div className="mt-6 pt-6 border-t border-border/30 flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse-dot" />
          <span className="font-mono">SYSTEM ONLINE</span>
          <span className="mx-2">|</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}

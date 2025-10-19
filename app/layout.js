import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "PlayBlocks — AI Powered Time Blocking",
  description:
    "Drop in your classes, habits, buffers and deadlines. PlayBlocks builds an intelligent schedule with smart breaks and exports it back to your calendar.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-slate-700`}>
        <header className="sticky top-0 z-50 border-b border-pink-200/60 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-violet-900">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 via-violet-200 to-sky-200 text-sm font-bold text-violet-900 shadow-lg">PB</span>
              <span>PlayBlocks</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <Link href="/plan" className="transition hover:text-violet-900">Planner</Link>
              <Link
                href="/#features"
                className="hidden transition hover:text-violet-900 sm:inline"
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                className="hidden transition hover:text-violet-900 md:inline"
              >
                How it works
              </Link>
              <Link
                href="/plan"
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-300 via-violet-200 to-sky-200 px-4 py-2 text-violet-900 shadow-lg shadow-rose-200/70 transition hover:-translate-y-0.5"
              >
                Launch Planner
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-pink-200/60 bg-white/70">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} PlayBlocks. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="mailto:hello@playblocks.ai" className="transition hover:text-violet-900">Contact</a>
              <a href="https://nextjs.org" target="_blank" rel="noreferrer" className="transition hover:text-violet-900">
                Built on Next.js
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

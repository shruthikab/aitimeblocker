import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from '../providers';
import AuthHeader from '../components/AuthHeader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PlayBlocks - Smart Calendar & Task Planner",
  description: "Smart calendar management and AI-powered task scheduling",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <AuthHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
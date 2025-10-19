"use client";
import Image from "next/image";
import ImportStep from "../components/ImportStep";

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <main className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mt-8 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
            PlayBlocks
          </h1>
          <p className="text-xl text-gray-600 mb-2">AI-Powered Study Scheduler</p>
          <p className="text-sm text-gray-500">Paste your syllabus, get your schedule automatically ✨</p>
        </div>

        {/* Smart Scheduler Component */}
        <div className="w-full flex justify-center">
          <ImportStep />
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 flex gap-6 flex-wrap items-center justify-center text-sm">
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-gray-600"
            href="https://nextjs.org/learn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/file.svg"
              alt="File icon"
              width={16}
              height={16}
            />
            Learn
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-gray-600"
            href="/plan"
          >
            <Image
              aria-hidden
              src="/window.svg"
              alt="Window icon"
              width={16}
              height={16}
            />
            View Calendar
          </a>
        </footer>
      </main>
    </div>
  );
}


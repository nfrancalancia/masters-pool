import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Masters Pool 2026",
  description: "Pick 6 golfers. Drop worst 2. Lowest score wins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={playfair.variable}>
      <body className="antialiased min-h-screen bg-[#f9f6ef]">
        <NavBar />

        {/* Main content */}
        <main className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-200/60 mt-12">
          Masters Pool 2026 — Not affiliated with Augusta National or the Masters Tournament
        </footer>
      </body>
    </html>
  );
}

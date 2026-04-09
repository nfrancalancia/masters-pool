import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./components/NavBar";

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
    <html lang="en">
      <body className="antialiased min-h-screen">
        <NavBar />

        {/* Main content */}
        <main className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-200 mt-12">
          Masters Pool 2026 — Not affiliated with Augusta National or the Masters Tournament
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

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
        {/* Header */}
        <header className="masters-gradient text-white shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f2c75c] flex items-center justify-center text-[#006747] font-bold text-lg">
                M
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Masters Pool 2026</h1>
                <p className="text-xs text-green-200 tracking-wide">Augusta National | Apr 10-13</p>
              </div>
            </a>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/" className="hover:text-[#f2c75c] transition-colors">Leaderboard</a>
              <a href="/picks" className="hover:text-[#f2c75c] transition-colors">My Picks</a>
              <a href="/admin" className="hover:text-[#f2c75c] transition-colors">Admin</a>
              <a href="/login" className="bg-[#f2c75c] text-[#006747] px-3 py-1.5 rounded font-semibold hover:bg-yellow-300 transition-colors">
                Sign In
              </a>
            </nav>
          </div>
        </header>

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

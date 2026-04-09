"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const [{ data: profile }, { data: settings }] = await Promise.all([
          supabase.from("profiles").select("display_name, is_commissioner").eq("id", user.id).single(),
          supabase.from("pool_settings").select("commissioner_id").limit(1),
        ]);

        if (profile) {
          setDisplayName(profile.display_name);
          setIsCommissioner(
            profile.is_commissioner || settings?.[0]?.commissioner_id === user.id
          );
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="masters-gradient text-white shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#f2c75c] flex items-center justify-center text-[#006747] font-bold text-base flex-shrink-0">
            M
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight leading-tight">Masters Pool 2026</h1>
            <p className="text-[10px] text-green-200 tracking-wide">Augusta National | Apr 10-13</p>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <a href="/" className="hover:text-[#f2c75c] transition-colors">Leaderboard</a>
          <a href="/picks" className="hover:text-[#f2c75c] transition-colors">My Picks</a>
          {isCommissioner && (
            <a href="/admin" className="hover:text-[#f2c75c] transition-colors">Admin</a>
          )}
          {loading ? null : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-[#f2c75c] text-[#006747] px-3 py-1.5 rounded font-semibold hover:bg-yellow-300 transition-colors"
              >
                <span className="max-w-[100px] truncate">{displayName || "Account"}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <a
              href="/login"
              className="bg-[#f2c75c] text-[#006747] px-3 py-1.5 rounded font-semibold hover:bg-yellow-300 transition-colors"
            >
              Sign In
            </a>
          )}
        </nav>

        {/* Mobile nav */}
        <div className="sm:hidden flex items-center gap-2">
          {!loading && user && (
            <span className="text-xs text-green-200 max-w-[60px] truncate">{displayName}</span>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-white/20">
          <div className="px-4 py-3 space-y-1">
            <a href="/" className="block py-2.5 text-base font-semibold hover:text-[#f2c75c]">
              Leaderboard
            </a>
            <a href="/picks" className="block py-2.5 text-base font-semibold hover:text-[#f2c75c]">
              My Picks
            </a>
            {isCommissioner && (
              <a href="/admin" className="block py-2.5 text-base font-semibold hover:text-[#f2c75c]">
                Admin
              </a>
            )}
            <div className="border-t border-white/20 pt-2 mt-2">
              {user ? (
                <div>
                  <p className="text-xs text-green-200 mb-1">{user.email}</p>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left py-2.5 text-base font-semibold text-[#f2c75c]"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <a href="/login" className="block py-2.5 text-base font-semibold text-[#f2c75c]">
                  Sign In
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

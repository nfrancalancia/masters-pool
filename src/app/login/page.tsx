"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<"loading" | "signin" | "signup">("loading");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [poolLocked, setPoolLocked] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        window.location.href = "/picks";
        return;
      }

      // Check if pool is locked (to control whether signup is available)
      const { data: settings } = await supabase
        .from("pool_settings")
        .select("is_locked, entry_deadline")
        .limit(1);

      if (settings?.[0]) {
        const isLocked =
          settings[0].is_locked ||
          new Date(settings[0].entry_deadline) < new Date();
        setPoolLocked(isLocked);
      }

      setMode("signin");
    }
    init();
  }, [supabase]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Invalid email or password.");
      setLoading(false);
      return;
    }

    window.location.href = "/picks";
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split("@")[0] },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // Auto sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setMessage("Account created! You can now sign in.");
      setMode("signin");
      setLoading(false);
      return;
    }

    window.location.href = "/picks";
  }

  if (mode === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[#006747] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-[#006747] mb-1">
          {mode === "signin" ? "Sign In" : "Join the Pool"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {mode === "signin"
            ? "Enter your email and password."
            : "Create your account and team name."}
        </p>

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006747] focus:border-transparent"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006747] focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006747] text-white py-2.5 rounded-md font-semibold hover:bg-[#004d35] transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team / Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Shown on the leaderboard"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006747] focus:border-transparent"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006747] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006747] focus:border-transparent"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006747] text-white py-2.5 rounded-md font-semibold hover:bg-[#004d35] transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "Create Account"}
            </button>
          </form>
        )}

        {message && (
          <p className="mt-4 text-sm text-center text-red-600 bg-red-50 rounded p-2">
            {message}
          </p>
        )}

        <div className="mt-4 text-center">
          {mode === "signin" ? (
            !poolLocked && (
              <button
                onClick={() => { setMode("signup"); setMessage(""); }}
                className="text-sm text-[#006747] underline hover:no-underline"
              >
                New here? Create an account
              </button>
            )
          ) : (
            <button
              onClick={() => { setMode("signin"); setMessage(""); }}
              className="text-sm text-[#006747] underline hover:no-underline"
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

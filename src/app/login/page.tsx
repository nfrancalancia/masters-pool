"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [step, setStep] = useState<"email" | "name">("email");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Try signing in first (existing user)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: email,
    });

    if (!error) {
      // Existing user — go straight in
      window.location.href = "/picks";
      return;
    }

    // No account yet — ask for their name
    setStep("name");
    setLoading(false);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password: email,
      options: {
        data: { display_name: displayName || email.split("@")[0] },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // Auto sign in after creating account
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: email,
    });

    if (signInError) {
      setMessage(
        "Account created but sign-in failed. Please try entering your email again."
      );
      setStep("email");
      setLoading(false);
      return;
    }

    window.location.href = "/picks";
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-[#006747] mb-1">
          {step === "email" ? "Welcome to the Pool" : "One more thing..."}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {step === "email"
            ? "Enter your email to sign in or join."
            : "Since you're new, tell us your name for the leaderboard."}
        </p>

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006747] text-white py-2.5 rounded-md font-semibold hover:bg-[#004d35] transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2">
              {email}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name (shown on leaderboard)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006747] focus:border-transparent"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006747] text-white py-2.5 rounded-md font-semibold hover:bg-[#004d35] transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "Join the Pool"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setMessage("");
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Back
            </button>
          </form>
        )}

        {message && (
          <p className="mt-4 text-sm text-center text-red-600 bg-red-50 rounded p-2">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

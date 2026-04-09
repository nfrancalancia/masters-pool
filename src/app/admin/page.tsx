"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [poolSettings, setPoolSettings] = useState<any>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [scoreStatus, setScoreStatus] = useState("");

  const supabase = createClient();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setUser(user);

    const [{ data: prof }, { data: settings }, { data: profiles }, { data: picks }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("pool_settings").select("*").limit(1),
        supabase.from("profiles").select("*"),
        supabase.from("picks").select("user_id"),
      ]);

    setProfile(prof);

    if (settings?.[0]) {
      setPoolSettings(settings[0]);
      setInviteCode(settings[0].invite_code || "");
    }

    // Count picks per user
    const pickCounts = new Map<string, number>();
    (picks || []).forEach((p: any) => {
      pickCounts.set(p.user_id, (pickCounts.get(p.user_id) || 0) + 1);
    });

    const parts = (profiles || []).map((p: any) => ({
      ...p,
      pickCount: pickCounts.get(p.id) || 0,
    }));
    setParticipants(parts);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function claimCommissioner() {
    if (!user || !poolSettings) return;
    const { error } = await supabase
      .from("pool_settings")
      .update({ commissioner_id: user.id })
      .eq("id", poolSettings.id);

    if (!error) {
      await supabase
        .from("profiles")
        .update({ is_commissioner: true })
        .eq("id", user.id);
      setMessage("You are now the commissioner!");
      loadData();
    } else {
      setMessage("Error: " + error.message);
    }
  }

  async function toggleLock() {
    if (!poolSettings) return;
    const { error } = await supabase
      .from("pool_settings")
      .update({ is_locked: !poolSettings.is_locked })
      .eq("id", poolSettings.id);

    if (!error) {
      setMessage(poolSettings.is_locked ? "Pool unlocked!" : "Pool locked!");
      loadData();
    }
  }

  async function updateDeadline(newDeadline: string) {
    if (!poolSettings) return;
    const { error } = await supabase
      .from("pool_settings")
      .update({ entry_deadline: new Date(newDeadline).toISOString() })
      .eq("id", poolSettings.id);

    if (!error) {
      setMessage("Deadline updated!");
      loadData();
    }
  }

  async function refreshScoresNow() {
    setScoreStatus("Fetching scores from ESPN...");
    try {
      const res = await fetch("/api/scores");
      const data = await res.json();
      setScoreStatus(
        data.success
          ? `Updated ${data.updated} golfers. State: ${data.tournamentState}`
          : `Error: ${data.error}`
      );
    } catch {
      setScoreStatus("Failed to fetch scores.");
    }
  }

  const isCommissioner =
    poolSettings?.commissioner_id === user?.id || profile?.is_commissioner;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[#006747] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#006747]">Pool Admin</h2>

      {/* Commissioner claim */}
      {!poolSettings?.commissioner_id && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 mb-2">
            No commissioner set. Claim this role to manage the pool.
          </p>
          <button
            onClick={claimCommissioner}
            className="bg-[#006747] text-white px-4 py-2 rounded text-sm font-semibold"
          >
            Claim Commissioner Role
          </button>
        </div>
      )}

      {isCommissioner && (
        <>
          {/* Invite Code */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-[#006747] mb-2">Invite Link</h3>
            <p className="text-sm text-gray-500 mb-2">
              Share this link with your friends to join the pool:
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={typeof window !== "undefined" ? `${window.location.origin}/login` : ""}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/login`);
                  setMessage("Link copied!");
                }}
                className="bg-[#006747] text-white px-3 py-2 rounded text-sm font-semibold whitespace-nowrap"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Pool code: {inviteCode}</p>
          </div>

          {/* Pool Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <h3 className="font-semibold text-[#006747]">Pool Controls</h3>

            {/* Lock toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Lock Picks</p>
                <p className="text-xs text-gray-500">
                  {poolSettings?.is_locked
                    ? "Pool is locked. No one can submit or change picks."
                    : "Pool is open. Users can submit picks."}
                </p>
              </div>
              <button
                onClick={toggleLock}
                className={`px-4 py-2 rounded text-sm font-semibold ${
                  poolSettings?.is_locked
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {poolSettings?.is_locked ? "Unlock Pool" : "Lock Pool"}
              </button>
            </div>

            {/* Deadline */}
            <div>
              <p className="text-sm font-medium mb-1">Entry Deadline</p>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  defaultValue={
                    poolSettings?.entry_deadline
                      ? new Date(poolSettings.entry_deadline).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) => updateDeadline(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Current:{" "}
                {poolSettings?.entry_deadline
                  ? new Date(poolSettings.entry_deadline).toLocaleString()
                  : "Not set"}
              </p>
            </div>
          </div>

          {/* Score Refresh */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-[#006747] mb-2">Live Scores</h3>
            <p className="text-sm text-gray-500 mb-2">
              Scores auto-refresh every 60 seconds on the leaderboard.
              You can also trigger a manual refresh here.
            </p>
            <button
              onClick={refreshScoresNow}
              className="bg-[#006747] text-white px-4 py-2 rounded text-sm font-semibold"
            >
              Refresh Scores Now
            </button>
            {scoreStatus && (
              <p className="mt-2 text-sm text-gray-600">{scoreStatus}</p>
            )}
          </div>
        </>
      )}

      {/* Participants */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-[#006747]">
            Participants ({participants.length})
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-center">Picks</th>
              <th className="px-4 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id} className="border-b border-gray-100">
                <td className="px-4 py-2 font-medium">{p.display_name}</td>
                <td className="px-4 py-2 text-gray-500">{p.email}</td>
                <td className="px-4 py-2 text-center">{p.pickCount}/6</td>
                <td className="px-4 py-2 text-center">
                  {p.pickCount === 6 ? (
                    <span className="text-green-600 font-semibold">Done</span>
                  ) : (
                    <span className="text-yellow-600">Pending</span>
                  )}
                </td>
              </tr>
            ))}
            {participants.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  No participants yet. Share the invite link!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {message && (
        <div className="fixed bottom-4 right-4 bg-[#006747] text-white px-4 py-2 rounded shadow-lg text-sm">
          {message}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Golfer {
  id: number;
  name: string;
  espn_id: string | null;
  tier: number;
  total_score: number | null;
  status: string;
  odds: string | null;
}

import { golferImageUrl } from "@/lib/golfer-images";

interface PoolSettings {
  id: number;
  entry_deadline: string;
  is_locked: boolean;
  total_tiers: number;
  tiebreaker_enabled: boolean;
}

export default function PicksPage() {
  const [user, setUser] = useState<any>(null);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [poolSettings, setPoolSettings] = useState<PoolSettings | null>(null);
  const [selections, setSelections] = useState<Record<number, number>>({}); // tier -> golfer_id
  const [tiebreaker, setTiebreaker] = useState<string>("");
  const [existingPicks, setExistingPicks] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setUser(user);

    // Load pool settings, golfers, existing picks
    const [
      { data: settings },
      { data: golfersData },
      { data: picks },
      { data: tb },
    ] = await Promise.all([
      supabase.from("pool_settings").select("*").limit(1),
      supabase.from("golfers").select("*").order("name"),
      supabase.from("picks").select("*").eq("user_id", user.id),
      supabase.from("tiebreakers").select("*").eq("user_id", user.id),
    ]);

    if (settings?.[0]) setPoolSettings(settings[0]);
    if (golfersData) setGolfers(golfersData);
    if (picks) {
      setExistingPicks(picks);
      const sel: Record<number, number> = {};
      picks.forEach((p: any) => { sel[p.tier] = p.golfer_id; });
      setSelections(sel);
    }
    if (tb?.[0]) setTiebreaker(tb[0].predicted_winning_score.toString());

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isLocked = poolSettings
    ? poolSettings.is_locked || new Date(poolSettings.entry_deadline) < new Date()
    : false;

  const tierGroups: Record<number, Golfer[]> = {};
  golfers.forEach((g) => {
    if (!tierGroups[g.tier]) tierGroups[g.tier] = [];
    tierGroups[g.tier].push(g);
  });

  const totalTiers = poolSettings?.total_tiers || 6;
  const allTiersFilled = Array.from({ length: totalTiers }, (_, i) => i + 1).every(
    (t) => selections[t]
  );

  async function handleSave() {
    if (!user || isLocked) return;
    setSaving(true);
    setMessage(null);

    try {
      // Delete existing picks for this user
      await supabase.from("picks").delete().eq("user_id", user.id);

      // Insert new picks
      const picksToInsert = Object.entries(selections).map(([tier, golferId]) => ({
        user_id: user.id,
        pool_id: poolSettings?.id || 1,
        tier: parseInt(tier),
        golfer_id: golferId,
      }));

      const { error: pickError } = await supabase.from("picks").insert(picksToInsert);
      if (pickError) throw pickError;

      // Upsert tiebreaker
      if (tiebreaker) {
        await supabase.from("tiebreakers").delete().eq("user_id", user.id);
        const { error: tbError } = await supabase.from("tiebreakers").insert({
          user_id: user.id,
          pool_id: poolSettings?.id || 1,
          predicted_winning_score: parseInt(tiebreaker),
        });
        if (tbError) throw tbError;
      }

      setMessage({ text: "Picks saved successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to save picks", type: "error" });
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[#006747] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#006747]">My Picks</h2>
        <p className="text-sm text-gray-500">
          Select 1 golfer from each tier. Your worst 2 scores will be dropped.
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          Odds updated after Round 1 — not live.
        </p>
        {isLocked && (
          <div className="mt-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">
            Picks are locked. The deadline has passed or the pool is locked by the commissioner.
          </div>
        )}
      </div>

      {/* Tier selections */}
      <div className="space-y-4">
        {Array.from({ length: totalTiers }, (_, i) => i + 1).map((tierNum) => {
          const tierGolfers = tierGroups[tierNum] || [];
          const selectedId = selections[tierNum];

          return (
            <div key={tierNum} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-[#006747] text-white px-4 py-2 flex items-center justify-between">
                <span className="font-semibold text-sm">Tier {tierNum}</span>
                <span className="text-xs text-green-200">{tierGolfers.length} golfers</span>
              </div>
              <div className="p-3">
                {tierGolfers.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No golfers in this tier yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {tierGolfers.map((golfer) => {
                      const isSelected = selectedId === golfer.id;
                      return (
                        <button
                          key={golfer.id}
                          disabled={isLocked}
                          onClick={() =>
                            setSelections((prev) => ({
                              ...prev,
                              [tierNum]: isSelected ? 0 : golfer.id,
                            }))
                          }
                          className={`text-left p-2 rounded-lg border text-sm transition-all flex items-center gap-2 ${
                            isSelected
                              ? "border-[#006747] bg-green-50 ring-2 ring-[#006747]"
                              : "border-gray-200 hover:border-gray-400"
                          } ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                            {golfer.espn_id ? (
                              <img
                                src={golferImageUrl(golfer.espn_id)}
                                alt={golfer.name}
                                className="w-full h-full object-cover object-top"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">${golfer.name.charAt(0)}</div>`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                                {golfer.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate text-xs">{golfer.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {golfer.odds && (
                                <span className="text-[10px] text-gray-400 font-mono">{golfer.odds}</span>
                              )}
                              {golfer.total_score !== null && (
                                <span className={`text-xs ${
                                  golfer.total_score < 0 ? "score-negative" : "text-gray-500"
                                }`}>
                                  {golfer.total_score === 0 ? "E" : golfer.total_score > 0 ? `+${golfer.total_score}` : golfer.total_score}
                                  {golfer.status !== "active" && (
                                    <span className="ml-1 text-red-500 uppercase">{golfer.status}</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tiebreaker */}
      {poolSettings?.tiebreaker_enabled && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-semibold text-[#006747] mb-1">
            Tiebreaker: Predicted Winning Score (total strokes)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            What will the winner&apos;s total score be? (e.g., 275 for -13 under par at Augusta, par 288)
          </p>
          <input
            type="number"
            value={tiebreaker}
            onChange={(e) => setTiebreaker(e.target.value)}
            disabled={isLocked}
            placeholder="e.g. 275"
            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006747] focus:border-transparent disabled:opacity-60"
          />
        </div>
      )}

      {/* Summary + Save */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-[#006747] mb-2">Your Selections</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {Array.from({ length: totalTiers }, (_, i) => i + 1).map((tierNum) => {
            const golferId = selections[tierNum];
            const golfer = golfers.find((g) => g.id === golferId);
            return (
              <div key={tierNum} className="text-sm">
                <span className="text-gray-400 font-mono">T{tierNum}:</span>{" "}
                <span className={golfer ? "font-semibold" : "text-gray-300"}>
                  {golfer ? golfer.name : "—"}
                </span>
              </div>
            );
          })}
        </div>

        {!isLocked && (
          <button
            onClick={handleSave}
            disabled={saving || !allTiersFilled}
            className="w-full sm:w-auto bg-[#006747] text-white px-8 py-2.5 rounded-md font-semibold hover:bg-[#004d35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : existingPicks.length > 0 ? "Update Picks" : "Submit Picks"}
          </button>
        )}

        {!allTiersFilled && !isLocked && (
          <p className="mt-2 text-xs text-gray-400">
            Select a golfer from every tier to submit.
          </p>
        )}

        {message && (
          <p
            className={`mt-3 text-sm rounded p-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function InfoPage() {
  const [poolSettings, setPoolSettings] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadInfo() {
      const [{ data: settings }, { data: profiles }] = await Promise.all([
        supabase.from("pool_settings").select("*").limit(1),
        supabase.from("profiles").select("id"),
      ]);

      if (settings?.[0]) setPoolSettings(settings[0]);
      if (profiles) setParticipantCount(profiles.length);
      setLoading(false);
    }
    loadInfo();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[#006747] border-t-transparent rounded-full" />
      </div>
    );
  }

  const isLocked = poolSettings
    ? poolSettings.is_locked || new Date(poolSettings.entry_deadline) < new Date()
    : false;

  const deadline = poolSettings?.entry_deadline
    ? new Date(poolSettings.entry_deadline)
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-[#006747]">Pool Info</h2>

      {/* Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="font-semibold text-[#006747] mb-3">Pool Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Picks</span>
            <span className={`text-sm font-semibold ${isLocked ? "text-red-600" : "text-green-600"}`}>
              {isLocked ? "Locked" : "Open"}
            </span>
          </div>
          {deadline && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Deadline</span>
              <span className="text-sm font-semibold text-gray-900">
                {deadline.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Participants</span>
            <span className="text-sm font-semibold text-gray-900">{participantCount}</span>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="font-semibold text-[#006747] mb-3">How It Works</h3>
        <div className="space-y-4 text-sm text-gray-700">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#006747] text-white flex items-center justify-center text-xs font-bold">1</span>
            <div>
              <p className="font-semibold text-gray-900">Pick 6 Golfers</p>
              <p className="text-gray-500 mt-0.5">
                Choose 1 golfer from each of the 6 tiers. Tiers are based on betting odds — Tier 1 has the favorites, Tier 6 the longshots.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#006747] text-white flex items-center justify-center text-xs font-bold">2</span>
            <div>
              <p className="font-semibold text-gray-900">Drop Your Worst 2</p>
              <p className="text-gray-500 mt-0.5">
                Your 2 worst-scoring golfers are automatically dropped. Only your best 4 count toward your total.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#006747] text-white flex items-center justify-center text-xs font-bold">3</span>
            <div>
              <p className="font-semibold text-gray-900">Lowest Score Wins</p>
              <p className="text-gray-500 mt-0.5">
                Scores are relative to par. The player with the lowest combined score from their 4 counting golfers wins the pool.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#006747] text-white flex items-center justify-center text-xs font-bold">4</span>
            <div>
              <p className="font-semibold text-gray-900">Missed Cut Penalty</p>
              <p className="text-gray-500 mt-0.5">
                If one of your golfers misses the cut, withdraws, or is disqualified, they receive a +{poolSettings?.missed_cut_penalty || 8} stroke penalty per missed round.
              </p>
            </div>
          </div>

          {poolSettings?.tiebreaker_enabled && (
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#006747] text-white flex items-center justify-center text-xs font-bold">5</span>
              <div>
                <p className="font-semibold text-gray-900">Tiebreaker</p>
                <p className="text-gray-500 mt-0.5">
                  Predict the winning golfer&apos;s total strokes (e.g., 275). Closest prediction breaks any ties.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scoring Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="font-semibold text-[#006747] mb-3">Scoring Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 text-gray-500">Golfers per team</td>
                <td className="py-2 text-right font-semibold">{poolSettings?.total_tiers || 6}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Picks per tier</td>
                <td className="py-2 text-right font-semibold">{poolSettings?.picks_per_tier || 1}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Scores dropped</td>
                <td className="py-2 text-right font-semibold">{poolSettings?.drop_count || 2}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Missed cut penalty</td>
                <td className="py-2 text-right font-semibold">+{poolSettings?.missed_cut_penalty || 8} per round</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Tiebreaker</td>
                <td className="py-2 text-right font-semibold">{poolSettings?.tiebreaker_enabled ? "Yes" : "No"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      {!isLocked && (
        <div className="text-center">
          <a
            href="/picks"
            className="inline-block bg-[#006747] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#004d35] transition-colors"
          >
            Make Your Picks
          </a>
        </div>
      )}
    </div>
  );
}

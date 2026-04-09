"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateLeaderboard, formatScore, type UserResult, type Golfer } from "@/lib/scoring";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [tournamentState, setTournamentState] = useState<string>("pre");

  const supabase = createClient();

  const refreshScores = useCallback(async () => {
    try {
      const scoreRes = await fetch("/api/scores");
      const scoreData = await scoreRes.json();
      if (scoreData.tournamentState) {
        setTournamentState(scoreData.tournamentState);
      }
    } catch (err) {
      console.error("Score refresh error:", err);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    const [
      { data: golfers },
      { data: picks },
      { data: tiebreakers },
      { data: profiles },
      { data: poolSettings },
    ] = await Promise.all([
      supabase.from("golfers").select("*"),
      supabase.from("picks").select("*"),
      supabase.from("tiebreakers").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("pool_settings").select("*").limit(1),
    ]);

    if (!golfers || !picks || !profiles || !poolSettings?.[0]) {
      setLoading(false);
      return;
    }

    const settings = {
      drop_count: poolSettings[0].drop_count,
      missed_cut_penalty: poolSettings[0].missed_cut_penalty,
      tiebreaker_enabled: poolSettings[0].tiebreaker_enabled,
    };

    const results = calculateLeaderboard(
      picks as any[],
      tiebreakers || [],
      profiles as any[],
      golfers as Golfer[],
      settings
    );

    setLeaderboard(results);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refreshScores().then(() => loadLeaderboard());
    const interval = setInterval(() => {
      refreshScores().then(() => loadLeaderboard());
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshScores, loadLeaderboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#006747] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Pool Status Banner */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#006747]">Pool Leaderboard</h2>
          <p className="text-xs text-gray-500">
            Pick 6 golfers (1 per tier) | Drop worst 2 | Lowest total wins
          </p>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>
            Status:{" "}
            <span className={`font-semibold ${tournamentState === "in" ? "text-green-600" : "text-gray-600"}`}>
              {tournamentState === "pre" ? "Not Started" : tournamentState === "in" ? "LIVE" : "Final"}
            </span>
          </p>
          {lastUpdated && <p>Updated: {lastUpdated}</p>}
          <button
            onClick={() => { refreshScores().then(() => loadLeaderboard()); }}
            className="mt-1 text-[#006747] underline hover:no-underline"
          >
            Refresh
          </button>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No picks submitted yet.</p>
          <a href="/picks" className="mt-3 inline-block text-[#006747] font-semibold underline">
            Submit your picks
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#006747] text-white text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-12">Rank</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">Tiebreaker</th>
                <th className="px-4 py-3 text-center w-8" />
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => {
                const isExpanded = expandedUser === entry.userId;
                return (
                  <tr
                    key={entry.userId}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-green-50 transition-colors ${
                      i === 0 ? "bg-yellow-50" : ""
                    }`}
                    onClick={() => setExpandedUser(isExpanded ? null : entry.userId)}
                  >
                    <td className="px-4 py-3 font-bold text-[#006747]">
                      {entry.rank === 1 && i === 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#f2c75c] text-[#006747] text-xs font-bold">
                          {entry.rank}
                        </span>
                      ) : (
                        <span className="text-gray-600">{entry.rank}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{entry.displayName}</div>
                      {isExpanded && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {entry.golferScores.map((gs) => (
                            <div
                              key={gs.tier}
                              className={`rounded p-2 border text-xs ${
                                gs.isDropped
                                  ? "bg-gray-100 border-gray-200 dropped-golfer"
                                  : gs.isMissedCut
                                  ? "bg-red-50 border-red-200"
                                  : "bg-white border-gray-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 font-mono">T{gs.tier}</span>
                                <span
                                  className={`font-bold ${
                                    gs.effectiveScore < 0
                                      ? "score-negative"
                                      : gs.effectiveScore > 0
                                      ? "score-positive"
                                      : "score-even"
                                  }`}
                                >
                                  {formatScore(gs.effectiveScore)}
                                </span>
                              </div>
                              <div className="font-semibold mt-0.5 truncate">{gs.golfer.name}</div>
                              <div className="text-gray-400 mt-0.5">
                                {gs.golfer.thru || "-"}{" "}
                                {gs.isMissedCut && (
                                  <span className="text-red-500 font-semibold uppercase">
                                    {gs.golfer.status}
                                  </span>
                                )}
                                {gs.isDropped && <span className="text-gray-400">(dropped)</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-lg align-top">
                      <span
                        className={
                          entry.totalScore < 0
                            ? "score-negative"
                            : entry.totalScore > 0
                            ? "score-positive"
                            : "score-even"
                        }
                      >
                        {formatScore(entry.totalScore)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell align-top">
                      {entry.tiebreaker !== null ? entry.tiebreaker : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 align-top">
                      {isExpanded ? "\u25B2" : "\u25BC"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

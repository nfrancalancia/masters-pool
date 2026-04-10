"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateLeaderboard, formatScore, type UserResult, type Golfer } from "@/lib/scoring";

function golferImageUrl(espnId: string | null): string {
  if (!espnId) return "";
  return `https://a.espncdn.com/i/headshots/golf/players/full/${espnId}.png`;
}

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#006747]">Pool Leaderboard</h2>
            <p className="text-xs text-gray-500">
              Pick 6 | Drop worst 2 | Lowest total wins
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Odds shown are pre-tournament and do not update live.
            </p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>
              <span className={`font-semibold ${tournamentState === "in" ? "text-green-600" : "text-gray-600"}`}>
                {tournamentState === "pre" ? "Not Started" : tournamentState === "in" ? "LIVE" : "Final"}
              </span>
            </p>
            {lastUpdated && <p>{lastUpdated}</p>}
            <button
              onClick={() => { refreshScores().then(() => loadLeaderboard()); }}
              className="mt-1 text-[#006747] underline hover:no-underline"
            >
              Refresh
            </button>
          </div>
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
        <div className="space-y-3">
          {leaderboard.map((entry, i) => {
            const isExpanded = expandedUser === entry.userId;
            return (
              <div
                key={entry.userId}
                className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
                  i === 0 ? "border-[#f2c75c] ring-1 ring-[#f2c75c]" : "border-gray-200"
                }`}
              >
                {/* Main row — always visible */}
                <button
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-green-50/50 transition-colors"
                  onClick={() => setExpandedUser(isExpanded ? null : entry.userId)}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8">
                    {entry.rank === 1 && i === 0 ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#f2c75c] text-[#006747] text-sm font-bold">
                        {entry.rank}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-8 h-8 text-gray-500 font-bold text-sm">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{entry.displayName}</p>
                    <p className="text-xs text-gray-400">
                      {entry.golferScores.filter(gs => !gs.isDropped).length} counting
                      {entry.tiebreaker !== null && <span> | TB: {entry.tiebreaker}</span>}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <span
                      className={`text-xl font-bold ${
                        entry.totalScore < 0
                          ? "score-negative"
                          : entry.totalScore > 0
                          ? "score-positive"
                          : "score-even"
                      }`}
                    >
                      {formatScore(entry.totalScore)}
                    </span>
                  </div>

                  {/* Expand arrow */}
                  <div className="flex-shrink-0 text-gray-300">
                    <svg
                      className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded golfer details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-2 bg-gray-50/50">
                    {entry.golferScores.map((gs) => (
                      <div
                        key={gs.tier}
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          gs.isDropped
                            ? "opacity-40"
                            : gs.isMissedCut
                            ? "bg-red-50"
                            : "bg-white"
                        } ${gs.isDropped ? "" : "shadow-sm border border-gray-100"}`}
                      >
                        {/* Player image */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                          {gs.golfer.espn_id ? (
                            <img
                              src={golferImageUrl(gs.golfer.espn_id)}
                              alt={gs.golfer.name}
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                              {gs.golfer.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Player info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">{gs.golfer.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">T{gs.tier}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            {gs.golfer.odds && (
                              <span className="text-gray-400 font-mono text-[10px]">{gs.golfer.odds}</span>
                            )}
                            {gs.golfer.thru && (
                              <span>
                                {gs.golfer.thru === "F" ? "Final" : `Thru ${gs.golfer.thru}`}
                              </span>
                            )}
                            {gs.isMissedCut && (
                              <span className="text-red-500 font-semibold uppercase">
                                {gs.golfer.status === "cut" ? "MC" : gs.golfer.status}
                              </span>
                            )}
                            {gs.isDropped && <span className="text-gray-400 italic">Dropped</span>}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="flex-shrink-0">
                          <span
                            className={`text-base font-bold ${
                              gs.isDropped
                                ? "text-gray-400 line-through"
                                : gs.effectiveScore < 0
                                ? "score-negative"
                                : gs.effectiveScore > 0
                                ? "score-positive"
                                : "score-even"
                            }`}
                          >
                            {formatScore(gs.effectiveScore)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateLeaderboard, formatScore, type UserResult, type Golfer } from "@/lib/scoring";
import { golferImageUrl } from "@/lib/golfer-images";

type Tab = "pool" | "field";

interface ScorecardData {
  rounds: Array<{
    round: number;
    strokes: number;
    displayValue: string;
    holes: Array<{ hole: number; strokes: number; par: number; score: number }>;
  }>;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<UserResult[]>([]);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [tournamentState, setTournamentState] = useState<string>("pre");
  const [activeTab, setActiveTab] = useState<Tab>("pool");
  const [expandedGolferId, setExpandedGolferId] = useState<number | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [scorecardLoading, setScorecardLoading] = useState(false);

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
      { data: golferData },
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

    if (!golferData || !picks || !profiles || !poolSettings?.[0]) {
      setLoading(false);
      return;
    }

    setGolfers(golferData as Golfer[]);

    const settings = {
      drop_count: poolSettings[0].drop_count,
      missed_cut_penalty: poolSettings[0].missed_cut_penalty,
      tiebreaker_enabled: poolSettings[0].tiebreaker_enabled,
    };

    const results = calculateLeaderboard(
      picks as any[],
      tiebreakers || [],
      profiles as any[],
      golferData as Golfer[],
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

  async function toggleGolferExpand(golfer: Golfer) {
    if (expandedGolferId === golfer.id) {
      setExpandedGolferId(null);
      setScorecard(null);
      return;
    }

    setExpandedGolferId(golfer.id);
    setScorecard(null);
    setScorecardLoading(true);

    try {
      const res = await fetch(`/api/scorecard?espnId=${golfer.espn_id}`);
      if (res.ok) {
        const data = await res.json();
        setScorecard(data);
      }
    } catch (err) {
      console.error("Scorecard error:", err);
    }
    setScorecardLoading(false);
  }

  // Sort golfers by position for field view
  const sortedField = [...golfers].sort((a, b) => {
    const aPos = a.position ? parseInt(a.position) : 999;
    const bPos = b.position ? parseInt(b.position) : 999;
    if (aPos !== bPos) return aPos - bPos;
    return (a.total_score ?? 999) - (b.total_score ?? 999);
  });

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
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#006747]">Pool Leaderboard</h2>
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

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("pool")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
            activeTab === "pool"
              ? "bg-white text-[#006747] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pool Standings
        </button>
        <button
          onClick={() => setActiveTab("field")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
            activeTab === "field"
              ? "bg-white text-[#006747] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Tournament Field
        </button>
      </div>

      {/* Pool Standings Tab */}
      {activeTab === "pool" && (
        <>
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
                    {/* Main row */}
                    <button
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-green-50/50 transition-colors"
                      onClick={() => setExpandedUser(isExpanded ? null : entry.userId)}
                    >
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
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{entry.displayName}</p>
                        <p className="text-xs text-gray-400">
                          {entry.golferScores.filter(gs => !gs.isDropped).length} counting
                          {entry.tiebreaker !== null && <span> | TB: {entry.tiebreaker}</span>}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span
                          className={`text-xl font-bold ${
                            entry.totalScore < 0
                              ? "score-under-par"
                              : entry.totalScore > 0
                              ? "score-over-par"
                              : "score-even"
                          }`}
                        >
                          {formatScore(entry.totalScore)}
                        </span>
                      </div>
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
                            className={`rounded-lg ${
                              gs.isDropped
                                ? "opacity-40"
                                : gs.isMissedCut
                                ? "bg-red-50"
                                : "bg-white"
                            } ${gs.isDropped ? "" : "shadow-sm border border-gray-100"}`}
                          >
                            <button
                              onClick={() => toggleGolferExpand(gs.golfer)}
                              className="w-full flex items-center gap-3 p-2 text-left hover:bg-green-50/30 transition-colors rounded-lg"
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                                {gs.golfer.espn_id ? (
                                  <img
                                    src={golferImageUrl(gs.golfer.espn_id)}
                                    alt={gs.golfer.name}
                                    className="w-full h-full object-cover object-top"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                    {gs.golfer.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm truncate">{gs.golfer.name}</span>
                                  <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">T{gs.tier}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                  {gs.golfer.odds && <span className="text-gray-400 font-mono text-[10px]">{gs.golfer.odds}</span>}
                                  {gs.golfer.thru && <span>{gs.golfer.thru === "F" ? "Final" : `Thru ${gs.golfer.thru}`}</span>}
                                  {gs.isMissedCut && (
                                    <span className="text-red-500 font-semibold uppercase">
                                      {gs.golfer.status === "cut" ? "MC" : gs.golfer.status}
                                    </span>
                                  )}
                                  {gs.isDropped && <span className="text-gray-400 italic">Dropped</span>}
                                </div>
                              </div>
                              <span
                                className={`text-base font-bold flex-shrink-0 ${
                                  gs.isDropped
                                    ? "text-gray-400 line-through"
                                    : gs.effectiveScore < 0 ? "score-under-par"
                                    : gs.effectiveScore > 0 ? "score-over-par"
                                    : "score-even"
                                }`}
                              >
                                {formatScore(gs.effectiveScore)}
                              </span>
                              <svg
                                className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${expandedGolferId === gs.golfer.id ? "rotate-180" : ""}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Inline scorecard */}
                            {expandedGolferId === gs.golfer.id && (
                              <InlineScorecard
                                golfer={gs.golfer}
                                scorecard={scorecard}
                                loading={scorecardLoading}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tournament Field Tab */}
      {activeTab === "field" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Field header — desktop */}
          <div className="hidden sm:grid grid-cols-[2.5rem_1fr_3rem_3rem_3rem_3rem_3rem_3.5rem] gap-0 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-semibold uppercase">
            <span>Pos</span>
            <span>Player</span>
            <span className="text-center">R1</span>
            <span className="text-center">R2</span>
            <span className="text-center">R3</span>
            <span className="text-center">R4</span>
            <span className="text-center">Thru</span>
            <span className="text-right">Tot</span>
          </div>
          {/* Field header — mobile */}
          <div className="sm:hidden flex px-3 py-2 bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 font-semibold uppercase">
            <span className="w-8">Pos</span>
            <span className="flex-1">Player</span>
            <span className="w-10 text-center">Thru</span>
            <span className="w-10 text-right">Tot</span>
          </div>

          <div className="divide-y divide-gray-100">
            {sortedField.map((golfer, i) => {
              const isCut = golfer.status === "cut" || golfer.status === "wd" || golfer.status === "dq";
              const isExpanded = expandedGolferId === golfer.id;

              return (
                <div key={golfer.id} className={isCut && !isExpanded ? "opacity-50" : ""}>
                  {/* Row — desktop */}
                  <button
                    onClick={() => toggleGolferExpand(golfer)}
                    className="hidden sm:grid w-full grid-cols-[2.5rem_1fr_3rem_3rem_3rem_3rem_3rem_3.5rem] gap-0 px-3 py-2.5 text-left hover:bg-green-50/50 transition-colors items-center"
                  >
                    <span className="text-xs font-bold text-gray-500">
                      {golfer.position || (i + 1)}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-gray-200">
                        {golfer.espn_id ? (
                          <img
                            src={golferImageUrl(golfer.espn_id)}
                            alt={golfer.name}
                            className="w-full h-full object-cover object-top"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] font-bold">
                            {golfer.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{golfer.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 font-mono">T{golfer.tier}</span>
                          {golfer.odds && <span className="text-[10px] text-gray-400 font-mono">{golfer.odds}</span>}
                          {isCut && (
                            <span className="text-[10px] text-red-500 font-semibold uppercase">
                              {golfer.status === "cut" ? "MC" : golfer.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-center text-gray-600 font-mono">{golfer.round1 ?? "-"}</span>
                    <span className="text-xs text-center text-gray-600 font-mono">{golfer.round2 ?? "-"}</span>
                    <span className="text-xs text-center text-gray-600 font-mono">{golfer.round3 ?? "-"}</span>
                    <span className="text-xs text-center text-gray-600 font-mono">{golfer.round4 ?? "-"}</span>
                    <span className="text-xs text-center text-gray-500">{golfer.thru || "-"}</span>
                    <span className={`text-sm font-bold text-right ${
                      (golfer.total_score ?? 0) < 0 ? "score-under-par"
                      : (golfer.total_score ?? 0) > 0 ? "score-over-par"
                      : "score-even"
                    }`}>
                      {formatScore(golfer.total_score)}
                    </span>
                  </button>

                  {/* Row — mobile */}
                  <button
                    onClick={() => toggleGolferExpand(golfer)}
                    className="sm:hidden w-full flex items-center px-3 py-2 text-left hover:bg-green-50/50 transition-colors"
                  >
                    <span className="w-7 text-xs font-bold text-gray-500 flex-shrink-0">
                      {golfer.position || (i + 1)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{golfer.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-mono">T{golfer.tier}</span>
                        {isCut && (
                          <span className="text-[10px] text-red-500 font-semibold uppercase">
                            {golfer.status === "cut" ? "MC" : golfer.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="w-8 text-[11px] text-center text-gray-500 flex-shrink-0">{golfer.thru || "-"}</span>
                    <span className={`w-10 text-sm font-bold text-right flex-shrink-0 ${
                      (golfer.total_score ?? 0) < 0 ? "score-under-par"
                      : (golfer.total_score ?? 0) > 0 ? "score-over-par"
                      : "score-even"
                    }`}>
                      {formatScore(golfer.total_score)}
                    </span>
                    <svg
                      className={`w-4 h-4 ml-1 text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Inline expanded scorecard */}
                  {isExpanded && (
                    <InlineScorecard
                      golfer={golfer}
                      scorecard={scorecard}
                      loading={scorecardLoading}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline scorecard component — shown when a golfer row is expanded */
function InlineScorecard({
  golfer,
  scorecard,
  loading,
}: {
  golfer: Golfer;
  scorecard: ScorecardData | null;
  loading: boolean;
}) {
  const isCut = golfer.status === "cut" || golfer.status === "wd" || golfer.status === "dq";
  const hasHoles = scorecard && scorecard.rounds.some((r) => r.holes && r.holes.length > 0);

  return (
    <div className="border-t border-gray-100 bg-gray-50/80 px-3 py-3">
      {/* Round summary boxes */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {[
          { label: "R1", value: golfer.round1 },
          { label: "R2", value: golfer.round2 },
          { label: "R3", value: golfer.round3 },
          { label: "R4", value: golfer.round4 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-md p-2 text-center border border-gray-100">
            <p className="text-[9px] text-gray-400 uppercase font-semibold">{label}</p>
            <p className="text-base font-bold text-gray-900 font-mono">{value ?? "-"}</p>
          </div>
        ))}
      </div>

      {/* Status */}
      {isCut && (
        <p className="text-xs text-red-500 font-semibold mb-2">
          {golfer.status === "cut" ? "Missed Cut" : golfer.status === "wd" ? "Withdrawn" : "Disqualified"}
        </p>
      )}

      {/* Hole-by-hole */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin w-5 h-5 border-2 border-[#006747] border-t-transparent rounded-full" />
        </div>
      )}

      {hasHoles && (
        <div className="space-y-2">
          {scorecard!.rounds
            .filter((r) => r.holes && r.holes.length > 0)
            .map((round) => (
            <div key={round.round}>
              <p className="text-[10px] font-semibold text-[#006747] mb-1">
                Round {round.round} ({round.strokes})
              </p>
              <div className="overflow-x-auto -mx-3 px-3">
                {/* Front 9 */}
                <HoleRow holes={round.holes.slice(0, 9)} label="Out" />
                {/* Back 9 */}
                {round.holes.length > 9 && (
                  <HoleRow holes={round.holes.slice(9, 18)} label="In" />
                )}
              </div>
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-2 text-[9px] text-gray-400 pt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border-2 border-green-600 text-[7px] font-bold text-green-700">3</span>
              Birdie
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-yellow-500 text-[7px] font-bold text-yellow-700"><span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-yellow-500 text-[7px]">2</span></span>
              Eagle
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 border-2 border-red-500 text-[7px] font-bold text-red-600">5</span>
              Bogey
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-red-700 text-[7px] font-bold text-red-700"><span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-red-700 text-[7px]">6</span></span>
              Dbl Bogey+
            </span>
          </div>
        </div>
      )}

      {scorecard && !hasHoles && !loading && (
        <p className="text-[10px] text-gray-400 text-center py-1">
          Hole-by-hole data not yet available.
        </p>
      )}
    </div>
  );
}

/** A row of 9 holes with Out/In total */
function HoleRow({ holes, label }: { holes: Array<{ hole: number; strokes: number; par: number; score: number }>; label: string }) {
  return (
    <div className="flex mb-0.5 items-end">
      <div className="flex-shrink-0 w-5 flex items-center justify-center text-[8px] text-gray-400 font-semibold">
        #
      </div>
      {holes.map((h) => (
        <div key={h.hole} className="flex-1 min-w-[1.75rem] flex flex-col items-center">
          <div className="text-[8px] text-gray-400 mb-0.5">{h.hole}</div>
          <HoleScore strokes={h.strokes} score={h.score} />
        </div>
      ))}
      <div className="flex-shrink-0 w-8 text-center">
        <div className="text-[8px] text-gray-400 mb-0.5">{label}</div>
        <div className="text-xs font-bold font-mono text-gray-700 py-0.5">
          {holes.reduce((s, h) => s + h.strokes, 0)}
        </div>
      </div>
    </div>
  );
}

/** Single hole score with golf notation: circle=birdie, 2x circle=eagle, square=bogey, 2x square=dbl bogey */
function HoleScore({ strokes, score }: { strokes: number; score: number }) {
  // Par
  if (score === 0) {
    return (
      <div className="w-6 h-6 flex items-center justify-center">
        <span className="text-xs font-bold font-mono text-gray-800">{strokes}</span>
      </div>
    );
  }

  // Birdie (-1): single circle, green
  if (score === -1) {
    return (
      <div className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-green-600">
        <span className="text-[11px] font-bold font-mono text-green-700">{strokes}</span>
      </div>
    );
  }

  // Eagle or better (-2 or less): double circle, gold/green
  if (score <= -2) {
    return (
      <div className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-yellow-500">
        <div className="w-5 h-5 flex items-center justify-center rounded-full border-[1.5px] border-yellow-500">
          <span className="text-[10px] font-bold font-mono text-yellow-700">{strokes}</span>
        </div>
      </div>
    );
  }

  // Bogey (+1): single square, red
  if (score === 1) {
    return (
      <div className="w-6 h-6 flex items-center justify-center border-2 border-red-500">
        <span className="text-[11px] font-bold font-mono text-red-600">{strokes}</span>
      </div>
    );
  }

  // Double bogey or worse (+2 or more): double square, dark red
  return (
    <div className="w-7 h-7 flex items-center justify-center border-2 border-red-700">
      <div className="w-5 h-5 flex items-center justify-center border-[1.5px] border-red-700">
        <span className="text-[10px] font-bold font-mono text-red-700">{strokes}</span>
      </div>
    </div>
  );
}

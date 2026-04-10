"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateLeaderboard, formatScore, type UserResult, type Golfer } from "@/lib/scoring";
import { golferImageUrl } from "@/lib/golfer-images";

type Tab = "pool" | "field";

interface ScorecardData {
  name: string;
  position: number;
  score: string;
  rounds: Array<{ round: number; strokes: number; displayValue: string }>;
  holes: Array<{
    round: number;
    holes: Array<{ hole: number; strokes: number; par: number; score: number }>;
  }>;
  status: string;
  thru: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<UserResult[]>([]);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [tournamentState, setTournamentState] = useState<string>("pre");
  const [activeTab, setActiveTab] = useState<Tab>("pool");
  const [selectedGolfer, setSelectedGolfer] = useState<Golfer | null>(null);
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

  async function openScorecard(golfer: Golfer) {
    setSelectedGolfer(golfer);
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

  function closeScorecard() {
    setSelectedGolfer(null);
    setScorecard(null);
  }

  // Sort golfers by position for field view
  const sortedField = [...golfers].sort((a, b) => {
    // Active players with scores first, sorted by total_score
    const aScore = a.total_score ?? 999;
    const bScore = b.total_score ?? 999;
    const aPos = a.position ? parseInt(a.position) : 999;
    const bPos = b.position ? parseInt(b.position) : 999;
    if (aPos !== bPos) return aPos - bPos;
    return aScore - bScore;
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
                              ? "score-negative"
                              : entry.totalScore > 0
                              ? "score-positive"
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
                          <button
                            key={gs.tier}
                            onClick={() => openScorecard(gs.golfer)}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left ${
                              gs.isDropped
                                ? "opacity-40"
                                : gs.isMissedCut
                                ? "bg-red-50"
                                : "bg-white"
                            } ${gs.isDropped ? "" : "shadow-sm border border-gray-100"} hover:ring-1 hover:ring-[#006747]/30 transition-all`}
                          >
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
                          </button>
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
          {/* Field header */}
          <div className="grid grid-cols-[3rem_1fr_3rem_3rem_3rem_3rem_3rem_3.5rem] sm:grid-cols-[3rem_1fr_3.5rem_3.5rem_3.5rem_3.5rem_3.5rem_4rem] gap-0 px-3 py-2 bg-gray-50 border-b border-gray-200 text-[10px] sm:text-xs text-gray-500 font-semibold uppercase">
            <span>Pos</span>
            <span>Player</span>
            <span className="text-center">R1</span>
            <span className="text-center">R2</span>
            <span className="text-center">R3</span>
            <span className="text-center">R4</span>
            <span className="text-center">Thru</span>
            <span className="text-right">Total</span>
          </div>
          <div className="divide-y divide-gray-100">
            {sortedField.map((golfer, i) => {
              const isCut = golfer.status === "cut" || golfer.status === "wd" || golfer.status === "dq";
              return (
                <button
                  key={golfer.id}
                  onClick={() => openScorecard(golfer)}
                  className={`w-full grid grid-cols-[3rem_1fr_3rem_3rem_3rem_3rem_3rem_3.5rem] sm:grid-cols-[3rem_1fr_3.5rem_3.5rem_3.5rem_3.5rem_3.5rem_4rem] gap-0 px-3 py-2.5 text-left hover:bg-green-50/50 transition-colors items-center ${
                    isCut ? "opacity-50" : ""
                  }`}
                >
                  <span className="text-xs font-bold text-gray-500">
                    {golfer.position || (i + 1)}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                      {golfer.espn_id ? (
                        <img
                          src={golferImageUrl(golfer.espn_id)}
                          alt={golfer.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                          {golfer.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{golfer.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-mono">T{golfer.tier}</span>
                        {golfer.odds && (
                          <span className="text-[10px] text-gray-400 font-mono">{golfer.odds}</span>
                        )}
                        {isCut && (
                          <span className="text-[10px] text-red-500 font-semibold uppercase">
                            {golfer.status === "cut" ? "MC" : golfer.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-center text-gray-600 font-mono">
                    {golfer.round1 ?? "-"}
                  </span>
                  <span className="text-xs text-center text-gray-600 font-mono">
                    {golfer.round2 ?? "-"}
                  </span>
                  <span className="text-xs text-center text-gray-600 font-mono">
                    {golfer.round3 ?? "-"}
                  </span>
                  <span className="text-xs text-center text-gray-600 font-mono">
                    {golfer.round4 ?? "-"}
                  </span>
                  <span className="text-xs text-center text-gray-500">
                    {golfer.thru || "-"}
                  </span>
                  <span
                    className={`text-sm font-bold text-right ${
                      (golfer.total_score ?? 0) < 0
                        ? "score-negative"
                        : (golfer.total_score ?? 0) > 0
                        ? "score-positive"
                        : "score-even"
                    }`}
                  >
                    {formatScore(golfer.total_score)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scorecard Modal */}
      {selectedGolfer && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={closeScorecard} />
          <div className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[80vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 rounded-t-xl">
              <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                {selectedGolfer.espn_id ? (
                  <img
                    src={golferImageUrl(selectedGolfer.espn_id)}
                    alt={selectedGolfer.name}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                    {selectedGolfer.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#006747] truncate">{selectedGolfer.name}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-mono">T{selectedGolfer.tier}</span>
                  {selectedGolfer.odds && <span className="font-mono">{selectedGolfer.odds}</span>}
                  {selectedGolfer.position && <span>Pos: {selectedGolfer.position}</span>}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-2xl font-bold ${
                    (selectedGolfer.total_score ?? 0) < 0
                      ? "score-negative"
                      : (selectedGolfer.total_score ?? 0) > 0
                      ? "score-positive"
                      : "score-even"
                  }`}
                >
                  {formatScore(selectedGolfer.total_score)}
                </span>
              </div>
              <button
                onClick={closeScorecard}
                className="flex-shrink-0 p-1 rounded hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Round scores */}
            <div className="px-4 py-3">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: "R1", value: selectedGolfer.round1 },
                  { label: "R2", value: selectedGolfer.round2 },
                  { label: "R3", value: selectedGolfer.round3 },
                  { label: "R4", value: selectedGolfer.round4 },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
                    <p className="text-lg font-bold text-gray-900 font-mono">
                      {value ?? "-"}
                    </p>
                  </div>
                ))}
              </div>

              {/* Status info */}
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                {selectedGolfer.thru && (
                  <span>{selectedGolfer.thru === "F" ? "Final" : `Thru ${selectedGolfer.thru}`}</span>
                )}
                {(selectedGolfer.status === "cut" || selectedGolfer.status === "wd" || selectedGolfer.status === "dq") && (
                  <span className="text-red-500 font-semibold uppercase">
                    {selectedGolfer.status === "cut" ? "Missed Cut" : selectedGolfer.status === "wd" ? "Withdrawn" : "Disqualified"}
                  </span>
                )}
              </div>

              {/* Hole-by-hole scorecard from ESPN */}
              {scorecardLoading && (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin w-6 h-6 border-3 border-[#006747] border-t-transparent rounded-full" />
                </div>
              )}

              {scorecard && scorecard.holes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">Hole-by-Hole</h4>
                  {scorecard.holes.map((round) => (
                    <div key={round.round} className="overflow-x-auto">
                      <p className="text-xs font-semibold text-[#006747] mb-1">Round {round.round}</p>
                      <div className="flex gap-0 min-w-max">
                        {round.holes.map((h) => (
                          <div
                            key={h.hole}
                            className={`w-8 h-10 flex flex-col items-center justify-center text-xs border border-gray-100 ${
                              h.score < 0
                                ? h.score <= -2
                                  ? "bg-red-100 text-red-800"
                                  : "bg-red-50 text-red-700"
                                : h.score > 0
                                ? h.score >= 2
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-blue-50 text-blue-700"
                                : "bg-white text-gray-600"
                            }`}
                          >
                            <span className="text-[8px] text-gray-400">{h.hole}</span>
                            <span className="font-bold font-mono">{h.strokes}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Birdie+</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-gray-200 inline-block" /> Par</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 inline-block" /> Bogey+</span>
                  </div>
                </div>
              )}

              {scorecard && scorecard.holes.length === 0 && !scorecardLoading && (
                <p className="text-xs text-gray-400 text-center py-2">
                  Hole-by-hole data not yet available.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

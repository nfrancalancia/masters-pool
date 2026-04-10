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
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

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
      setSelectedRound(null);
      return;
    }

    setExpandedGolferId(golfer.id);
    setScorecard(null);
    setSelectedRound(null);
    setScorecardLoading(true);

    try {
      const res = await fetch(`/api/scorecard?espnId=${golfer.espn_id}`);
      if (res.ok) {
        const data: ScorecardData = await res.json();
        setScorecard(data);
        // Default to the latest round with data
        const latestRound = data.rounds
          .filter((r) => r.holes && r.holes.length > 0)
          .map((r) => r.round)
          .sort((a, b) => b - a)[0];
        if (latestRound) setSelectedRound(latestRound);
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
                        {entry.tiebreaker !== null && (
                          <p className="text-xs text-gray-400">TB: {entry.tiebreaker}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className={`text-xl font-bold ${totalScoreClass(entry.totalScore)}`}>
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
                              gs.isDropped ? "opacity-40" : gs.isMissedCut ? "bg-red-50" : "bg-white"
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
                              <span className={`text-base font-bold flex-shrink-0 ${
                                gs.isDropped ? "text-gray-400 line-through" : totalScoreClass(gs.effectiveScore)
                              }`}>
                                {formatScore(gs.effectiveScore)}
                              </span>
                              <svg
                                className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${expandedGolferId === gs.golfer.id ? "rotate-180" : ""}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {expandedGolferId === gs.golfer.id && (
                              <InlineScorecard
                                golfer={gs.golfer}
                                scorecard={scorecard}
                                loading={scorecardLoading}
                                selectedRound={selectedRound}
                                onSelectRound={setSelectedRound}
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="sticky left-0 z-10 bg-gray-50 w-7 pl-3 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase">#</th>
                  <th className="sticky left-7 z-10 bg-gray-50 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase min-w-[120px] sm:min-w-[170px]">Player</th>
                  <th className="w-12 py-2 text-center text-[10px] text-gray-500 font-semibold uppercase">Tot</th>
                  <th className="w-10 py-2 text-center text-[10px] text-gray-500 font-semibold uppercase">Thru</th>
                  <th className="w-10 py-2 text-center text-[10px] text-gray-500 font-semibold uppercase">R1</th>
                  <th className="w-10 py-2 text-center text-[10px] text-gray-500 font-semibold uppercase">R2</th>
                  <th className="w-10 py-2 text-center text-[10px] text-gray-500 font-semibold uppercase">R3</th>
                  <th className="w-10 py-2 text-center text-[10px] text-gray-500 font-semibold uppercase">R4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedField.map((golfer, i) => {
                  const isCut = golfer.status === "cut" || golfer.status === "wd" || golfer.status === "dq";
                  const isExpanded = expandedGolferId === golfer.id;

                  return (
                    <tr
                      key={golfer.id}
                      className={`${isCut && !isExpanded ? "opacity-50" : ""} cursor-pointer hover:bg-green-50/50 transition-colors`}
                      onClick={() => toggleGolferExpand(golfer)}
                    >
                      {isExpanded ? (
                        <td colSpan={8} className="p-0">
                          {/* Expanded: show player row + scorecard */}
                          <div className="flex items-center px-3 py-2">
                            <div className="w-7 flex-shrink-0 text-xs font-bold text-gray-500">
                              {golfer.position || (i + 1)}
                            </div>
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                                {golfer.espn_id ? (
                                  <img
                                    src={golferImageUrl(golfer.espn_id)}
                                    alt={golfer.name}
                                    className="w-full h-full object-cover object-top"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px] font-bold">
                                    {golfer.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12px] sm:text-sm font-semibold truncate">{golfer.name}</p>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-gray-400 font-mono">T{golfer.tier}</span>
                                  {isCut && (
                                    <span className="text-[9px] text-red-500 font-semibold uppercase">
                                      {golfer.status === "cut" ? "MC" : golfer.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className={`text-sm font-bold ${totalScoreClass(golfer.total_score ?? 0)}`}>
                              {formatScore(golfer.total_score)}
                            </span>
                            <svg className="w-4 h-4 ml-2 text-gray-300 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <InlineScorecard
                              golfer={golfer}
                              scorecard={scorecard}
                              loading={scorecardLoading}
                              selectedRound={selectedRound}
                              onSelectRound={setSelectedRound}
                            />
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="sticky left-0 z-10 bg-white pl-3 py-2 text-xs font-bold text-gray-500">
                            {golfer.position || (i + 1)}
                          </td>
                          <td className="sticky left-7 z-10 bg-white py-2">
                            <div className="flex items-center gap-1.5 min-w-0 pr-2">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                                {golfer.espn_id ? (
                                  <img
                                    src={golferImageUrl(golfer.espn_id)}
                                    alt={golfer.name}
                                    className="w-full h-full object-cover object-top"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px] font-bold">
                                    {golfer.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12px] sm:text-sm font-semibold truncate">{golfer.name}</p>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-gray-400 font-mono">T{golfer.tier}</span>
                                  {isCut && (
                                    <span className="text-[9px] text-red-500 font-semibold uppercase">
                                      {golfer.status === "cut" ? "MC" : golfer.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={`text-center text-sm font-bold ${totalScoreClass(golfer.total_score ?? 0)}`}>
                            {formatScore(golfer.total_score)}
                          </td>
                          <td className="text-center text-[11px] text-gray-500">{golfer.thru || "-"}</td>
                          <td className="text-center text-xs text-gray-600 font-mono">{golfer.round1 ?? "-"}</td>
                          <td className="text-center text-xs text-gray-600 font-mono">{golfer.round2 ?? "-"}</td>
                          <td className="text-center text-xs text-gray-600 font-mono">{golfer.round3 ?? "-"}</td>
                          <td className="text-center text-xs text-gray-600 font-mono">{golfer.round4 ?? "-"}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function totalScoreClass(score: number): string {
  if (score < 0) return "score-under-par";
  if (score > 0) return "score-over-par";
  return "score-even";
}

/** Inline scorecard component — shown when a golfer row is expanded */
function InlineScorecard({
  golfer,
  scorecard,
  loading,
  selectedRound,
  onSelectRound,
}: {
  golfer: Golfer;
  scorecard: ScorecardData | null;
  loading: boolean;
  selectedRound: number | null;
  onSelectRound: (r: number) => void;
}) {
  const isCut = golfer.status === "cut" || golfer.status === "wd" || golfer.status === "dq";
  const roundValues = [
    { num: 1, value: golfer.round1 },
    { num: 2, value: golfer.round2 },
    { num: 3, value: golfer.round3 },
    { num: 4, value: golfer.round4 },
  ];

  const activeRoundData = scorecard?.rounds.find(
    (r) => r.round === selectedRound && r.holes && r.holes.length > 0
  );

  return (
    <div className="border-t border-gray-100 bg-gray-50/80 px-3 py-3">
      {/* Clickable round tiles */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {roundValues.map(({ num, value }) => {
          const isActive = selectedRound === num;
          const hasData = scorecard?.rounds.some((r) => r.round === num && r.holes && r.holes.length > 0);
          return (
            <button
              key={num}
              onClick={() => onSelectRound(num)}
              className={`rounded-md p-2 text-center border transition-colors ${
                isActive
                  ? "border-[#006747] bg-[#006747]/5 ring-1 ring-[#006747]"
                  : "border-gray-100 bg-white hover:border-gray-300"
              } ${hasData ? "cursor-pointer" : ""}`}
            >
              <p className={`text-[9px] uppercase font-semibold ${isActive ? "text-[#006747]" : "text-gray-400"}`}>R{num}</p>
              <p className={`text-base font-bold font-mono ${isActive ? "text-[#006747]" : "text-gray-900"}`}>
                {value ?? "-"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Status */}
      {isCut && (
        <p className="text-xs text-red-500 font-semibold mb-2">
          {golfer.status === "cut" ? "Missed Cut" : golfer.status === "wd" ? "Withdrawn" : "Disqualified"}
        </p>
      )}

      {/* Hole-by-hole scorecard */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin w-5 h-5 border-2 border-[#006747] border-t-transparent rounded-full" />
        </div>
      )}

      {activeRoundData && (
        <div>
          <div className="overflow-x-auto -mx-3 px-3 pb-1">
            <table className="min-w-max border-collapse">
              <thead>
                <tr>
                  <td className="w-10 pr-1 py-0.5 text-[9px] text-gray-400 font-semibold text-right">Hole</td>
                  {activeRoundData.holes.map((h) => (
                    <td key={h.hole} className="w-7 py-0.5 text-center text-[9px] text-gray-400 font-semibold">{h.hole}</td>
                  ))}
                  <td className="w-8 py-0.5 text-center text-[9px] text-gray-500 font-bold border-l border-gray-200 pl-1">Tot</td>
                </tr>
                <tr>
                  <td className="w-10 pr-1 py-0.5 text-[9px] text-gray-400 font-semibold text-right">Par</td>
                  {activeRoundData.holes.map((h) => (
                    <td key={h.hole} className="w-7 py-0.5 text-center text-[10px] text-gray-500 font-mono">{h.par}</td>
                  ))}
                  <td className="w-8 py-0.5 text-center text-[10px] text-gray-500 font-mono font-bold border-l border-gray-200 pl-1">
                    {activeRoundData.holes.reduce((s, h) => s + h.par, 0)}
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="w-10 pr-1 py-0.5 text-[9px] text-gray-400 font-semibold text-right">Score</td>
                  {activeRoundData.holes.map((h) => (
                    <td key={h.hole} className="w-7 py-0.5">
                      <div className="flex items-center justify-center">
                        <HoleScore strokes={h.strokes} score={h.score} />
                      </div>
                    </td>
                  ))}
                  <td className="w-8 py-0.5 text-center font-mono font-bold text-sm border-l border-gray-200 pl-1">
                    {activeRoundData.strokes}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 text-[9px] text-gray-400 pt-2 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border-2 border-green-600 text-[7px] font-bold text-green-700">3</span>
              Birdie
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 border-yellow-500">
                <span className="inline-flex items-center justify-center w-3 h-3 rounded-full border border-yellow-500 text-[6px] font-bold text-yellow-700">2</span>
              </span>
              Eagle
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 border-2 border-red-500 text-[7px] font-bold text-red-600">5</span>
              Bogey
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-[18px] h-[18px] border-2 border-red-700">
                <span className="inline-flex items-center justify-center w-3 h-3 border border-red-700 text-[6px] font-bold text-red-700">6</span>
              </span>
              Dbl+
            </span>
          </div>
        </div>
      )}

      {!loading && selectedRound && !activeRoundData && (
        <p className="text-[10px] text-gray-400 text-center py-1">
          No scorecard data for Round {selectedRound}.
        </p>
      )}
    </div>
  );
}

/** Single hole score with golf notation */
function HoleScore({ strokes, score }: { strokes: number; score: number }) {
  if (score === 0) {
    return <span className="text-[11px] font-bold font-mono text-gray-800">{strokes}</span>;
  }

  if (score === -1) {
    return (
      <div className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-green-600">
        <span className="text-[10px] font-bold font-mono text-green-700">{strokes}</span>
      </div>
    );
  }

  if (score <= -2) {
    return (
      <div className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-yellow-500">
        <div className="w-4 h-4 flex items-center justify-center rounded-full border-[1.5px] border-yellow-500">
          <span className="text-[8px] font-bold font-mono text-yellow-700">{strokes}</span>
        </div>
      </div>
    );
  }

  if (score === 1) {
    return (
      <div className="w-5 h-5 flex items-center justify-center border-2 border-red-500">
        <span className="text-[10px] font-bold font-mono text-red-600">{strokes}</span>
      </div>
    );
  }

  return (
    <div className="w-6 h-6 flex items-center justify-center border-2 border-red-700">
      <div className="w-4 h-4 flex items-center justify-center border-[1.5px] border-red-700">
        <span className="text-[8px] font-bold font-mono text-red-700">{strokes}</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { calculateLeaderboard, formatScore, type UserResult, type Golfer, type ScorecardData } from "@/lib/scoring";
import { golferImageUrl } from "@/lib/golfer-images";

type Tab = "pool" | "field";

/** Compute movement between current and previous ESPN order */
function getMovement(position: string | null, prevPosition: string | null): number | null {
  if (!position || !prevPosition) return null;
  const cur = parseInt(position);
  const prev = parseInt(prevPosition);
  if (isNaN(cur) || isNaN(prev)) return null;
  if (cur === prev) return 0;
  return prev - cur; // positive = moved up, negative = moved down
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
    // Check if we're in tournament hours (Apr 9-12, 4am-7pm PST)
    function isDuringTournament(): boolean {
      const now = new Date();
      if (now > new Date("2026-04-13T06:00:00Z")) return false;
      const pstHour = (now.getUTCHours() - 7 + 24) % 24;
      return pstHour >= 4 && pstHour < 19;
    }

    // Always load once on mount (uses cached DB data even if API is paused)
    refreshScores().then(() => loadLeaderboard());

    // Only poll every 60s during tournament hours
    const interval = setInterval(() => {
      if (isDuringTournament()) {
        refreshScores().then(() => loadLeaderboard());
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshScores, loadLeaderboard]);

  function toggleGolferExpand(golfer: Golfer) {
    if (expandedGolferId === golfer.id) {
      setExpandedGolferId(null);
      setSelectedRound(null);
      return;
    }

    setExpandedGolferId(golfer.id);
    // Default to latest round with hole data, or R1 if none
    const sc = golfer.scorecard;
    if (sc && sc.rounds.length > 0) {
      const latestRound = sc.rounds
        .filter((r) => r.holes && r.holes.length > 0)
        .map((r) => r.round)
        .sort((a, b) => b - a)[0];
      setSelectedRound(latestRound ?? 1);
    } else {
      setSelectedRound(1);
    }
  }

  // Sort golfers using ESPN's order for stable, deterministic ordering
  // Determine who missed the cut: R2 cumulative > +4 OR status is cut/wd/dq
  const CUT_SCORE = 4;
  function missedCut(g: Golfer): boolean {
    if (g.status === "cut" || g.status === "wd" || g.status === "dq") return true;
    if (g.round1 !== null && g.round2 !== null && (g.round1 + g.round2 - 144) > CUT_SCORE) return true;
    return false;
  }
  function r2CumulativeScore(g: Golfer): number | null {
    if (g.round1 !== null && g.round2 !== null) return g.round1 + g.round2 - 144;
    return null;
  }

  const sortedField = [...golfers].sort((a, b) => {
    // Players who missed the cut always sort below those who made it
    const aOut = missedCut(a);
    const bOut = missedCut(b);
    if (aOut && !bOut) return 1;
    if (!aOut && bOut) return -1;
    if (aOut && bOut) {
      // Both missed cut: sort by R2 cumulative score ascending (less bad first)
      const aR2 = r2CumulativeScore(a);
      const bR2 = r2CumulativeScore(b);
      if (aR2 !== null && bR2 !== null && aR2 !== bR2) return aR2 - bR2;
      // WD/DQ sort after cut players
      const aWd = a.status === "wd" || a.status === "dq" ? 1 : 0;
      const bWd = b.status === "wd" || b.status === "dq" ? 1 : 0;
      if (aWd !== bWd) return aWd - bWd;
      return 0;
    }
    // Both made the cut: sort by total_score ascending (lowest wins), nulls last
    if (a.total_score === null && b.total_score === null) return 0;
    if (a.total_score === null) return 1;
    if (b.total_score === null) return -1;
    if (a.total_score !== b.total_score) return a.total_score - b.total_score;
    // Tiebreaker: ESPN order (position) for stable ordering among ties
    const aPos = a.position ? parseInt(a.position) : 999;
    const bPos = b.position ? parseInt(b.position) : 999;
    return aPos - bPos;
  });

  // Compute display positions — only rank players who made the cut
  const fieldPositions: Record<number, string> = {};
  const fieldRank: Record<number, number> = {}; // numeric rank for movement calc
  const activePlayers = sortedField.filter((g) => !missedCut(g));
  activePlayers.forEach((golfer, i) => {
    if (golfer.total_score === null) {
      fieldPositions[golfer.id] = "-";
      fieldRank[golfer.id] = i + 1;
      return;
    }
    const firstIdx = activePlayers.findIndex((g) => g.total_score === golfer.total_score);
    const tiedCount = activePlayers.filter((g) => g.total_score === golfer.total_score).length;
    const pos = firstIdx + 1;
    fieldPositions[golfer.id] = tiedCount > 1 ? `T${pos}` : `${pos}`;
    fieldRank[golfer.id] = i + 1;
  });
  // Missed cut players get MC/WD/DQ label instead of position
  sortedField.filter((g) => missedCut(g)).forEach((golfer) => {
    if (golfer.status === "wd") fieldPositions[golfer.id] = "WD";
    else if (golfer.status === "dq") fieldPositions[golfer.id] = "DQ";
    else fieldPositions[golfer.id] = "MC";
  });

  // Track rank changes between refreshes for highlight animations
  const prevFieldRankRef = useRef<Record<number, number>>({});
  const [rankChange, setRankChange] = useState<Record<number, "up" | "down" | null>>({});
  const fieldRankKey = sortedField.map((g) => g.id).join(",");

  useEffect(() => {
    const prev = prevFieldRankRef.current;
    if (Object.keys(prev).length > 0) {
      const changes: Record<number, "up" | "down" | null> = {};
      let hasChange = false;
      Object.entries(fieldRank).forEach(([idStr, rank]) => {
        const id = parseInt(idStr);
        const prevRank = prev[id];
        if (prevRank !== undefined && prevRank !== rank) {
          changes[id] = rank < prevRank ? "up" : "down";
          hasChange = true;
        }
      });
      if (hasChange) {
        setRankChange(changes);
        const timer = setTimeout(() => setRankChange({}), 2500);
        return () => clearTimeout(timer);
      }
    }
    prevFieldRankRef.current = { ...fieldRank };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldRankKey]);

  // Determine current tournament round from scorecard data
  let currentRound = 1;
  golfers.forEach((g) => {
    if (g.scorecard?.rounds) {
      g.scorecard.rounds.forEach((r) => {
        if (r.holes && r.holes.length > 0 && r.round > currentRound) {
          currentRound = r.round;
        }
      });
    }
  });

  // Compute previous round's final rankings for movement arrows
  // During R2: compare to R1 rankings. During R3: compare to R2 rankings, etc.
  const prevRoundRank: Record<number, number> = {};
  if (currentRound > 1) {
    const roundScores: { id: number; cumulative: number; espnPos: number }[] = [];
    golfers.forEach((g) => {
      // Sum strokes through the previous round
      const roundFields = [g.round1, g.round2, g.round3, g.round4];
      let cumulative = 0;
      let hasAll = true;
      for (let r = 0; r < currentRound - 1; r++) {
        if (roundFields[r] === null || roundFields[r] === undefined) { hasAll = false; break; }
        cumulative += (roundFields[r]! - 72); // score to par per round
      }
      if (hasAll) {
        roundScores.push({ id: g.id, cumulative, espnPos: g.position ? parseInt(g.position) : 999 });
      }
    });
    roundScores.sort((a, b) => a.cumulative !== b.cumulative ? a.cumulative - b.cumulative : a.espnPos - b.espnPos);
    roundScores.forEach((g, i) => { prevRoundRank[g.id] = i + 1; });
  }

  // Compute "today" score: current round's score relative to par from scorecard
  // Shows score for today's round (complete or in-progress), "-" if player hasn't started
  const todayScore: Record<number, number | null> = {};
  golfers.forEach((g) => {
    if (!g.scorecard || !g.scorecard.rounds || g.scorecard.rounds.length === 0) {
      todayScore[g.id] = null;
      return;
    }
    // Find data for the current tournament round
    const currentRoundData = g.scorecard.rounds.find(
      (r) => r.round === currentRound && r.holes && r.holes.length > 0
    );
    if (!currentRoundData) {
      todayScore[g.id] = null; // Player hasn't started today's round
      return;
    }
    todayScore[g.id] = currentRoundData.holes.reduce((s, h) => s + (h.score ?? 0), 0);
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
      {/* Section header — flush, no card */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-black text-[#006747]" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
          Leaderboard
        </h2>
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
                const isTied = leaderboard.filter((e) => e.rank === entry.rank).length > 1;
                const displayRank = isTied ? `T${entry.rank}` : `${entry.rank}`;
                return (
                  <motion.div
                    key={entry.userId}
                    layout="position"
                    transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
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
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#f2c75c] text-[#006747] text-xs font-bold">
                            {displayRank}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 text-gray-500 font-bold text-xs">
                            {displayRank}
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
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
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
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                  {gs.golfer.odds && <span className="text-gray-400 font-mono text-[10px]">{gs.golfer.odds}</span>}
                                  {gs.golfer.thru && <span>{gs.golfer.thru === "F" ? "Final" : gs.golfer.thru.includes(":") ? gs.golfer.thru : `Thru ${gs.golfer.thru}`}</span>}
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
                                scorecard={gs.golfer.scorecard}
                                selectedRound={selectedRound}
                                onSelectRound={setSelectedRound}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                      </div>
                    </div>
                  </motion.div>
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
            <div className="min-w-[420px]">
              {/* Column headers */}
              <div className="flex items-center bg-gray-50 border-b border-gray-200">
                <div className="flex-shrink-0 w-6 pl-1 py-2.5 text-[10px] text-gray-500 font-semibold uppercase">#</div>
                <div className="flex-shrink-0 w-6 mr-1"></div>
                <div className="flex-1 min-w-0 pr-1 py-2.5 text-[10px] text-gray-500 font-semibold uppercase">Player</div>
                <div className="flex-shrink-0 w-8 text-center py-2.5 text-[10px] text-gray-500 font-semibold uppercase">Tot</div>
                <div className="flex-shrink-0 w-8 text-center py-2.5 text-[10px] text-gray-500 font-semibold uppercase">Tdy</div>
                <div className="flex-shrink-0 w-10 text-center py-2.5 text-[10px] text-gray-500 font-semibold uppercase">Thru</div>
                <div className="flex-shrink-0 w-7 text-center py-2.5 text-[10px] text-gray-500 font-semibold uppercase">R1</div>
                <div className="flex-shrink-0 w-7 text-center py-2.5 text-[10px] text-gray-500 font-semibold uppercase">R2</div>
                <div className="flex-shrink-0 w-6 text-center py-2.5 text-[10px] text-gray-500 font-semibold uppercase">R3</div>
                <div className="flex-shrink-0 w-6 text-center py-2.5 text-[10px] text-gray-500 font-semibold uppercase">R4</div>
                <div className="flex-shrink-0 w-4"></div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-100">
                {(() => {
                  let cutLineShown = false;
                  return sortedField.map((golfer, i) => {
                  const isMC = missedCut(golfer);
                  const isExpanded = expandedGolferId === golfer.id;
                  // Movement: only for active players
                  const curRank = fieldRank[golfer.id] ?? null;
                  const prevRank = prevRoundRank[golfer.id] ?? null;
                  const movement = !isMC && curRank !== null && prevRank !== null ? prevRank - curRank : null;

                  // Show cut line once, right before the first missed-cut player
                  const showCutLine = !cutLineShown && isMC;
                  if (showCutLine) cutLineShown = true;

                  const change = rankChange[golfer.id];
                  const changeBorder = change === "up"
                    ? "border-l-2 border-l-green-500"
                    : change === "down"
                    ? "border-l-2 border-l-red-500"
                    : "";

                  return (
                    <motion.div
                      key={golfer.id}
                      layout="position"
                      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
                      className={`${changeBorder} transition-colors duration-1000`}
                    >
                      {showCutLine && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50/80">
                          <div className="flex-1 border-t border-dashed border-red-300" />
                          <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wide whitespace-nowrap">
                            {currentRound >= 3 ? "Cut Line" : `Projected Cut ${formatScore(CUT_SCORE)}`}
                          </span>
                          <div className="flex-1 border-t border-dashed border-red-300" />
                        </div>
                      )}
                      <div className={isMC && !isExpanded ? "opacity-50" : ""}>
                      {/* Row */}
                      <button
                        onClick={() => toggleGolferExpand(golfer)}
                        className="w-full flex items-center py-2.5 text-left hover:bg-green-50/50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-6 pl-1 text-[11px] font-bold text-gray-500">
                          {fieldPositions[golfer.id] || (i + 1)}
                        </div>
                        <div className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden bg-gray-200 mr-1">
                          {golfer.espn_id ? (
                            <img
                              src={golferImageUrl(golfer.espn_id)}
                              alt={golfer.name}
                              className="w-full h-full object-cover object-top"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[7px] font-bold">
                              {golfer.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center gap-0.5">
                            <p className="text-xs sm:text-sm font-semibold truncate">{golfer.name}</p>
                            <MovementArrow movement={movement} />
                          </div>
                          {isCut && (
                            <span className="text-[9px] text-red-500 font-semibold uppercase">
                              {golfer.status === "cut" ? "MC" : golfer.status}
                            </span>
                          )}
                        </div>
                        <div className={`flex-shrink-0 w-8 text-center text-sm font-bold ${totalScoreClass(golfer.total_score ?? 0)}`}>
                          {golfer.total_score === 0 && !golfer.round1 ? "-" : formatScore(golfer.total_score)}
                        </div>
                        <div className={`flex-shrink-0 w-8 text-center text-xs font-semibold ${todayScore[golfer.id] !== null ? totalScoreClass(todayScore[golfer.id]!) : "text-gray-400"}`}>
                          {todayScore[golfer.id] !== null ? formatScore(todayScore[golfer.id]!) : "-"}
                        </div>
                        <div className={`flex-shrink-0 w-10 text-center text-[11px] ${golfer.thru?.includes(":") ? "text-gray-400" : "text-gray-500"}`}>{golfer.thru || "-"}</div>
                        <div className="flex-shrink-0 w-7 text-center text-xs text-gray-600 font-mono">{golfer.round1 ?? "-"}</div>
                        <div className="flex-shrink-0 w-7 text-center text-xs text-gray-600 font-mono">{golfer.round2 ?? "-"}</div>
                        <div className="flex-shrink-0 w-6 text-center text-xs text-gray-600 font-mono">{golfer.round3 ?? "-"}</div>
                        <div className="flex-shrink-0 w-6 text-center text-xs text-gray-600 font-mono">{golfer.round4 ?? "-"}</div>
                        <div className="flex-shrink-0 w-4 pr-1">
                          <svg
                            className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Scorecard inline below the row */}
                      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                        <div className="overflow-hidden">
                          {isExpanded && (
                            <InlineScorecard
                              golfer={golfer}
                              scorecard={golfer.scorecard}
                              selectedRound={selectedRound}
                              onSelectRound={setSelectedRound}
                            />
                          )}
                        </div>
                      </div>
                      </div>
                    </motion.div>
                  );
                });
                })()}
              </div>
            </div>
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

/** Movement arrow indicator */
function MovementArrow({ movement }: { movement: number | null }) {
  if (movement === null || movement === 0) return null;

  if (movement > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-600 flex-shrink-0">
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 10 10">
          <path d="M5 1L9 6H1L5 1Z" />
        </svg>
        {movement}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-500 flex-shrink-0">
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 10 10">
        <path d="M5 9L1 4H9L5 9Z" />
      </svg>
      {Math.abs(movement)}
    </span>
  );
}

// Augusta National par for each hole
const AUGUSTA_PAR = [4, 5, 4, 3, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 5, 3, 4, 4];

/** Inline scorecard component — shown when a golfer row is expanded */
function InlineScorecard({
  golfer,
  scorecard,
  selectedRound,
  onSelectRound,
}: {
  golfer: Golfer;
  scorecard: ScorecardData | null;
  selectedRound: number | null;
  onSelectRound: (r: number) => void;
}) {
  const isCut = golfer.status === "cut" || golfer.status === "wd" || golfer.status === "dq";
  // For each round, show the DB round value if complete, otherwise show in-progress strokes from scorecard
  const roundValues = [golfer.round1, golfer.round2, golfer.round3, golfer.round4].map((val, i) => {
    const num = i + 1;
    if (val !== null) return { num, value: val };
    // Check if there's in-progress scorecard data for this round
    const roundData = scorecard?.rounds.find((r) => r.round === num && r.holes && r.holes.length > 0);
    if (roundData) {
      const scoreToPar = roundData.holes.reduce((s, h) => s + (h.score ?? 0), 0);
      return { num, value: scoreToPar, inProgress: true };
    }
    return { num, value: null };
  });

  const activeRoundData = scorecard?.rounds.find(
    (r) => r.round === selectedRound && r.holes && r.holes.length > 0
  );

  // Build full 18-hole display: played holes from data, "-" for unplayed
  const fullHoles = AUGUSTA_PAR.map((par, i) => {
    const holeNum = i + 1;
    const holeData = activeRoundData?.holes.find((h) => h.hole === holeNum);
    return {
      hole: holeNum,
      par,
      strokes: holeData?.strokes ?? null,
      score: holeData?.score ?? null,
    };
  });

  const playedHoles = fullHoles.filter((h) => h.strokes !== null);
  const totalStrokes = playedHoles.reduce((s, h) => s + (h.strokes ?? 0), 0);

  return (
    <div className="border-t border-gray-100 bg-gray-50/80 px-2.5 py-2.5">
      {/* Clickable round tiles */}
      <div className="grid grid-cols-4 gap-1 mb-2.5">
        {roundValues.map((rv) => {
          const isActive = selectedRound === rv.num;
          const hasData = scorecard?.rounds.some((r) => r.round === rv.num && r.holes && r.holes.length > 0);
          const inProgress = "inProgress" in rv && rv.inProgress;
          return (
            <button
              key={rv.num}
              onClick={() => onSelectRound(rv.num)}
              className={`rounded-md p-1.5 text-center border transition-colors ${
                isActive
                  ? "border-[#006747] bg-[#006747]/5 ring-1 ring-[#006747]"
                  : "border-gray-100 bg-white hover:border-gray-300"
              } ${hasData ? "cursor-pointer" : ""}`}
            >
              <p className={`text-[8px] uppercase font-semibold ${isActive ? "text-[#006747]" : "text-gray-400"}`}>R{rv.num}</p>
              <p className={`text-sm font-bold font-mono ${isActive ? "text-[#006747]" : "text-gray-900"}`}>
                {rv.value === null ? "-" : inProgress ? formatScore(rv.value) : rv.value}
              </p>
              {rv.value !== null && !inProgress && (
                <p className={`text-[8px] font-mono ${isActive ? "text-[#006747]/70" : "text-gray-400"}`}>
                  ({formatScore(rv.value - 72)})
                </p>
              )}
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

      {/* Hole-by-hole scorecard — always show all 18 holes */}
      {selectedRound !== null && (
        <div>
          <div className="overflow-x-auto -mx-2.5 px-2.5 pb-1">
            <table className="min-w-max border-collapse">
              <thead>
                <tr>
                  <td className="w-9 pr-0.5 py-0.5 text-[8px] text-gray-400 font-semibold text-right">Hole</td>
                  {fullHoles.map((h) => (
                    <td key={h.hole} className="w-6 py-0.5 text-center text-[8px] text-gray-400 font-semibold">{h.hole}</td>
                  ))}
                  <td className="w-7 py-0.5 text-center text-[8px] text-gray-500 font-bold border-l border-gray-200 pl-0.5">Tot</td>
                </tr>
                <tr>
                  <td className="w-9 pr-0.5 py-0.5 text-[8px] text-gray-400 font-semibold text-right">Par</td>
                  {fullHoles.map((h) => (
                    <td key={h.hole} className="w-6 py-0.5 text-center text-[9px] text-gray-500 font-mono">{h.par}</td>
                  ))}
                  <td className="w-7 py-0.5 text-center text-[9px] text-gray-500 font-mono font-bold border-l border-gray-200 pl-0.5">
                    72
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="w-9 pr-0.5 py-0.5 text-[8px] text-gray-400 font-semibold text-right">Score</td>
                  {fullHoles.map((h) => (
                    <td key={h.hole} className="w-6 py-0.5">
                      <div className="flex items-center justify-center">
                        {h.strokes !== null ? (
                          <HoleScore strokes={h.strokes} score={h.score!} />
                        ) : (
                          <span className="text-[9px] text-gray-300 font-mono">-</span>
                        )}
                      </div>
                    </td>
                  ))}
                  <td className="w-7 py-0.5 text-center font-mono font-bold text-xs border-l border-gray-200 pl-0.5">
                    {playedHoles.length > 0 ? totalStrokes : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Legend */}
          {playedHoles.length > 0 && (
            <div className="flex items-center gap-2 text-[8px] text-gray-400 pt-1.5 flex-wrap">
              <span className="flex items-center gap-0.5">
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border-[1.5px] border-green-600 text-[6px] font-bold text-green-700">3</span>
                Birdie
              </span>
              <span className="flex items-center gap-0.5">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border-[1.5px] border-yellow-500">
                  <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full border border-yellow-500 text-[5px] font-bold text-yellow-700">2</span>
                </span>
                Eagle
              </span>
              <span className="flex items-center gap-0.5">
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 border-[1.5px] border-red-500 text-[6px] font-bold text-red-600">5</span>
                Bogey
              </span>
              <span className="flex items-center gap-0.5">
                <span className="inline-flex items-center justify-center w-4 h-4 border-[1.5px] border-red-700">
                  <span className="inline-flex items-center justify-center w-2.5 h-2.5 border border-red-700 text-[5px] font-bold text-red-700">6</span>
                </span>
                Dbl+
              </span>
            </div>
          )}
        </div>
      )}

      {selectedRound && !activeRoundData && (
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
    return <span className="text-[10px] font-bold font-mono text-gray-800">{strokes}</span>;
  }

  if (score === -1) {
    return (
      <div className="w-[18px] h-[18px] flex items-center justify-center rounded-full border-[1.5px] border-green-600">
        <span className="text-[9px] font-bold font-mono text-green-700">{strokes}</span>
      </div>
    );
  }

  if (score <= -2) {
    return (
      <div className="w-[22px] h-[22px] flex items-center justify-center rounded-full border-[1.5px] border-yellow-500">
        <div className="w-[14px] h-[14px] flex items-center justify-center rounded-full border border-yellow-500">
          <span className="text-[7px] font-bold font-mono text-yellow-700">{strokes}</span>
        </div>
      </div>
    );
  }

  if (score === 1) {
    return (
      <div className="w-[18px] h-[18px] flex items-center justify-center border-[1.5px] border-red-500">
        <span className="text-[9px] font-bold font-mono text-red-600">{strokes}</span>
      </div>
    );
  }

  return (
    <div className="w-[22px] h-[22px] flex items-center justify-center border-[1.5px] border-red-700">
      <div className="w-[14px] h-[14px] flex items-center justify-center border border-red-700">
        <span className="text-[7px] font-bold font-mono text-red-700">{strokes}</span>
      </div>
    </div>
  );
}

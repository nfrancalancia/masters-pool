// ESPN Golf API integration for Masters 2026
// Uses the free, public ESPN API (no key needed)

const MASTERS_EVENT_ID = "401811941";
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/golf/pga";

export interface ESPNCompetitor {
  id: string;
  uid: string;
  athlete: {
    id?: string;
    fullName: string;
    displayName: string;
    shortName: string;
    flag?: { alt: string };
  };
  score: string; // "-5", "E", "+3"
  order?: number; // ESPN's sort order (deterministic tiebreaking)
  linescores?: Array<{
    value: number | null;
    displayValue: string | null;
    period: number; // round number
    linescores?: Array<any>; // hole-by-hole nested data
  }>;
  status?: {
    type?: {
      name?: string; // "STATUS_CUT", "STATUS_ACTIVE", "STATUS_WITHDRAWN"
      description?: string;
    };
    thru?: number;
    displayValue?: string; // "F", "12", etc.
  };
  statistics?: any;
}

export interface ESPNTournamentData {
  id: string;
  name: string;
  competitors: ESPNCompetitor[];
  status: {
    type: {
      name: string;
      state: string; // "pre", "in", "post"
    };
  };
}

export async function fetchMastersScores(): Promise<{
  competitors: ESPNCompetitor[];
  tournamentName: string;
  tournamentState: string;
} | null> {
  try {
    const res = await fetch(`${ESPN_BASE}/scoreboard`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) {
      console.error("ESPN API error:", res.status);
      return null;
    }

    const data = await res.json();

    // Find the Masters event in the list
    const events = data?.events || [];
    const masters = events.find(
      (e: any) => e.id === MASTERS_EVENT_ID || e.name?.includes("Masters")
    );

    if (!masters) {
      console.error("Masters event not found in ESPN data");
      return null;
    }

    const competition = masters.competitions?.[0];
    if (!competition) return null;

    const competitors: ESPNCompetitor[] = competition.competitors || [];
    const tournamentState = masters.status?.type?.state || "pre";

    return {
      competitors,
      tournamentName: masters.name || "The Masters",
      tournamentState,
    };
  } catch (err) {
    console.error("Failed to fetch ESPN scores:", err);
    return null;
  }
}

export function mapESPNToGolferUpdate(competitor: ESPNCompetitor) {
  const score = competitor.score;
  const totalScore = score === "E" ? 0 : parseInt(score, 10) || null;

  // Extract per-round scores — only set when round is complete (18 holes)
  const rounds = competitor.linescores || [];
  function getRoundScore(period: number): number | null {
    const r = rounds.find((r: any) => r.period === period);
    if (!r || r.value === null || r.value === 0) return null;
    // Only count as final if 18 holes played
    const holesPlayed = r.linescores?.length ?? 0;
    if (holesPlayed > 0 && holesPlayed < 18) return null;
    return r.value;
  }
  const round1 = getRoundScore(1);
  const round2 = getRoundScore(2);
  const round3 = getRoundScore(3);
  const round4 = getRoundScore(4);

  // Determine status from status field if present, otherwise infer
  const statusType = competitor.status?.type?.name || "";
  let status: "active" | "cut" | "wd" | "dq" = "active";
  if (statusType.includes("CUT")) status = "cut";
  else if (statusType.includes("WITHDRAW")) status = "wd";
  else if (statusType.includes("DQ")) status = "dq";

  // Thru indicator — ESPN doesn't provide status on competitors,
  // so compute from scorecard using the highest round number
  let thru = competitor.status?.displayValue || "";
  if (!thru) {
    // Find the highest round number in linescores (the current/latest round)
    const highestRound = rounds.length > 0
      ? rounds.reduce((max: any, r: any) => r.period > max.period ? r : max, rounds[0])
      : null;
    if (highestRound) {
      const holesPlayed = highestRound.linescores?.length ?? 0;
      if (holesPlayed > 0) {
        // Player has started this round
        thru = holesPlayed >= 18 ? "F" : `${holesPlayed}`;
      }
      // If 0 holes played on the latest round, don't set thru — preserve tee time
    }
  }

  // Position — use ESPN's order field for stable sorting
  const position = competitor.order?.toString() || "";

  // Parse hole-by-hole scorecard from nested linescores
  const scorecard = {
    rounds: rounds
      .filter((r: any) => r.linescores && r.linescores.length > 0)
      .map((r: any) => {
        const holes = r.linescores.map((h: any) => {
          const strokes = Math.round(h.value);
          const scoreDisplay = h.scoreType?.displayValue || "E";
          let scoreToPar = 0;
          if (scoreDisplay !== "E") scoreToPar = parseInt(scoreDisplay) || 0;
          return {
            hole: h.period,
            strokes,
            par: strokes - scoreToPar,
            score: scoreToPar,
          };
        });
        return {
          round: r.period,
          strokes: Math.round(r.value),
          holes,
        };
      }),
  };

  return {
    espn_id: competitor.athlete?.id || competitor.id,
    name: competitor.athlete?.fullName || competitor.athlete?.displayName || "Unknown",
    total_score: totalScore,
    round1,
    round2,
    round3,
    round4,
    status,
    thru,
    position,
    scorecard,
    updated_at: new Date().toISOString(),
  };
}

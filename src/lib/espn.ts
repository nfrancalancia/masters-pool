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

  // Extract per-round scores (value is null for unplayed rounds)
  const rounds = competitor.linescores || [];
  const round1 = rounds.find((r) => r.period === 1)?.value ?? null;
  const round2 = rounds.find((r) => r.period === 2)?.value ?? null;
  const round3 = rounds.find((r) => r.period === 3)?.value ?? null;
  const round4 = rounds.find((r) => r.period === 4)?.value ?? null;

  // Determine status from status field if present, otherwise infer
  const statusType = competitor.status?.type?.name || "";
  let status: "active" | "cut" | "wd" | "dq" = "active";
  if (statusType.includes("CUT")) status = "cut";
  else if (statusType.includes("WITHDRAW")) status = "wd";
  else if (statusType.includes("DQ")) status = "dq";

  // Thru indicator
  const thru = competitor.status?.displayValue || "";

  // Position — use ESPN's order field for stable sorting
  const position = competitor.order?.toString() || "";

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
    updated_at: new Date().toISOString(),
  };
}

// Scoring logic for the Masters Pool
// Default: Pick 6, drop worst 2, lowest total wins

export interface Golfer {
  id: number;
  name: string;
  espn_id: string | null;
  tier: number;
  round1: number | null;
  round2: number | null;
  round3: number | null;
  round4: number | null;
  total_score: number | null;
  thru: string | null;
  position: string | null;
  prev_position: string | null;
  status: "active" | "cut" | "wd" | "dq";
  odds: string | null;
}

export interface Pick {
  tier: number;
  golfer_id: number;
}

export interface PoolSettings {
  drop_count: number;
  missed_cut_penalty: number;
  tiebreaker_enabled: boolean;
}

export interface GolferScore {
  golfer: Golfer;
  tier: number;
  effectiveScore: number; // score used for calculations (includes penalties)
  isDropped: boolean;
  isMissedCut: boolean;
}

export interface UserResult {
  userId: string;
  displayName: string;
  golferScores: GolferScore[];
  totalScore: number; // sum of non-dropped scores
  tiebreaker: number | null;
  rank: number;
}

/**
 * Calculate effective score for a golfer.
 * If they missed the cut / WD / DQ, apply penalty for unplayed rounds.
 */
function getEffectiveScore(golfer: Golfer, missedCutPenalty: number): number {
  if (golfer.total_score === null) return 0; // tournament hasn't started

  if (golfer.status === "cut" || golfer.status === "wd" || golfer.status === "dq") {
    // They have a score through the rounds they played.
    // Add penalty for each unplayed round (R3 and R4 for missed cut)
    let penalty = 0;
    if (golfer.round3 === null) penalty += missedCutPenalty;
    if (golfer.round4 === null) penalty += missedCutPenalty;
    return golfer.total_score + penalty;
  }

  return golfer.total_score;
}

/**
 * Calculate a single user's total pool score.
 */
export function calculateUserScore(
  picks: Pick[],
  golferMap: Map<number, Golfer>,
  settings: PoolSettings
): { golferScores: GolferScore[]; totalScore: number } {
  // Map picks to golfer scores
  const golferScores: GolferScore[] = picks
    .map((pick) => {
      const golfer = golferMap.get(pick.golfer_id);
      if (!golfer) {
        return null;
      }
      const effectiveScore = getEffectiveScore(golfer, settings.missed_cut_penalty);
      const isMissedCut = golfer.status === "cut" || golfer.status === "wd" || golfer.status === "dq";
      return {
        golfer,
        tier: pick.tier,
        effectiveScore,
        isDropped: false,
        isMissedCut,
      };
    })
    .filter(Boolean) as GolferScore[];

  // Sort by score descending (worst first) to identify drops
  const sorted = [...golferScores].sort((a, b) => b.effectiveScore - a.effectiveScore);

  // Mark the worst N as dropped
  for (let i = 0; i < settings.drop_count && i < sorted.length; i++) {
    sorted[i].isDropped = true;
  }

  // Total = sum of non-dropped scores
  const totalScore = golferScores
    .filter((gs) => !gs.isDropped)
    .reduce((sum, gs) => sum + gs.effectiveScore, 0);

  // Re-sort by tier for display
  golferScores.sort((a, b) => a.tier - b.tier);

  return { golferScores, totalScore };
}

/**
 * Calculate leaderboard for all users.
 */
export function calculateLeaderboard(
  allPicks: Array<{ user_id: string; tier: number; golfer_id: number }>,
  allTiebreakers: Array<{ user_id: string; predicted_winning_score: number }>,
  profiles: Array<{ id: string; display_name: string }>,
  golfers: Golfer[],
  settings: PoolSettings
): UserResult[] {
  const golferMap = new Map<number, Golfer>();
  golfers.forEach((g) => golferMap.set(g.id, g));

  const tiebreakerMap = new Map<string, number>();
  allTiebreakers.forEach((t) => tiebreakerMap.set(t.user_id, t.predicted_winning_score));

  const profileMap = new Map<string, string>();
  profiles.forEach((p) => profileMap.set(p.id, p.display_name));

  // Group picks by user
  const picksByUser = new Map<string, Pick[]>();
  allPicks.forEach((p) => {
    const existing = picksByUser.get(p.user_id) || [];
    existing.push({ tier: p.tier, golfer_id: p.golfer_id });
    picksByUser.set(p.user_id, existing);
  });

  // Calculate scores for each user
  const results: UserResult[] = [];
  picksByUser.forEach((picks, userId) => {
    const { golferScores, totalScore } = calculateUserScore(picks, golferMap, settings);
    results.push({
      userId,
      displayName: profileMap.get(userId) || "Unknown",
      golferScores,
      totalScore,
      tiebreaker: tiebreakerMap.get(userId) ?? null,
      rank: 0,
    });
  });

  // Sort by total score ascending (lowest wins), then by tiebreaker closeness
  results.sort((a, b) => {
    if (a.totalScore !== b.totalScore) return a.totalScore - b.totalScore;
    // Tiebreaker: closer to actual winning score wins
    // We don't know actual winning score yet during tournament, so sort by tiebreaker value as placeholder
    if (a.tiebreaker !== null && b.tiebreaker !== null) {
      return a.tiebreaker - b.tiebreaker; // lower predicted score first (tie placeholder)
    }
    return 0;
  });

  // Assign ranks (handle ties)
  results.forEach((r, i) => {
    if (i === 0) {
      r.rank = 1;
    } else if (r.totalScore === results[i - 1].totalScore) {
      r.rank = results[i - 1].rank; // same rank for tie
    } else {
      r.rank = i + 1;
    }
  });

  return results;
}

/**
 * Format a score for display.
 */
export function formatScore(score: number | null): string {
  if (score === null) return "-";
  if (score === 0) return "E";
  return score > 0 ? `+${score}` : `${score}`;
}

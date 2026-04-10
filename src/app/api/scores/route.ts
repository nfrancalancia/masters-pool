import { NextResponse } from "next/server";
import { fetchMastersScores, mapESPNToGolferUpdate } from "@/lib/espn";
import { createServiceClient } from "@/lib/supabase/server";

// Check if we should fetch scores right now
// Masters 2026: April 9-12, live coverage roughly 4am-7pm PST (11am-2am UTC next day)
function shouldFetchScores(): boolean {
  const now = new Date();

  // Tournament is over after April 12, 2026 — no more fetches
  const cutoff = new Date("2026-04-13T06:00:00Z"); // April 13 ~midnight PST with buffer
  if (now > cutoff) return false;

  // During tournament days, only fetch between 4am and 7pm PST
  // PST = UTC-7 (April is PDT = UTC-7)
  const pstHour = (now.getUTCHours() - 7 + 24) % 24;
  if (pstHour < 4 || pstHour >= 19) return false; // before 4am or after 7pm PST

  return true;
}

// GET /api/scores - Fetch latest scores from ESPN and update database
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";
    if (!force && !shouldFetchScores()) {
      return NextResponse.json({
        success: true,
        updated: 0,
        skipped: 0,
        paused: true,
        message: "Score fetching paused (outside tournament hours)",
        timestamp: new Date().toISOString(),
      });
    }

    const espnData = await fetchMastersScores();
    if (!espnData) {
      return NextResponse.json(
        { error: "Could not fetch ESPN scores" },
        { status: 502 }
      );
    }

    const supabase = createServiceClient();

    // Get existing golfers to match by ESPN ID (also grab current position for movement tracking)
    const { data: existingGolfers } = await supabase
      .from("golfers")
      .select("id, espn_id, position");

    const espnIdToDbId = new Map<string, number>();
    const dbIdToCurrentPos = new Map<number, string>();
    (existingGolfers || []).forEach((g: any) => {
      if (g.espn_id) espnIdToDbId.set(g.espn_id, g.id);
      if (g.position) dbIdToCurrentPos.set(g.id, g.position);
    });

    let updated = 0;
    let skipped = 0;

    for (const competitor of espnData.competitors) {
      const update = mapESPNToGolferUpdate(competitor);
      const dbId = espnIdToDbId.get(update.espn_id);

      if (dbId) {
        // Save current position as prev_position before overwriting
        const currentPos = dbIdToCurrentPos.get(dbId);
        // Only overwrite thru if ESPN provides a value (preserve manual tee times)
        const updateData: Record<string, any> = {
            total_score: update.total_score,
            round1: update.round1,
            round2: update.round2,
            round3: update.round3,
            round4: update.round4,
            status: update.status,
            position: update.position,
            prev_position: currentPos || null,
            scorecard: update.scorecard,
            updated_at: update.updated_at,
          };
        if (update.thru) {
          updateData.thru = update.thru;
        }
        const { error } = await supabase
          .from("golfers")
          .update(updateData)
          .eq("id", dbId);

        if (error) {
          console.error(`Failed to update ${update.name}:`, error);
          skipped++;
        } else {
          updated++;
        }
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      tournamentState: espnData.tournamentState,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Score update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

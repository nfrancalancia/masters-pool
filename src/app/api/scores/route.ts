import { NextResponse } from "next/server";
import { fetchMastersScores, mapESPNToGolferUpdate } from "@/lib/espn";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/scores - Fetch latest scores from ESPN and update database
export async function GET() {
  try {
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
        const { error } = await supabase
          .from("golfers")
          .update({
            total_score: update.total_score,
            round1: update.round1,
            round2: update.round2,
            round3: update.round3,
            round4: update.round4,
            status: update.status,
            thru: update.thru,
            position: update.position,
            prev_position: currentPos || null,
            updated_at: update.updated_at,
          })
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

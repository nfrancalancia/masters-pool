import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/simulate - Simulate Round 2 progress for Jacob Bridgeman
// Bridgeman shoots 2, 1, 3, 4 on holes 1-4 (par 4, 5, 4, 3 = 16)
// That's 10 strokes on 16 par = -6 through 4 holes of R2
// R1 was -1, so new total = -7, thru 4 holes
//
// POST /api/simulate with { action: "reset" } to undo

const BRIDGEMAN_ESPN_ID = "5054388";

export async function GET() {
  const supabase = createServiceClient();

  // Get all golfers so we can snapshot positions for movement tracking
  const { data: allGolfers } = await supabase.from("golfers").select("id, position, espn_id, scorecard, total_score, thru");
  const golfer = (allGolfers || []).find((g: any) => g.espn_id === BRIDGEMAN_ESPN_ID);

  if (!golfer) {
    return NextResponse.json({ error: "Bridgeman not found" }, { status: 404 });
  }

  // Snapshot positions and assign fake R2 tee times to players who haven't started
  const teeTimes = [
    "7:30 AM", "7:41 AM", "7:52 AM", "8:03 AM", "8:14 AM", "8:25 AM",
    "8:36 AM", "8:47 AM", "8:58 AM", "9:09 AM", "9:20 AM", "9:31 AM",
    "9:42 AM", "9:53 AM", "10:04 AM", "10:15 AM", "10:26 AM", "10:37 AM",
    "10:48 AM", "10:59 AM", "11:10 AM", "11:21 AM", "11:32 AM", "11:43 AM",
    "11:54 AM", "12:05 PM", "12:16 PM", "12:27 PM", "12:38 PM", "12:49 PM",
  ];
  let teeIdx = 0;
  for (const g of (allGolfers || [])) {
    const update: Record<string, any> = { prev_position: g.position };
    // Give non-Bridgeman players a tee time (they haven't started R2)
    if (g.espn_id !== BRIDGEMAN_ESPN_ID) {
      update.thru = teeTimes[teeIdx % teeTimes.length];
      teeIdx++;
    }
    await supabase.from("golfers").update(update).eq("id", g.id);
  }

  const prevPosition = golfer.position;

  // Simulate: R2 in progress, 4 holes played
  // Strokes through 4 holes: 2+1+3+4 = 10
  // Par through 4 holes: 4+5+4+3 = 16
  // R2 score so far: -6 relative to par
  // Total tournament score: R1(-1) + R2 thru 4(-6) = -7
  //
  // Build scorecard: keep existing R1 data, add partial R2
  const existingScorecard = golfer.scorecard || { rounds: [] };
  const r1Rounds = (existingScorecard.rounds || []).filter((r: any) => r.round !== 2);
  const r2Holes = [
    { hole: 1, strokes: 2, par: 4, score: -2 },  // eagle
    { hole: 2, strokes: 1, par: 5, score: -4 },  // albatross (hole-in-one on par 5! wild)
    { hole: 3, strokes: 3, par: 4, score: -1 },  // birdie
    { hole: 4, strokes: 4, par: 3, score: 1 },   // bogey
  ];
  const simulatedScorecard = {
    rounds: [
      ...r1Rounds,
      { round: 2, strokes: 10, holes: r2Holes },
    ],
  };

  const { error } = await supabase
    .from("golfers")
    .update({
      total_score: -7,
      thru: "4",
      position: "1",          // He'd be leading at -7
      prev_position: prevPosition, // Save old position for movement arrow
      scorecard: simulatedScorecard,
      // round2 stays null since round isn't complete
    })
    .eq("espn_id", BRIDGEMAN_ESPN_ID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    simulation: {
      player: "Jacob Bridgeman",
      before: { total_score: golfer.total_score, position: golfer.position, thru: golfer.thru },
      after: { total_score: -7, position: "1", thru: "4", prev_position: prevPosition },
      description: "R2 holes 1-4: eagle(2), albatross(1), birdie(3), bogey(4) = -6 thru 4. Total: -7 (leading).",
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action !== "reset") {
    return NextResponse.json({ error: "Use { action: 'reset' }" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get current data to extract R1 scorecard
  const { data: golfer } = await supabase
    .from("golfers")
    .select("scorecard")
    .eq("espn_id", BRIDGEMAN_ESPN_ID)
    .single();

  // Keep only R1 scorecard data
  const existingScorecard = golfer?.scorecard || { rounds: [] };
  const r1Only = {
    rounds: (existingScorecard.rounds || []).filter((r: any) => r.round === 1),
  };

  // Reset all players: clear prev_position and fake tee times
  await supabase.from("golfers").update({ prev_position: null, thru: "" }).neq("espn_id", BRIDGEMAN_ESPN_ID);

  // Reset Bridgeman back to R1-only state
  const { error } = await supabase
    .from("golfers")
    .update({
      total_score: -1,
      thru: "",
      position: "15",
      prev_position: null,
      round2: null,
      scorecard: r1Only,
    })
    .eq("espn_id", BRIDGEMAN_ESPN_ID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "All players reset: Bridgeman to R1-only state, tee times and movement cleared",
  });
}

import { NextRequest, NextResponse } from "next/server";

const MASTERS_EVENT_ID = "401811941";

// GET /api/scorecard?espnId=1234
// Fetches hole-by-hole scorecard from ESPN for a specific golfer
export async function GET(request: NextRequest) {
  const espnId = request.nextUrl.searchParams.get("espnId");
  if (!espnId) {
    return NextResponse.json({ error: "espnId required" }, { status: 400 });
  }

  try {
    // ESPN summary endpoint contains full scorecard data
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/golf/pga/summary?event=${MASTERS_EVENT_ID}`,
      { next: { revalidate: 120 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "ESPN API error" }, { status: 502 });
    }

    const data = await res.json();

    // Find the competitor in the data
    const competitors = data?.competitions?.[0]?.competitors ||
      data?.events?.[0]?.competitions?.[0]?.competitors || [];

    const competitor = competitors.find(
      (c: any) => c.athlete?.id === espnId || c.id === espnId
    );

    if (!competitor) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Extract scorecard / linescores
    const rounds = (competitor.linescores || []).map((ls: any) => ({
      round: ls.period,
      strokes: ls.value,
      displayValue: ls.displayValue,
    }));

    // Try to get hole-by-hole from scorecard if available
    const scorecard = competitor.scorecard || competitor.statistics || null;
    let holes: any[] = [];

    if (scorecard?.rounds) {
      holes = scorecard.rounds.map((round: any) => ({
        round: round.period || round.roundNumber,
        holes: (round.linescores || round.holes || []).map((h: any) => ({
          hole: h.period || h.number,
          strokes: h.value,
          par: h.par,
          score: h.score, // relative to par
        })),
      }));
    }

    return NextResponse.json({
      name: competitor.athlete?.displayName || "Unknown",
      position: competitor.sortOrder || competitor.status?.position?.id,
      score: competitor.score,
      rounds,
      holes,
      status: competitor.status?.type?.name || "active",
      thru: competitor.status?.displayValue || "",
    });
  } catch (err) {
    console.error("Scorecard fetch error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

const MASTERS_EVENT_ID = "401811941";
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/golf/pga";

// GET /api/scorecard?espnId=1234
// Fetches hole-by-hole scorecard from ESPN scoreboard data
export async function GET(request: NextRequest) {
  const espnId = request.nextUrl.searchParams.get("espnId");
  if (!espnId) {
    return NextResponse.json({ error: "espnId required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${ESPN_BASE}/scoreboard`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "ESPN API error" }, { status: 502 });
    }

    const data = await res.json();

    const events = data?.events || [];
    const masters = events.find(
      (e: any) => e.id === MASTERS_EVENT_ID || e.name?.includes("Masters")
    );
    if (!masters) {
      return NextResponse.json({ error: "Masters not found" }, { status: 404 });
    }

    const competitors = masters.competitions?.[0]?.competitors || [];
    const competitor = competitors.find(
      (c: any) => c.athlete?.id === espnId || c.id === espnId
    );

    if (!competitor) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Parse hole-by-hole from nested linescores
    const rounds = (competitor.linescores || [])
      .filter((ls: any) => ls.linescores && ls.linescores.length > 0)
      .map((ls: any) => {
        const holes = ls.linescores.map((h: any) => {
          const strokes = Math.round(h.value);
          const scoreDisplay = h.scoreType?.displayValue || "E";

          // Derive par and score-to-par from scoreType
          let scoreToPar = 0;
          if (scoreDisplay === "E") {
            scoreToPar = 0;
          } else if (scoreDisplay.startsWith("-")) {
            scoreToPar = parseInt(scoreDisplay);
          } else if (scoreDisplay.startsWith("+")) {
            scoreToPar = parseInt(scoreDisplay);
          }

          return {
            hole: h.period,
            strokes,
            par: strokes - scoreToPar,
            score: scoreToPar,
          };
        });

        return {
          round: ls.period,
          strokes: Math.round(ls.value),
          displayValue: ls.displayValue,
          holes,
        };
      });

    return NextResponse.json({ rounds });
  } catch (err) {
    console.error("Scorecard fetch error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

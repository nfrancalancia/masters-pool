# Masters Pool 2026

## Quick Start
```bash
npm install && npm run dev   # http://localhost:3000
```
Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`

Production: `https://masters-pool-2026-vibe.vercel.app` (auto-deploys from `main`)

Force score refresh: `https://masters-pool-2026-vibe.vercel.app/api/scores?force=true`

## Stack
- **Next.js 14** (App Router, all pages are `"use client"`)
- **Supabase** (Postgres + Auth, email/password)
- **Tailwind CSS 3.4** with Masters theme (`#006747` green, `#f2c75c` gold, `#f9f6ef` bg)
- **ESPN public API** (no auth key needed) for live scores
- **Vercel** for deployment
- **TypeScript** strict mode, path alias `@/*` → `./src/*`

## Architecture

### Database Tables (Supabase)
| Table | Purpose |
|---|---|
| `profiles` | User display names, commissioner flag. Auto-created on signup via trigger. |
| `pool_settings` | Single-row config: tiers=6, picks_per_tier=1, drop_count=2, missed_cut_penalty=8, deadline, is_locked, invite_code |
| `golfers` | 129 players in 6 tiers. Live score fields: `total_score`, `round1-4` (strokes), `thru`, `position`, `prev_position`, `status`, `odds`, `scorecard` (JSONB) |
| `picks` | User selections: 1 golfer per tier per user. Unique constraint on (user_id, pool_id, tier) |
| `tiebreakers` | Predicted winning total strokes. 1 per user. |

RLS is enabled. Score updates use the **service role client** to bypass RLS.

### Key Files
| File | What it does |
|---|---|
| `src/app/page.tsx` | Main leaderboard. Two tabs: Pool Standings (user rankings) and Tournament Field (all golfers). Expandable scorecards, movement arrows, cut line, today scores. |
| `src/app/picks/page.tsx` | Pick selection UI. 6 tier sections, golfer cards with headshots/odds, tiebreaker input. Locked after deadline. |
| `src/app/admin/page.tsx` | Commissioner controls: lock picks, set deadline, refresh scores, view participants. |
| `src/app/info/page.tsx` | Pool rules and status display. |
| `src/app/login/page.tsx` | Auth (signup + sign in). Hides signup when pool is locked. |
| `src/lib/scoring.ts` | Core scoring: effective score calc, drop worst 2, missed cut penalty, leaderboard ranking. All types exported here (Golfer, Pick, ScorecardData, UserResult, etc). |
| `src/lib/espn.ts` | ESPN API integration. Fetches scoreboard, maps competitors to DB updates. Computes total_score from hole-by-hole data using Augusta par values. |
| `src/lib/golfer-images.ts` | ESPN CDN headshot URLs with PGA Tour fallback map. |
| `src/lib/supabase/client.ts` | Browser Supabase client (anon key). |
| `src/lib/supabase/server.ts` | Server Supabase client + service role client for score updates. |
| `src/app/api/scores/route.ts` | Score refresh endpoint. Polls ESPN, updates all golfers. Gated to 4am-7pm PST during tournament (Apr 9-12). `?force=true` bypasses. |
| `src/app/api/admin/route.ts` | Commissioner actions: claim role, toggle lock, update deadline. |
| `src/app/api/simulate/route.ts` | Dev/demo: simulate R2 progress for testing. |
| `src/app/components/NavBar.tsx` | Header with auth state and navigation. |
| `supabase/` | SQL migration files for schema, seed data, odds, fixes. |

## Scoring Rules
1. Each user picks **1 golfer from each of 6 tiers** (6 total picks)
2. **Drop worst 2** scores → sum the best 4
3. Golfer score = `total_score` (cumulative to par, e.g., -5)
4. **Missed cut penalty**: +8 per unplayed round (R3/R4) added to total
5. **Tiebreaker**: predicted winning score (total strokes, e.g., 275). Closer wins.
6. Lowest combined score wins

## ESPN Integration Details

### API
- Endpoint: `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard`
- Masters Event ID: `401811941`
- Cached 60s via Next.js `revalidate`

### Data Mapping (`mapESPNToGolferUpdate`)
- **total_score**: Computed from hole-by-hole scorecard data (NOT ESPN's `score` field which can be stale). Sums `strokes - par` for each hole across all rounds.
- **round1-4**: Only set when round has 18 holes complete. Value is total strokes (e.g., 69).
- **scorecard**: JSONB `{ rounds: [{ round: 1, strokes: 69, holes: [{ hole: 1, strokes: 4, par: 4, score: 0 }, ...] }] }`
- **thru**: Computed from highest round's hole count. "F" when 18, hole number when in-progress. Empty preserves tee times.
- **position**: ESPN's `order` field (numeric, for tie-breaking sort)
- **status**: Parsed from ESPN `status.type.name` → "active"/"cut"/"wd"/"dq"
- **Augusta par**: `[4, 5, 4, 3, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 5, 3, 4, 4]` (total 72). Hardcoded in both `espn.ts` and `page.tsx`.

### Known ESPN API Quirks
- **No `status` object on competitors** in some responses — must compute `thru` from scorecard holes
- **No tee time data** — tee times are manually entered via SQL and preserved by only overwriting `thru` when ESPN provides a value
- **`score` field can be stale** while `linescores` (scorecard) updates — that's why we compute total_score from holes
- **`scoreType.displayValue` per hole is unreliable** — we use Augusta par values instead of ESPN's score-to-par
- **Golfer names may differ** from what users expect — always use `espn_id` for matching, never `name`

## Frontend Patterns

### Tournament Field View (page.tsx)
- Sorted by `total_score` ascending, ESPN `position` as tiebreaker
- **Display positions**: Computed with ties (T1, T1, 3, T4...)
- **Today score**: Shows current round's score-to-par. Determined by `currentRound` (highest round any golfer has scorecard data for). Shows "-" if player hasn't started the current round. Shows score even after round completion — only resets when next round begins.
- **Movement arrows**: `prevRoundRank - currentRank`. Previous round rank computed from cumulative scores through `currentRound - 1`. Generalizes across all rounds (R2 compares to R1 ranks, R3 to R2 ranks, etc).
- **Cut line**: Dashed red line at projected cut score (+4). Label switches from "Projected Cut" to "Cut Line" when ESPN marks players with `status: "cut"`. Players below cut show at 50% opacity.
- **Expanded scorecard**: Round tiles (R1-R4) with hole-by-hole grid. Birdie=green circle, Eagle=double yellow circle, Bogey=red square, Double+=double red square.

### Pool Standings View (page.tsx)
- Users ranked by combined score of best 4 (after dropping worst 2)
- Expandable rows show each user's 6 picks with tier, golfer name, headshot, score, odds
- Dropped scores at 40% opacity
- Missed cut golfers in red with penalty shown

### Score Refresh Flow
1. Page loads → calls `/api/scores` (auto-gated to tournament hours)
2. API fetches ESPN → maps to DB updates → writes to `golfers` table
3. Page polls every 60s during tournament (`setInterval`)
4. After API returns → page re-reads all data from Supabase
5. Tournament state badge: "Not Started" / "LIVE" / "Final"

## SQL Updates
When updating golfer data manually (odds, tee times, fixes), **always use `espn_id`** not `name`:
```sql
UPDATE golfers SET odds = '+500' WHERE espn_id = '9938';
```
Player names in ESPN can differ from DB names, causing silent misses.

SQL files go in `supabase/` directory. User runs them manually in Supabase SQL editor.

## Common Tasks

### Update Odds
Create SQL file with `UPDATE golfers SET odds = '+X' WHERE espn_id = 'Y'` for each golfer. Odds shown in Pool Standings (next to golfer names) and My Picks page.

### Add Tee Times
Set `thru` column with time string (e.g., "7:30 AM"). The frontend detects tee times by checking if `thru` contains `:` and renders in gray-400. Score refresh preserves tee times by only overwriting `thru` when ESPN provides data.

### Fix Player Data
Always match by `espn_id`. Create SQL file in `supabase/`. For scorecard fixes, update the `scorecard` JSONB column directly.

### Deployment
Push to `main` → Vercel auto-deploys. Build command: `next build`. No special config needed.

After deploying code that changes score computation, hit `/api/scores?force=true` to recompute all golfer data.

## Mobile Sizing (iPhone 13, 390pt)
Field view is optimized for mobile:
- Rows: `text-xs` names, `w-6 h-6` headshots, `py-2.5` padding
- Columns: `w-6`(#) + `w-6`(img) + flex(name) + `w-8`(Tot) + `w-8`(Tdy) + `w-10`(Thru) + `w-7`(R1) + `w-7`(R2) + `w-6`(R3) + `w-6`(R4) + `w-4`(chevron)
- Expanded scorecard: `p-1.5` tiles, `w-6` hole cells, 18-22px score icons
- Min container width: 420px (scrolls horizontally on very small screens)

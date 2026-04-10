-- Fix Michael Kim: ESPN shows +1 but actual hole-by-hole totals to +3 (75 strokes)
UPDATE golfers SET
  total_score = 3,
  round1 = 75,
  scorecard = '{
    "rounds": [{
      "round": 1,
      "strokes": 75,
      "holes": [
        {"hole": 1, "strokes": 4, "par": 4, "score": 0},
        {"hole": 2, "strokes": 4, "par": 5, "score": -1},
        {"hole": 3, "strokes": 4, "par": 4, "score": 0},
        {"hole": 4, "strokes": 3, "par": 3, "score": 0},
        {"hole": 5, "strokes": 5, "par": 4, "score": 1},
        {"hole": 6, "strokes": 3, "par": 3, "score": 0},
        {"hole": 7, "strokes": 5, "par": 4, "score": 1},
        {"hole": 8, "strokes": 5, "par": 5, "score": 0},
        {"hole": 9, "strokes": 4, "par": 4, "score": 0},
        {"hole": 10, "strokes": 4, "par": 4, "score": 0},
        {"hole": 11, "strokes": 4, "par": 4, "score": 0},
        {"hole": 12, "strokes": 4, "par": 3, "score": 1},
        {"hole": 13, "strokes": 5, "par": 5, "score": 0},
        {"hole": 14, "strokes": 5, "par": 4, "score": 1},
        {"hole": 15, "strokes": 5, "par": 5, "score": 0},
        {"hole": 16, "strokes": 3, "par": 3, "score": 0},
        {"hole": 17, "strokes": 4, "par": 4, "score": 0},
        {"hole": 18, "strokes": 4, "par": 4, "score": 0}
      ]
    }]
  }'
WHERE name = 'Michael Kim';

-- Fix 3 more incorrect ESPN IDs found after Round 1 score matching
UPDATE golfers SET espn_id = '7081' WHERE name = 'Si Woo Kim';
UPDATE golfers SET espn_id = '8961' WHERE name = 'Sepp Straka';
UPDATE golfers SET espn_id = '9126' WHERE name = 'Corey Conners';

-- Tom Kim is not in the 2026 Masters field — mark as withdrawn
-- Keep in DB in case anyone picked him (missed cut penalty will apply)
UPDATE golfers SET status = 'wd' WHERE name = 'Tom Kim';

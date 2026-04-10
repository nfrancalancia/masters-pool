-- Fix incorrect ESPN IDs for 8 golfers
UPDATE golfers SET espn_id = '4375972' WHERE name = 'Ludvig Aberg';
UPDATE golfers SET espn_id = '569' WHERE name = 'Justin Rose';
UPDATE golfers SET espn_id = '11378' WHERE name = 'Robert MacIntyre';
UPDATE golfers SET espn_id = '4690755' WHERE name = 'Chris Gotterup';
UPDATE golfers SET espn_id = '5467' WHERE name = 'Jordan Spieth';
UPDATE golfers SET espn_id = '4848' WHERE name = 'Justin Thomas';
UPDATE golfers SET espn_id = '9530' WHERE name = 'Maverick McNealy';
UPDATE golfers SET espn_id = '5553' WHERE name = 'Tyrrell Hatton';

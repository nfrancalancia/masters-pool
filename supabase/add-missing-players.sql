-- Add 13 players found in ESPN Masters field but missing from our database
-- All added as Tier 6
INSERT INTO golfers (name, espn_id, tier) VALUES
('Aaron Rai', '10906', 6),
('Aldrich Potgieter', '5080439', 6),
('Ben Griffin', '4404992', 6),
('Gary Woodland', '3550', 6),
('Harris English', '5408', 6),
('Harry Hall', '4589438', 6),
('J.J. Spaun', '10166', 6),
('Jackson Herrington', '5344766', 6),
('Jacob Bridgeman', '5054388', 6),
('Marco Penge', '4585549', 6),
('Michael Brennan', '4921329', 6),
('Naoyuki Kataoka', '4837226', 6),
('Sergio Garcia', '158', 6)
ON CONFLICT DO NOTHING;

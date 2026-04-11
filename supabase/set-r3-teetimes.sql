-- R3 Tee Times (Saturday April 11, 2026) - Eastern Time
-- Clear thru for all cut/WD players first
UPDATE golfers SET thru = NULL WHERE status IN ('cut', 'wd', 'dq');

-- Also mark cut status for players who were +5 or worse after R2
-- (R1 + R2 > 148 = over +4 cut line)
UPDATE golfers SET status = 'cut' WHERE round1 IS NOT NULL AND round2 IS NOT NULL AND (round1 + round2) > 148 AND status = 'active';

-- R3 tee times (ET converted to display)
UPDATE golfers SET thru = '9:31 AM' WHERE name = 'Kurt Kitayama';
UPDATE golfers SET thru = '9:31 AM' WHERE name = 'Alex Noren';
UPDATE golfers SET thru = '9:42 AM' WHERE name = 'Charl Schwartzel';
UPDATE golfers SET thru = '9:42 AM' WHERE espn_id = '11253'; -- Rasmus Hojgaard
UPDATE golfers SET thru = '9:53 AM' WHERE espn_id = '9780'; -- Jon Rahm
UPDATE golfers SET thru = '9:53 AM' WHERE espn_id = '7081'; -- Si Woo Kim
UPDATE golfers SET thru = '10:04 AM' WHERE espn_id = '1225'; -- Brian Harman
UPDATE golfers SET thru = '10:04 AM' WHERE espn_id = '9126'; -- Corey Conners
UPDATE golfers SET thru = '10:15 AM' WHERE espn_id = '158'; -- Sergio Garcia
UPDATE golfers SET thru = '10:15 AM' WHERE espn_id = '9530'; -- Maverick McNealy
UPDATE golfers SET thru = '10:26 AM' WHERE espn_id = '4513'; -- Keegan Bradley
UPDATE golfers SET thru = '10:26 AM' WHERE espn_id = '4364873'; -- Viktor Hovland
UPDATE golfers SET thru = '10:37 AM' WHERE espn_id = '4848'; -- Justin Thomas
UPDATE golfers SET thru = '10:37 AM' WHERE espn_id = '3550'; -- Gary Woodland
UPDATE golfers SET thru = '10:48 AM' WHERE espn_id = '4426181'; -- Sam Stevens
UPDATE golfers SET thru = '10:48 AM' WHERE espn_id = '388'; -- Adam Scott
UPDATE golfers SET thru = '11:10 AM' WHERE espn_id = '4585549'; -- Marco Penge
UPDATE golfers SET thru = '11:10 AM' WHERE espn_id = '4901368'; -- Matt McCarty
UPDATE golfers SET thru = '11:21 AM' WHERE espn_id = '5467'; -- Jordan Spieth
UPDATE golfers SET thru = '11:21 AM' WHERE espn_id = '8961'; -- Sepp Straka
UPDATE golfers SET thru = '11:32 AM' WHERE espn_id = '10906'; -- Aaron Rai
UPDATE golfers SET thru = '11:32 AM' WHERE espn_id = '5054388'; -- Jacob Bridgeman
UPDATE golfers SET thru = '11:43 AM' WHERE espn_id = '6007'; -- Patrick Cantlay
UPDATE golfers SET thru = '11:43 AM' WHERE espn_id = '11382'; -- Sungjae Im
UPDATE golfers SET thru = '11:54 AM' WHERE espn_id = '3448'; -- Dustin Johnson
UPDATE golfers SET thru = '11:54 AM' WHERE espn_id = '5409'; -- Russell Henley
UPDATE golfers SET thru = '12:16 PM' WHERE espn_id = '4375972'; -- Ludvig Aberg
UPDATE golfers SET thru = '12:16 PM' WHERE espn_id = '9478'; -- Scottie Scheffler
UPDATE golfers SET thru = '12:38 PM' WHERE espn_id = '10592'; -- Collin Morikawa
UPDATE golfers SET thru = '12:38 PM' WHERE espn_id = '9525'; -- Brian Campbell
UPDATE golfers SET thru = '12:49 PM' WHERE espn_id = '3792'; -- Nick Taylor
UPDATE golfers SET thru = '12:49 PM' WHERE espn_id = '9037'; -- Matt Fitzpatrick
UPDATE golfers SET thru = '1:00 PM' WHERE espn_id = '5860'; -- Hideki Matsuyama
UPDATE golfers SET thru = '1:00 PM' WHERE espn_id = '4921329'; -- Michael Brennan
UPDATE golfers SET thru = '1:11 PM' WHERE espn_id = '9843'; -- Jake Knapp
UPDATE golfers SET thru = '1:11 PM' WHERE espn_id = '10140'; -- Xander Schauffele
UPDATE golfers SET thru = '1:22 PM' WHERE espn_id = '4404992'; -- Ben Griffin
UPDATE golfers SET thru = '1:22 PM' WHERE espn_id = '8973'; -- Max Homa
UPDATE golfers SET thru = '1:33 PM' WHERE espn_id = '4690755'; -- Chris Gotterup
UPDATE golfers SET thru = '1:33 PM' WHERE espn_id = '6798'; -- Brooks Koepka
UPDATE golfers SET thru = '1:55 PM' WHERE espn_id = '1680'; -- Jason Day
UPDATE golfers SET thru = '1:55 PM' WHERE espn_id = '4425906'; -- Cameron Young
UPDATE golfers SET thru = '2:06 PM' WHERE espn_id = '9221'; -- Haotong Li
UPDATE golfers SET thru = '2:06 PM' WHERE espn_id = '4348470'; -- Kristoffer Reitan
UPDATE golfers SET thru = '2:17 PM' WHERE espn_id = '11119'; -- Wyndham Clark
UPDATE golfers SET thru = '2:17 PM' WHERE espn_id = '5553'; -- Tyrrell Hatton
UPDATE golfers SET thru = '2:28 PM' WHERE espn_id = '4587'; -- Shane Lowry
UPDATE golfers SET thru = '2:28 PM' WHERE espn_id = '5539'; -- Tommy Fleetwood
UPDATE golfers SET thru = '2:39 PM' WHERE espn_id = '5579'; -- Patrick Reed
UPDATE golfers SET thru = '2:39 PM' WHERE espn_id = '569'; -- Justin Rose
UPDATE golfers SET thru = '2:50 PM' WHERE espn_id = '3470'; -- Rory McIlroy
UPDATE golfers SET thru = '2:50 PM' WHERE espn_id = '9938'; -- Sam Burns
UPDATE golfers SET thru = '5:05 AM' WHERE espn_id = '5408'; -- Harris English
UPDATE golfers SET thru = '5:05 AM' WHERE espn_id = '5076021'; -- Ryan Gerard

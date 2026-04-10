-- MASTER FIX: Run this once to set R1 positions + tee times + names
-- This fixes: movement arrows, thru column, player names

-- Step 1: Set R1 final positions for movement tracking (by espn_id, reliable)
UPDATE golfers SET prev_position = '1' WHERE espn_id = '9938';
UPDATE golfers SET prev_position = '2' WHERE espn_id = '3470';
UPDATE golfers SET prev_position = '3' WHERE espn_id = '11119';
UPDATE golfers SET prev_position = '4' WHERE espn_id = '10364';
UPDATE golfers SET prev_position = '5' WHERE espn_id = '1680';
UPDATE golfers SET prev_position = '6' WHERE espn_id = '5579';
UPDATE golfers SET prev_position = '7' WHERE espn_id = '10906';
UPDATE golfers SET prev_position = '8' WHERE espn_id = '4587';
UPDATE golfers SET prev_position = '9' WHERE espn_id = '10140';
UPDATE golfers SET prev_position = '10' WHERE espn_id = '9478';
UPDATE golfers SET prev_position = '11' WHERE espn_id = '5054388';
UPDATE golfers SET prev_position = '12' WHERE espn_id = '5467';
UPDATE golfers SET prev_position = '13' WHERE espn_id = '569';
UPDATE golfers SET prev_position = '14' WHERE espn_id = '9221';
UPDATE golfers SET prev_position = '15' WHERE espn_id = '3792';
UPDATE golfers SET prev_position = '16' WHERE espn_id = '5539';
UPDATE golfers SET prev_position = '17' WHERE espn_id = '3550';
UPDATE golfers SET prev_position = '18' WHERE espn_id = '8973';
UPDATE golfers SET prev_position = '19' WHERE espn_id = '4901368';
UPDATE golfers SET prev_position = '20' WHERE espn_id = '4348470';
UPDATE golfers SET prev_position = '21' WHERE espn_id = '4513';
UPDATE golfers SET prev_position = '22' WHERE espn_id = '5076021';
UPDATE golfers SET prev_position = '23' WHERE espn_id = '5860';
UPDATE golfers SET prev_position = '24' WHERE espn_id = '4848';
UPDATE golfers SET prev_position = '25' WHERE espn_id = '4404992';
UPDATE golfers SET prev_position = '26' WHERE espn_id = '9525';
UPDATE golfers SET prev_position = '27' WHERE espn_id = '388';
UPDATE golfers SET prev_position = '28' WHERE espn_id = '5553';
UPDATE golfers SET prev_position = '29' WHERE espn_id = '4921329';
UPDATE golfers SET prev_position = '30' WHERE espn_id = '4690755';
UPDATE golfers SET prev_position = '31' WHERE espn_id = '6798';
UPDATE golfers SET prev_position = '32' WHERE espn_id = '9843';
UPDATE golfers SET prev_position = '33' WHERE espn_id = '3448';
UPDATE golfers SET prev_position = '34' WHERE espn_id = '4419142';
UPDATE golfers SET prev_position = '35' WHERE espn_id = '5409';
UPDATE golfers SET prev_position = '36' WHERE espn_id = '4425906';
UPDATE golfers SET prev_position = '37' WHERE espn_id = '8961';
UPDATE golfers SET prev_position = '38' WHERE espn_id = '5408';
UPDATE golfers SET prev_position = '39' WHERE espn_id = '158';
UPDATE golfers SET prev_position = '40' WHERE espn_id = '10166';
UPDATE golfers SET prev_position = '41' WHERE espn_id = '4375972';
UPDATE golfers SET prev_position = '42' WHERE espn_id = '329';
UPDATE golfers SET prev_position = '43' WHERE espn_id = '9131';
UPDATE golfers SET prev_position = '44' WHERE espn_id = '9037';
UPDATE golfers SET prev_position = '45' WHERE espn_id = '10592';
UPDATE golfers SET prev_position = '46' WHERE espn_id = '4426181';
UPDATE golfers SET prev_position = '47' WHERE espn_id = '9126';
UPDATE golfers SET prev_position = '48' WHERE espn_id = '1097';
UPDATE golfers SET prev_position = '49' WHERE espn_id = '4364873';
UPDATE golfers SET prev_position = '50' WHERE espn_id = '7081';
UPDATE golfers SET prev_position = '51' WHERE espn_id = '11382';
UPDATE golfers SET prev_position = '52' WHERE espn_id = '5217048';
UPDATE golfers SET prev_position = '53' WHERE espn_id = '5344766';
UPDATE golfers SET prev_position = '54' WHERE espn_id = '780';
UPDATE golfers SET prev_position = '55' WHERE espn_id = '10046';
UPDATE golfers SET prev_position = '56' WHERE espn_id = '4585549';
UPDATE golfers SET prev_position = '57' WHERE espn_id = '686';
UPDATE golfers SET prev_position = '58' WHERE espn_id = '91';
UPDATE golfers SET prev_position = '59' WHERE espn_id = '4589438';
UPDATE golfers SET prev_position = '60' WHERE espn_id = '9530';
UPDATE golfers SET prev_position = '61' WHERE espn_id = '4858859';
UPDATE golfers SET prev_position = '62' WHERE espn_id = '4251';
UPDATE golfers SET prev_position = '63' WHERE espn_id = '4610056';
UPDATE golfers SET prev_position = '64' WHERE espn_id = '5289811';
UPDATE golfers SET prev_position = '65' WHERE espn_id = '3832';
UPDATE golfers SET prev_position = '66' WHERE espn_id = '6007';
UPDATE golfers SET prev_position = '67' WHERE espn_id = '11250';
UPDATE golfers SET prev_position = '68' WHERE espn_id = '8974';
UPDATE golfers SET prev_position = '69' WHERE espn_id = '5293232';
UPDATE golfers SET prev_position = '70' WHERE espn_id = '9780';
UPDATE golfers SET prev_position = '71' WHERE espn_id = '11253';
UPDATE golfers SET prev_position = '72' WHERE espn_id = '11332';
UPDATE golfers SET prev_position = '73' WHERE espn_id = '4348444';
UPDATE golfers SET prev_position = '74' WHERE espn_id = '4304';
UPDATE golfers SET prev_position = '75' WHERE espn_id = '9025';
UPDATE golfers SET prev_position = '76' WHERE espn_id = '4410932';
UPDATE golfers SET prev_position = '77' WHERE espn_id = '65';
UPDATE golfers SET prev_position = '78' WHERE espn_id = '11101';
UPDATE golfers SET prev_position = '79' WHERE espn_id = '392';
UPDATE golfers SET prev_position = '80' WHERE espn_id = '4408316';
UPDATE golfers SET prev_position = '81' WHERE espn_id = '5532';
UPDATE golfers SET prev_position = '82' WHERE espn_id = '4585548';
UPDATE golfers SET prev_position = '83' WHERE espn_id = '11378';
UPDATE golfers SET prev_position = '84' WHERE espn_id = '1225';
UPDATE golfers SET prev_position = '85' WHERE espn_id = '2201886';
UPDATE golfers SET prev_position = '86' WHERE espn_id = '5344763';
UPDATE golfers SET prev_position = '87' WHERE espn_id = '453';
UPDATE golfers SET prev_position = '88' WHERE espn_id = '5327297';
UPDATE golfers SET prev_position = '89' WHERE espn_id = '4837226';
UPDATE golfers SET prev_position = '90' WHERE espn_id = '5080439';
UPDATE golfers SET prev_position = '91' WHERE espn_id = '10058';

-- Step 2: Set ALL tee times by espn_id (reliable, won't miss due to name issues)
UPDATE golfers SET thru = '9:32 AM' WHERE espn_id = '9938';    -- Sam Burns
UPDATE golfers SET thru = '10:44 AM' WHERE espn_id = '3470';   -- Rory McIlroy
UPDATE golfers SET thru = '9:03 AM' WHERE espn_id = '10364';   -- Kurt Kitayama
UPDATE golfers SET thru = '9:56 AM' WHERE espn_id = '1680';    -- Jason Day
UPDATE golfers SET thru = '10:08 AM' WHERE espn_id = '5579';   -- Patrick Reed
UPDATE golfers SET thru = '9:56 AM' WHERE espn_id = '4587';    -- Shane Lowry
UPDATE golfers SET thru = '10:20 AM' WHERE espn_id = '10140';  -- Xander Schauffele
UPDATE golfers SET thru = '6:55 AM' WHERE espn_id = '569';     -- Justin Rose
UPDATE golfers SET thru = '7:19 AM' WHERE espn_id = '9478';    -- Scottie Scheffler
UPDATE golfers SET thru = '7:51 AM' WHERE espn_id = '9221';    -- Haotong Li
UPDATE golfers SET thru = '9:44 AM' WHERE espn_id = '3792';    -- Nick Taylor
UPDATE golfers SET thru = '10:08 AM' WHERE espn_id = '5539';   -- Tommy Fleetwood
UPDATE golfers SET thru = '4:50 AM' WHERE espn_id = '9525';    -- Brian Campbell
UPDATE golfers SET thru = '6:02 AM' WHERE espn_id = '10906';   -- Aaron Rai
UPDATE golfers SET thru = '6:02 AM' WHERE espn_id = '5054388'; -- Jacob Bridgeman
UPDATE golfers SET thru = '7:19 AM' WHERE espn_id = '3550';    -- Gary Woodland
UPDATE golfers SET thru = '8:03 AM' WHERE espn_id = '8973';    -- Max Homa
UPDATE golfers SET thru = '8:51 AM' WHERE espn_id = '4901368'; -- Matt McCarty
UPDATE golfers SET thru = '9:03 AM' WHERE espn_id = '4348470'; -- Kristoffer Reitan
UPDATE golfers SET thru = '9:44 AM' WHERE espn_id = '4513';    -- Keegan Bradley
UPDATE golfers SET thru = '9:44 AM' WHERE espn_id = '5076021'; -- Ryan Gerard
UPDATE golfers SET thru = '10:32 AM' WHERE espn_id = '5860';   -- Hideki Matsuyama
UPDATE golfers SET thru = '4:40 AM' WHERE espn_id = '4426181'; -- Sam Stevens
UPDATE golfers SET thru = '5:02 AM' WHERE espn_id = '11119';   -- Wyndham Clark
UPDATE golfers SET thru = '5:38 AM' WHERE espn_id = '388';     -- Adam Scott
UPDATE golfers SET thru = '6:02 AM' WHERE espn_id = '158';     -- Sergio Garcia
UPDATE golfers SET thru = '6:19 AM' WHERE espn_id = '4921329'; -- Michael Brennan
UPDATE golfers SET thru = '6:43 AM' WHERE espn_id = '4690755'; -- Chris Gotterup
UPDATE golfers SET thru = '6:55 AM' WHERE espn_id = '5467';    -- Jordan Spieth
UPDATE golfers SET thru = '6:55 AM' WHERE espn_id = '6798';    -- Brooks Koepka
UPDATE golfers SET thru = '7:07 AM' WHERE espn_id = '4848';    -- Justin Thomas
UPDATE golfers SET thru = '7:07 AM' WHERE espn_id = '4404992'; -- Ben Griffin
UPDATE golfers SET thru = '9:32 AM' WHERE espn_id = '9843';    -- Jake Knapp
UPDATE golfers SET thru = '9:56 AM' WHERE espn_id = '3448';    -- Dustin Johnson
UPDATE golfers SET thru = '10:08 AM' WHERE espn_id = '4419142'; -- Akshay Bhatia
UPDATE golfers SET thru = '10:32 AM' WHERE espn_id = '5409';   -- Russell Henley
UPDATE golfers SET thru = '10:44 AM' WHERE espn_id = '4425906'; -- Cameron Young
UPDATE golfers SET thru = '7:07 AM' WHERE espn_id = '8961';    -- Sepp Straka
UPDATE golfers SET thru = '7:31 AM' WHERE espn_id = '5408';    -- Harris English
UPDATE golfers SET thru = '7:31 AM' WHERE espn_id = '4589438'; -- Harry Hall
UPDATE golfers SET thru = '8:15 AM' WHERE espn_id = '329';     -- Jose Maria Olazabal
UPDATE golfers SET thru = '9:32 AM' WHERE espn_id = '9131';    -- Cameron Smith
UPDATE golfers SET thru = '10:20 AM' WHERE espn_id = '9037';   -- Matt Fitzpatrick
UPDATE golfers SET thru = '10:32 AM' WHERE espn_id = '10592';  -- Collin Morikawa
UPDATE golfers SET thru = '5:26 AM' WHERE espn_id = '5293232'; -- Ethan Fang
UPDATE golfers SET thru = '6:31 AM' WHERE espn_id = '5553';    -- Tyrrell Hatton
UPDATE golfers SET thru = '6:31 AM' WHERE espn_id = '10166';   -- J.J. Spaun
UPDATE golfers SET thru = '6:43 AM' WHERE espn_id = '4375972'; -- Ludvig Aberg
UPDATE golfers SET thru = '8:39 AM' WHERE espn_id = '1097';    -- Charl Schwartzel
UPDATE golfers SET thru = '10:56 AM' WHERE espn_id = '4364873'; -- Viktor Hovland
UPDATE golfers SET thru = '4:40 AM' WHERE espn_id = '3832';    -- Alex Noren
UPDATE golfers SET thru = '10:56 AM' WHERE espn_id = '6007';   -- Patrick Cantlay
UPDATE golfers SET thru = '4:50 AM' WHERE espn_id = '4348444'; -- Tom McKibbin
UPDATE golfers SET thru = '5:14 AM' WHERE espn_id = '686';     -- Zach Johnson
UPDATE golfers SET thru = '5:14 AM' WHERE espn_id = '4849550'; -- Tom Kim
UPDATE golfers SET thru = '6:19 AM' WHERE espn_id = '9126';    -- Corey Conners
UPDATE golfers SET thru = '7:31 AM' WHERE espn_id = '7081';    -- Si Woo Kim
UPDATE golfers SET thru = '7:51 AM' WHERE espn_id = '5217048'; -- Johnny Keefer
UPDATE golfers SET thru = '8:27 AM' WHERE espn_id = '5344766'; -- Jackson Herrington
UPDATE golfers SET thru = '9:15 AM' WHERE espn_id = '780';     -- Bubba Watson
UPDATE golfers SET thru = '10:20 AM' WHERE espn_id = '10046';  -- Bryson DeChambeau
UPDATE golfers SET thru = '4:40 AM' WHERE espn_id = '11382';   -- Sungjae Im
UPDATE golfers SET thru = '5:14 AM' WHERE espn_id = '11250';   -- Nicolai Hojgaard
UPDATE golfers SET thru = '5:26 AM' WHERE espn_id = '4304';    -- Danny Willett
UPDATE golfers SET thru = '5:38 AM' WHERE espn_id = '9025';    -- Daniel Berger
UPDATE golfers SET thru = '7:31 AM' WHERE espn_id = '4585549'; -- Marco Penge
UPDATE golfers SET thru = '8:15 AM' WHERE espn_id = '4858859'; -- Rasmus Neergaard-Petersen
UPDATE golfers SET thru = '8:39 AM' WHERE espn_id = '4251';    -- Ryan Fox
UPDATE golfers SET thru = '9:03 AM' WHERE espn_id = '4610056'; -- Casey Jarvis
UPDATE golfers SET thru = '10:44 AM' WHERE espn_id = '5289811'; -- Mason Howell
UPDATE golfers SET thru = '6:31 AM' WHERE espn_id = '9530';    -- Maverick McNealy
UPDATE golfers SET thru = '5:50 AM' WHERE espn_id = '91';      -- Fred Couples
UPDATE golfers SET thru = '5:50 AM' WHERE espn_id = '4410932'; -- Min Woo Lee
UPDATE golfers SET thru = '6:43 AM' WHERE espn_id = '9780';    -- Jon Rahm
UPDATE golfers SET thru = '8:27 AM' WHERE espn_id = '65';      -- Angel Cabrera
UPDATE golfers SET thru = '8:51 AM' WHERE espn_id = '11253';   -- Rasmus Hojgaard
UPDATE golfers SET thru = '5:02 AM' WHERE espn_id = '453';     -- Mike Weir
UPDATE golfers SET thru = '5:38 AM' WHERE espn_id = '1225';    -- Brian Harman
UPDATE golfers SET thru = '8:03 AM' WHERE espn_id = '5532';    -- Carlos Ortiz
UPDATE golfers SET thru = '8:27 AM' WHERE espn_id = '4585548'; -- Sami Valimaki
UPDATE golfers SET thru = '5:50 AM' WHERE espn_id = '5327297'; -- Fifa Laopakdee
UPDATE golfers SET thru = '7:19 AM' WHERE espn_id = '11378';   -- Robert MacIntyre
UPDATE golfers SET thru = '9:15 AM' WHERE espn_id = '2201886'; -- Brandon Holtz
UPDATE golfers SET thru = '5:02 AM' WHERE espn_id = '5344763'; -- Mateo Pulcini
UPDATE golfers SET thru = '5:26 AM' WHERE espn_id = '10058';   -- Davis Riley
UPDATE golfers SET thru = '8:03 AM' WHERE espn_id = '4837226'; -- Naoyuki Kataoka
UPDATE golfers SET thru = '8:15 AM' WHERE espn_id = '5080439'; -- Aldrich Potgieter
UPDATE golfers SET thru = '5:14 AM' WHERE espn_id = '8974';    -- Michael Kim
UPDATE golfers SET thru = '8:39 AM' WHERE espn_id = '11101';   -- Max Greyserman
UPDATE golfers SET thru = '9:15 AM' WHERE espn_id = '4408316'; -- Nico Echavarria
UPDATE golfers SET thru = '8:51 AM' WHERE espn_id = '392';     -- Vijay Singh
UPDATE golfers SET thru = '4:50 AM' WHERE espn_id = '11332';   -- Andrew Novak

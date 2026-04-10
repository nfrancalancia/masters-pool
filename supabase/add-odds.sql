-- Add pre-tournament odds column to golfers table
ALTER TABLE golfers ADD COLUMN IF NOT EXISTS odds TEXT;

-- Pre-tournament odds (sourced from ESPN, pre-Round 1)
-- Tier 1
UPDATE golfers SET odds = '+510' WHERE name = 'Scottie Scheffler';
UPDATE golfers SET odds = '+1050' WHERE name = 'Bryson DeChambeau';
UPDATE golfers SET odds = '+900' WHERE name = 'Jon Rahm';
UPDATE golfers SET odds = '+1175' WHERE name = 'Rory McIlroy';
UPDATE golfers SET odds = '+1750' WHERE name = 'Xander Schauffele';
UPDATE golfers SET odds = '+1650' WHERE name = 'Ludvig Aberg';
UPDATE golfers SET odds = '+3100' WHERE name = 'Collin Morikawa';

-- Tier 2
UPDATE golfers SET odds = '+2300' WHERE name = 'Matt Fitzpatrick';
UPDATE golfers SET odds = '+2200' WHERE name = 'Cameron Young';
UPDATE golfers SET odds = '+2250' WHERE name = 'Tommy Fleetwood';
UPDATE golfers SET odds = '+2700' WHERE name = 'Hideki Matsuyama';
UPDATE golfers SET odds = '+3500' WHERE name = 'Robert MacIntyre';
UPDATE golfers SET odds = '+3500' WHERE name = 'Justin Rose';
UPDATE golfers SET odds = '+3300' WHERE name = 'Min Woo Lee';
UPDATE golfers SET odds = '+4200' WHERE name = 'Patrick Reed';

-- Tier 3
UPDATE golfers SET odds = '+5000' WHERE name = 'Si Woo Kim';
UPDATE golfers SET odds = '+4200' WHERE name = 'Jordan Spieth';
UPDATE golfers SET odds = '+3700' WHERE name = 'Brooks Koepka';
UPDATE golfers SET odds = '+4300' WHERE name = 'Chris Gotterup';
UPDATE golfers SET odds = '+5400' WHERE name = 'Russell Henley';
UPDATE golfers SET odds = '+5000' WHERE name = 'Nicolai Hojgaard';
UPDATE golfers SET odds = '+4500' WHERE name = 'Viktor Hovland';
UPDATE golfers SET odds = '+7000' WHERE name = 'Sam Burns';

-- Tier 4
UPDATE golfers SET odds = '+5100' WHERE name = 'Akshay Bhatia';
UPDATE golfers SET odds = '+8000' WHERE name = 'Maverick McNealy';
UPDATE golfers SET odds = '+6400' WHERE name = 'Jake Knapp';
UPDATE golfers SET odds = '+6600' WHERE name = 'Shane Lowry';
UPDATE golfers SET odds = '+6400' WHERE name = 'Patrick Cantlay';
UPDATE golfers SET odds = '+5900' WHERE name = 'Justin Thomas';
UPDATE golfers SET odds = '+6000' WHERE name = 'Adam Scott';
UPDATE golfers SET odds = '+6800' WHERE name = 'Jason Day';
UPDATE golfers SET odds = '+8000' WHERE name = 'Sepp Straka';
UPDATE golfers SET odds = '+8000' WHERE name = 'Tyrrell Hatton';
UPDATE golfers SET odds = '+8000' WHERE name = 'Corey Conners';

-- Tier 5
UPDATE golfers SET odds = '+10000' WHERE name = 'Brian Harman';
UPDATE golfers SET odds = '+10000' WHERE name = 'Wyndham Clark';
UPDATE golfers SET odds = '+10000' WHERE name = 'Max Homa';
UPDATE golfers SET odds = '+12000' WHERE name = 'Dustin Johnson';
UPDATE golfers SET odds = '+10000' WHERE name = 'Sungjae Im';
UPDATE golfers SET odds = '+12000' WHERE name = 'Cameron Smith';
UPDATE golfers SET odds = '+10000' WHERE name = 'Keegan Bradley';
UPDATE golfers SET odds = '+15000' WHERE name = 'Danny Willett';
UPDATE golfers SET odds = '+10000' WHERE name = 'Tom Kim';
UPDATE golfers SET odds = '+10000' WHERE name = 'Kurt Kitayama';
UPDATE golfers SET odds = '+12000' WHERE name = 'Davis Riley';
UPDATE golfers SET odds = '+15000' WHERE name = 'Nick Taylor';
UPDATE golfers SET odds = '+15000' WHERE name = 'Daniel Berger';
UPDATE golfers SET odds = '+15000' WHERE name = 'Ryan Fox';
UPDATE golfers SET odds = '+15000' WHERE name = 'Alex Noren';
UPDATE golfers SET odds = '+12000' WHERE name = 'Max Greyserman';
UPDATE golfers SET odds = '+15000' WHERE name = 'Andrew Novak';

-- Tier 6
UPDATE golfers SET odds = '+100000' WHERE name = 'Fred Couples';
UPDATE golfers SET odds = '+100000' WHERE name = 'Vijay Singh';
UPDATE golfers SET odds = '+50000' WHERE name = 'Bubba Watson';
UPDATE golfers SET odds = '+100000' WHERE name = 'Jose Maria Olazabal';
UPDATE golfers SET odds = '+50000' WHERE name = 'Charl Schwartzel';
UPDATE golfers SET odds = '+100000' WHERE name = 'Mike Weir';
UPDATE golfers SET odds = '+100000' WHERE name = 'Angel Cabrera';
UPDATE golfers SET odds = '+50000' WHERE name = 'Zach Johnson';
UPDATE golfers SET odds = '+25000' WHERE name = 'Carlos Ortiz';
UPDATE golfers SET odds = '+20000' WHERE name = 'Nico Echavarria';
UPDATE golfers SET odds = '+20000' WHERE name = 'Rasmus Hojgaard';
UPDATE golfers SET odds = '+25000' WHERE name = 'Sami Valimaki';
UPDATE golfers SET odds = '+20000' WHERE name = 'Haotong Li';
UPDATE golfers SET odds = '+30000' WHERE name = 'Michael Kim';
UPDATE golfers SET odds = '+25000' WHERE name = 'Matt McCarty';
UPDATE golfers SET odds = '+25000' WHERE name = 'Tom McKibbin';
UPDATE golfers SET odds = '+30000' WHERE name = 'Sam Stevens';
UPDATE golfers SET odds = '+50000' WHERE name = 'Brian Campbell';
UPDATE golfers SET odds = '+50000' WHERE name = 'Kristoffer Reitan';
UPDATE golfers SET odds = '+50000' WHERE name = 'Casey Jarvis';
UPDATE golfers SET odds = '+50000' WHERE name = 'Rasmus Neergaard-Petersen';
UPDATE golfers SET odds = '+100000' WHERE name = 'Johnny Keefer';
UPDATE golfers SET odds = '+100000' WHERE name = 'Mason Howell';
UPDATE golfers SET odds = '+100000' WHERE name = 'Ryan Gerard';
UPDATE golfers SET odds = '+100000' WHERE name = 'Mateo Pulcini';
UPDATE golfers SET odds = '+100000' WHERE name = 'Ethan Fang';
UPDATE golfers SET odds = '+100000' WHERE name = 'Fifa Laopakdee';
UPDATE golfers SET odds = '+100000' WHERE name = 'Brandon Holtz';

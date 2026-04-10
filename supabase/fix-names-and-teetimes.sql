-- Fix player names that may be wrong in DB
UPDATE golfers SET name = 'Min Woo Lee' WHERE name IN ('Kevin Woo Lee', 'M. Woo Lee');
UPDATE golfers SET name = 'Maverick McNealy' WHERE name IN ('Matthew McNealy', 'M. McNealy');
UPDATE golfers SET name = 'Mason Howell' WHERE name IN ('Mark Howell', 'Michael Howell', 'M. Howell');
UPDATE golfers SET name = 'Casey Jarvis' WHERE name IN ('Cameron Jarvis', 'C. Jarvis');
UPDATE golfers SET name = 'Johnny Keefer' WHERE name IN ('Jackson Keefer', 'J. Keefer', 'Jackson Kiefer');
UPDATE golfers SET name = 'Ethan Fang' WHERE name IN ('Eric Fang', 'E. Fang');
UPDATE golfers SET name = 'Sam Stevens' WHERE name IN ('Sahith Stevens', 'S. Stevens');
UPDATE golfers SET name = 'Ryan Gerard' WHERE name IN ('Russell Gerard', 'R. Gerard');
UPDATE golfers SET name = 'Chris Gotterup' WHERE name IN ('Christo Lamprecht', 'Christo Gafterup', 'C. Gotterup');
UPDATE golfers SET name = 'Andrew Novak' WHERE name IN ('A. Novak');
UPDATE golfers SET name = 'Naoyuki Kataoka' WHERE name IN ('Kataoke', 'N. Kataoka');

-- Fix corrected tee times
UPDATE golfers SET thru = '8:03 AM' WHERE name = 'Naoyuki Kataoka';
UPDATE golfers SET thru = '5:26 AM' WHERE name = 'Davis Riley';
UPDATE golfers SET thru = '5:02 AM' WHERE name = 'Martin Pulcini';
UPDATE golfers SET thru = '9:15 AM' WHERE name = 'Ben Holtz';
UPDATE golfers SET thru = '5:50 AM' WHERE name = 'Fah Laopakdee';
UPDATE golfers SET thru = '9:15 AM' WHERE name = 'Noah Echavarria';
UPDATE golfers SET thru = '8:39 AM' WHERE name = 'Matt Greyserman';
UPDATE golfers SET thru = '5:50 AM' WHERE name = 'Min Woo Lee';
UPDATE golfers SET thru = '8:51 AM' WHERE name = 'Rasmus Hojgaard';
UPDATE golfers SET thru = '6:31 AM' WHERE name = 'Maverick McNealy';
UPDATE golfers SET thru = '10:44 AM' WHERE name = 'Mason Howell';
UPDATE golfers SET thru = '9:03 AM' WHERE name = 'Casey Jarvis';
UPDATE golfers SET thru = '7:51 AM' WHERE name = 'Johnny Keefer';
UPDATE golfers SET thru = '4:50 AM' WHERE name = 'Andrew Novak';
UPDATE golfers SET thru = '5:26 AM' WHERE name = 'Ethan Fang';
UPDATE golfers SET thru = '7:31 AM' WHERE name = 'Harris English';
UPDATE golfers SET thru = '10:32 AM' WHERE name = 'Russell Henley';
UPDATE golfers SET thru = '6:43 AM' WHERE name = 'Chris Gotterup';
UPDATE golfers SET thru = '5:38 AM' WHERE name = 'Adam Scott';
UPDATE golfers SET thru = '4:40 AM' WHERE name = 'Sam Stevens';
UPDATE golfers SET thru = '9:44 AM' WHERE name = 'Ryan Gerard';
UPDATE golfers SET thru = '9:03 AM' WHERE name = 'Kristoffer Reitan';
UPDATE golfers SET thru = '8:51 AM' WHERE name = 'Matt McCarty';

-- Fix Michael Kim - should be +3, tee time 5:14 AM
UPDATE golfers SET total_score = 3, thru = '5:14 AM' WHERE name = 'Michael Kim';

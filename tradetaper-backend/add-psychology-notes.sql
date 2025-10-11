-- Add psychological notes to existing trades for testing
UPDATE trades SET notes = 'I was so frustrated after the previous loss that I immediately jumped into this trade without proper analysis. Classic revenge trading behavior. Need to take a break after losses.'
WHERE notes LIKE '%Trade #%' AND "userId" IN (SELECT id FROM users WHERE email = 'demouser@tradetaper.com')
AND id = (SELECT id FROM trades WHERE notes LIKE '%Trade #%' AND "userId" IN (SELECT id FROM users WHERE email = 'demouser@tradetaper.com') ORDER BY "createdAt" LIMIT 1);

UPDATE trades SET notes = 'Saw the price moving up fast and felt like I was missing out. Entered the trade with FOMO instead of waiting for my setup. This cost me dearly as I entered at the worst possible time.'
WHERE notes LIKE '%Trade #%' AND "userId" IN (SELECT id FROM users WHERE email = 'demouser@tradetaper.com')
AND id = (SELECT id FROM trades WHERE notes LIKE '%Trade #%' AND "userId" IN (SELECT id FROM users WHERE email = 'demouser@tradetaper.com') ORDER BY "createdAt" OFFSET 1 LIMIT 1);

UPDATE trades SET notes = 'I was overconfident after my last win and doubled my position size. Greed got the better of me and I ignored my risk management rules completely.'
WHERE notes LIKE '%Trade #%' AND "userId" IN (SELECT id FROM users WHERE email = 'demouser@tradetaper.com')
AND id = (SELECT id FROM trades WHERE notes LIKE '%Trade #%' AND "userId" IN (SELECT id FROM users WHERE email = 'demouser@tradetaper.com') ORDER BY "createdAt" OFFSET 2 LIMIT 1);

UPDATE trades SET notes = 'Perfect setup was forming but I hesitated to enter. By the time I finally pulled the trigger, I had missed the best entry point. My lack of confidence is holding me back.'
WHERE notes LIKE '%Trade #%' AND "userId" IN (SELECT id FROM users WHERE email = 'demouser@tradetaper.com')
AND id = (SELECT id FROM trades WHERE notes LIKE '%Trade #%' AND "userId" IN (SELECT id FROM users WHERE email = 'demouser@tradetaper.com') ORDER BY "createdAt" OFFSET 3 LIMIT 1);

UPDATE trades SET notes = 'Market was volatile and I was feeling anxious about every small movement. Ended up closing the trade early due to fear, missing out on a profitable move.'
WHERE notes LIKE '%Trade #%' AND "userId" IN (SELECT id FROM users WHERE email = 'demouser@tradetaper.com')
AND id = (SELECT id FROM trades WHERE notes LIKE '%Trade #%' AND "userId" IN (SELECT id FROM users WHERE email = 'demouser@tradetaper.com') ORDER BY "createdAt" OFFSET 4 LIMIT 1); 
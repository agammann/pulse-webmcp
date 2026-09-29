-- Preserve the old verification record and separate it from community statistics.
UPDATE repair_cases SET demo_record = 1
WHERE id = 'MS-FF8FKZ' AND demo_record = 0
AND problem_description = 'Clearly labeled production smoke test: left analog stick drifts upward in the input monitor.'
AND product_id IN (SELECT id FROM products WHERE brand = 'MendSignal QA' AND model = 'WEBMCP-SMOKE-20260829');

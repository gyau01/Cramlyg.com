-- Raw match scores can exceed 1000 (see SCORING.minTotal and weighted sums).
-- numeric(5,2) caps at 999.99 and caused "numeric field overflow" on upsert.

ALTER TABLE public.matches
  ALTER COLUMN compatibility_score TYPE numeric(12, 2)
  USING compatibility_score::numeric;

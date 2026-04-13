-- ============================================================
-- Money Web — Useful Supabase Queries
-- Copy & paste into Supabase SQL Editor
-- ============================================================


-- ── 1. All signals (newest first) ───────────────────────────

SELECT * FROM public.signals ORDER BY timestamp DESC;


-- ── 2. All journal entries (newest first) ───────────────────

SELECT * FROM public.journal_entries ORDER BY timestamp DESC;


-- ── 3. Win/Loss summary ─────────────────────────────────────

SELECT
  COUNT(*)                                          AS total_closed,
  COUNT(*) FILTER (WHERE pnl > 0)                   AS wins,
  COUNT(*) FILTER (WHERE pnl <= 0)                  AS losses,
  ROUND(
    COUNT(*) FILTER (WHERE pnl > 0)::numeric
    / NULLIF(COUNT(*), 0) * 100, 1
  )                                                 AS win_rate_pct,
  ROUND(SUM(pnl)::numeric, 2)                       AS total_pnl_pct,
  ROUND(AVG(pnl)::numeric, 2)                       AS avg_pnl_pct,
  ROUND(MAX(pnl)::numeric, 2)                       AS best_trade_pct,
  ROUND(MIN(pnl)::numeric, 2)                       AS worst_trade_pct
FROM public.signals
WHERE status IN ('tp_hit', 'sl_hit', 'manual_close');


-- ── 4. Performance by pair ──────────────────────────────────

SELECT
  pair,
  COUNT(*)                                          AS trades,
  COUNT(*) FILTER (WHERE pnl > 0)                   AS wins,
  ROUND(
    COUNT(*) FILTER (WHERE pnl > 0)::numeric
    / NULLIF(COUNT(*), 0) * 100, 1
  )                                                 AS win_rate_pct,
  ROUND(SUM(pnl)::numeric, 2)                       AS total_pnl_pct
FROM public.signals
WHERE status IN ('tp_hit', 'sl_hit', 'manual_close')
GROUP BY pair
ORDER BY total_pnl_pct DESC;


-- ── 5. Performance by direction (BUY vs SELL) ───────────────

SELECT
  direction,
  COUNT(*)                                          AS trades,
  COUNT(*) FILTER (WHERE pnl > 0)                   AS wins,
  ROUND(
    COUNT(*) FILTER (WHERE pnl > 0)::numeric
    / NULLIF(COUNT(*), 0) * 100, 1
  )                                                 AS win_rate_pct,
  ROUND(SUM(pnl)::numeric, 2)                       AS total_pnl_pct
FROM public.signals
WHERE status IN ('tp_hit', 'sl_hit', 'manual_close')
GROUP BY direction;


-- ── 6. Active / followed signals right now ──────────────────

SELECT
  id, pair, direction, entry, take_profit, stop_loss,
  confidence, status,
  TO_TIMESTAMP(timestamp / 1000) AT TIME ZONE 'Asia/Bangkok' AS signal_time
FROM public.signals
WHERE status IN ('active', 'followed')
ORDER BY timestamp DESC;


-- ── 7. Signals by confidence bucket ─────────────────────────

SELECT
  CASE
    WHEN confidence >= 80 THEN '80-100 (High)'
    WHEN confidence >= 60 THEN '60-79 (Medium)'
    ELSE 'Below 60 (Low)'
  END AS confidence_bucket,
  COUNT(*)                                          AS total,
  COUNT(*) FILTER (WHERE pnl > 0)                   AS wins,
  ROUND(
    COUNT(*) FILTER (WHERE pnl > 0)::numeric
    / NULLIF(COUNT(*), 0) * 100, 1
  )                                                 AS win_rate_pct,
  ROUND(AVG(pnl)::numeric, 2)                       AS avg_pnl_pct
FROM public.signals
WHERE status IN ('tp_hit', 'sl_hit', 'manual_close')
GROUP BY confidence_bucket
ORDER BY confidence_bucket DESC;


-- ── 8. Daily P&L over time ──────────────────────────────────

SELECT
  TO_CHAR(TO_TIMESTAMP(closed_at / 1000) AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD') AS day,
  COUNT(*)                                          AS trades,
  COUNT(*) FILTER (WHERE pnl > 0)                   AS wins,
  ROUND(SUM(pnl)::numeric, 2)                       AS daily_pnl_pct
FROM public.signals
WHERE closed_at IS NOT NULL
GROUP BY day
ORDER BY day DESC;


-- ── 9. Journal: filtered vs traded signals ──────────────────

SELECT
  CASE WHEN filtered_out THEN 'Filtered Out' ELSE 'Traded' END AS category,
  COUNT(*) AS total,
  filter_reason,
  COUNT(*) AS count_by_reason
FROM public.journal_entries
GROUP BY filtered_out, filter_reason
ORDER BY filtered_out, count_by_reason DESC;


-- ── 10. Journal: would filtered signals have won? ───────────
-- (Checks if your filters are actually saving you from losses)

SELECT
  filter_reason,
  COUNT(*)                                          AS filtered_count,
  COUNT(*) FILTER (WHERE outcome = 'TP_HIT')        AS would_have_won,
  COUNT(*) FILTER (WHERE outcome = 'SL_HIT')        AS would_have_lost,
  COUNT(*) FILTER (WHERE outcome = 'PENDING')       AS still_pending
FROM public.journal_entries
WHERE filtered_out = true
GROUP BY filter_reason
ORDER BY filtered_count DESC;


-- ── 11. Streak tracker (consecutive wins/losses) ────────────

SELECT
  id, pair, direction, pnl, status,
  TO_TIMESTAMP(closed_at / 1000) AT TIME ZONE 'Asia/Bangkok' AS closed_time
FROM public.signals
WHERE status IN ('tp_hit', 'sl_hit', 'manual_close')
ORDER BY closed_at DESC
LIMIT 20;


-- ── 12. Hourly signal heatmap ───────────────────────────────
-- (Which hours produce the best signals?)

SELECT
  EXTRACT(HOUR FROM TO_TIMESTAMP(timestamp / 1000) AT TIME ZONE 'Asia/Bangkok')::int AS hour_utc7,
  COUNT(*)                                          AS signals,
  COUNT(*) FILTER (WHERE pnl > 0)                   AS wins,
  ROUND(AVG(pnl)::numeric, 2)                       AS avg_pnl
FROM public.signals
WHERE status IN ('tp_hit', 'sl_hit', 'manual_close')
GROUP BY hour_utc7
ORDER BY hour_utc7;

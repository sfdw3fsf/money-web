-- ============================================================
-- Money Web – Supabase schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- ── 1. signals table ────────────────────────────────────────

create table if not exists public.signals (
  id            text primary key,
  timestamp     bigint       not null,
  pair          text         not null,
  timeframe     text         not null,
  direction     text         not null check (direction in ('BUY','SELL','WAIT')),
  entry         double precision not null default 0,
  take_profit   double precision not null default 0,
  stop_loss     double precision not null default 0,
  confidence    double precision not null default 0,
  risk_reward   text         not null default '0',
  reasoning     text,
  trend         text,
  support       double precision[] default '{}',
  resistance    double precision[] default '{}',
  status        text         not null default 'active'
                  check (status in ('active','followed','tp_hit','sl_hit','expired','manual_close','skipped')),
  followed      boolean      not null default false,
  followed_at   bigint,
  pnl           double precision,
  closed_at     bigint,
  close_price   double precision,
  created_at    timestamptz  not null default now()
);

-- Index for common queries
create index if not exists idx_signals_timestamp on public.signals (timestamp desc);
create index if not exists idx_signals_pair      on public.signals (pair);
create index if not exists idx_signals_status    on public.signals (status);

-- ── 2. journal_entries table ────────────────────────────────

create table if not exists public.journal_entries (
  id                text primary key,
  timestamp         bigint       not null,
  pair              text         not null,
  direction         text         not null check (direction in ('BUY','SELL','WAIT')),
  entry             double precision not null default 0,
  take_profit       double precision not null default 0,
  stop_loss         double precision not null default 0,
  confidence        double precision not null default 0,
  reasoning         text,

  -- Market context snapshot
  trend15m          text,
  trend5m           text,
  ema20             double precision,
  ema50             double precision,
  rsi               double precision,
  volume_trend      text,
  is_sideways       boolean,
  timeframe_aligned boolean,

  -- Filter data
  filtered_out      boolean      not null default false,
  filter_reason     text,

  -- Outcome (filled later)
  outcome           text         default 'PENDING'
                      check (outcome in ('TP_HIT','SL_HIT','MANUAL_CLOSE','PENDING')),
  actual_exit_price double precision,
  pnl_percent       double precision,
  closed_at         bigint,
  created_at        timestamptz  not null default now()
);

create index if not exists idx_journal_timestamp on public.journal_entries (timestamp desc);
create index if not exists idx_journal_pair      on public.journal_entries (pair);

-- ── 3. Row-Level Security (RLS) ─────────────────────────────
--
-- Since this is a personal dashboard (no auth), we allow public
-- read/write via the anon key. If you add Supabase Auth later,
-- replace these with user-scoped policies.
-- ─────────────────────────────────────────────────────────────

alter table public.signals        enable row level security;
alter table public.journal_entries enable row level security;

-- Allow anon key full access (personal project, single user)
create policy "Allow anon full access on signals"
  on public.signals for all
  using (true) with check (true);

create policy "Allow anon full access on journal_entries"
  on public.journal_entries for all
  using (true) with check (true);

-- ── 4. Enable Realtime ──────────────────────────────────────
-- The app subscribes to INSERT/UPDATE on signals for live sync.

alter publication supabase_realtime add table public.signals;

-- ── Done! ───────────────────────────────────────────────────
-- Copy your Project URL and anon key from:
--   Dashboard → Settings → API
-- Paste them into your .env file:
--   VITE_SUPABASE_URL=https://xxxxx.supabase.co
--   VITE_SUPABASE_ANON_KEY=eyJ...

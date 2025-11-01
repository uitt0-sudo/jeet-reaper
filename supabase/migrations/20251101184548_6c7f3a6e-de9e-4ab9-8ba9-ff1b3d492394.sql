-- Wallet scan log to keep history of analyses
create table wallet_scan_logs (
  id uuid default gen_random_uuid() primary key,
  wallet_address text not null,
  holdings numeric,
  analyzed_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index wallet_scan_logs_wallet_idx on wallet_scan_logs(wallet_address);
create index wallet_scan_logs_created_idx on wallet_scan_logs(created_at desc);

-- Enable RLS
alter table wallet_scan_logs enable row level security;

-- RLS policies for wallet_scan_logs
create policy "Anyone can view wallet scan logs"
  on wallet_scan_logs for select
  using (true);

create policy "Anyone can insert wallet scan logs"
  on wallet_scan_logs for insert
  with check (true);

-- Track daily random rewards distributed to leaderboard wallets
create table daily_random_rewards (
  id uuid default gen_random_uuid() primary key,
  reward_date date not null unique,
  wallet_address text not null,
  sol_amount numeric,
  usd_value numeric default 10,
  sol_price numeric,
  selected_rank integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index daily_random_rewards_wallet_idx on daily_random_rewards(wallet_address);

-- Enable RLS
alter table daily_random_rewards enable row level security;

-- RLS policies for daily_random_rewards
create policy "Anyone can view daily random rewards"
  on daily_random_rewards for select
  using (true);

create policy "Anyone can insert daily random rewards"
  on daily_random_rewards for insert
  with check (true);
-- Leaderboard of wallet holders
create table wallet_holders (
  wallet_address text primary key,
  holdings numeric default 0,
  total_rewards numeric default 0,
  total_cashback numeric default 0,
  random_reward_claimed boolean default false,
  cashback_claimed boolean default false,
  last_reward_at timestamp with time zone,
  last_cashback_at timestamp with time zone,
  last_scan timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create rewards table
create table rewards (
  id uuid default uuid_generate_v4() primary key,
  wallet_address text not null unique,
  reward_amount float not null,
  transaction_signature text,
  claimed_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create cashbacks table
create table cashbacks (
  id uuid default uuid_generate_v4() primary key,
  wallet_address text not null unique,
  amount float not null,
  transaction_signature text,
  claimed_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes
create index rewards_wallet_address_idx on rewards(wallet_address);
create index cashbacks_wallet_address_idx on cashbacks(wallet_address);
create index wallet_holders_random_claimed_idx on wallet_holders(random_reward_claimed);
create index wallet_holders_cashback_claimed_idx on wallet_holders(cashback_claimed);
create index wallet_holders_last_scan_idx on wallet_holders(last_scan);

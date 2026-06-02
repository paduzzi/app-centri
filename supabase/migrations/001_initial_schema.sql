-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: users (extends auth.users)
-- ============================================================
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamptz default now() not null
);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- ============================================================
-- TABLE: cards
-- ============================================================
create table if not exists public.cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  set text not null default '',
  card_number text not null default '',
  rarity text not null default '',
  language text not null default 'IT',
  image_url text,
  created_at timestamptz default now() not null
);

alter table public.cards enable row level security;

create policy "Users can view own cards"
  on public.cards for select
  using (auth.uid() = user_id);

create policy "Users can insert own cards"
  on public.cards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cards"
  on public.cards for update
  using (auth.uid() = user_id);

create policy "Users can delete own cards"
  on public.cards for delete
  using (auth.uid() = user_id);

-- ============================================================
-- TABLE: scans
-- ============================================================
create table if not exists public.scans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  card_id uuid references public.cards(id) on delete set null,
  image_url text not null,
  recognition_result jsonb,
  market_data jsonb,
  profit_analysis jsonb,
  listing_price numeric(10,2),
  scan_type text not null default 'card' check (scan_type in ('card', 'vinted_screenshot', 'multi_card')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'error')),
  created_at timestamptz default now() not null
);

alter table public.scans enable row level security;

create policy "Users can view own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scans"
  on public.scans for update
  using (auth.uid() = user_id);

create policy "Users can delete own scans"
  on public.scans for delete
  using (auth.uid() = user_id);

-- ============================================================
-- TABLE: market_prices
-- ============================================================
create table if not exists public.market_prices (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references public.cards(id) on delete cascade,
  card_name text not null,
  ebay_average numeric(10,2),
  ebay_low numeric(10,2),
  ebay_high numeric(10,2),
  cardmarket_trend numeric(10,2),
  cardmarket_average numeric(10,2),
  vinted_average numeric(10,2),
  currency text not null default 'EUR',
  fetched_at timestamptz default now() not null
);

alter table public.market_prices enable row level security;

create policy "Users can view market prices"
  on public.market_prices for select
  using (true);

create policy "Authenticated users can insert market prices"
  on public.market_prices for insert
  with check (auth.uid() is not null);

-- ============================================================
-- TABLE: watchlists
-- ============================================================
create table if not exists public.watchlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  card_id uuid references public.cards(id) on delete cascade not null,
  target_buy_price numeric(10,2) not null default 0,
  current_market_value numeric(10,2),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, card_id)
);

alter table public.watchlists enable row level security;

create policy "Users can view own watchlist"
  on public.watchlists for select
  using (auth.uid() = user_id);

create policy "Users can insert into own watchlist"
  on public.watchlists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own watchlist"
  on public.watchlists for update
  using (auth.uid() = user_id);

create policy "Users can delete from own watchlist"
  on public.watchlists for delete
  using (auth.uid() = user_id);

-- ============================================================
-- TABLE: transactions
-- ============================================================
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  card_id uuid references public.cards(id) on delete set null,
  buy_price numeric(10,2) not null,
  sell_price numeric(10,2),
  fees numeric(10,2) not null default 0,
  status text not null default 'bought' check (status in ('bought', 'sold', 'watching')),
  created_at timestamptz default now() not null
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

-- ============================================================
-- TABLE: settings
-- ============================================================
create table if not exists public.settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  platform_fee_percent numeric(5,2) not null default 10.00,
  shipping_cost numeric(10,2) not null default 3.50,
  ebay_weight numeric(3,2) not null default 0.50,
  cardmarket_weight numeric(3,2) not null default 0.30,
  vinted_weight numeric(3,2) not null default 0.20,
  ai_provider text not null default 'mock' check (ai_provider in ('mock', 'openai', 'anthropic')),
  ai_api_key text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.settings enable row level security;

create policy "Users can view own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.settings for update
  using (auth.uid() = user_id);

-- ============================================================
-- FUNCTION: auto-create user row on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);

  insert into public.settings (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FUNCTION: update updated_at timestamp
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_watchlists_updated_at
  before update on public.watchlists
  for each row execute function public.update_updated_at();

create trigger update_settings_updated_at
  before update on public.settings
  for each row execute function public.update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_scans_user_id on public.scans(user_id);
create index if not exists idx_scans_created_at on public.scans(created_at desc);
create index if not exists idx_cards_user_id on public.cards(user_id);
create index if not exists idx_watchlists_user_id on public.watchlists(user_id);
create index if not exists idx_market_prices_card_name on public.market_prices(card_name);
create index if not exists idx_market_prices_fetched_at on public.market_prices(fetched_at desc);

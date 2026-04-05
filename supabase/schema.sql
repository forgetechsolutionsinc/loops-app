-- Profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  lat double precision,
  lng double precision,
  neighborhood text,
  onboarded boolean default false,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'New Member'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Activities (seeded)
create table activities (
  id serial primary key,
  name text not null,
  emoji text not null,
  description text
);

insert into activities (name, emoji, description) values
  ('Morning Walk', '🚶', 'A casual walk to start the day'),
  ('Coffee & Work', '☕', 'Co-working at a local cafe'),
  ('Evening Run', '🏃', 'Group jog at a comfortable pace'),
  ('Book Club', '📚', 'Read and discuss together'),
  ('Cooking', '🍳', 'Cook a meal together weekly'),
  ('Art & Sketch', '🎨', 'Draw, paint, or just doodle'),
  ('Board Games', '🎲', 'Casual games night'),
  ('Language Exchange', '🗣️', 'Practice a new language together');

-- User preferences
create table user_preferences (
  id serial primary key,
  user_id uuid references profiles(id) on delete cascade,
  activity_id int references activities(id),
  day_of_week int check (day_of_week between 0 and 6),
  time_slot text check (time_slot in ('morning','afternoon','evening')),
  unique(user_id, activity_id, day_of_week, time_slot)
);

-- Loops
create table loops (
  id uuid primary key default gen_random_uuid(),
  activity_id int references activities(id),
  day_of_week int not null check (day_of_week between 0 and 6),
  time_slot text not null check (time_slot in ('morning','afternoon','evening')),
  time_display text,
  venue_name text,
  venue_address text,
  lat double precision,
  lng double precision,
  max_members int default 6,
  status text default 'active',
  created_at timestamptz default now()
);

-- Loop members
create table loop_members (
  loop_id uuid references loops(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  primary key (loop_id, user_id)
);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  loop_id uuid references loops(id) on delete cascade,
  user_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- RLS policies
alter table profiles enable row level security;
alter table user_preferences enable row level security;
alter table loops enable row level security;
alter table loop_members enable row level security;
alter table messages enable row level security;

-- Profiles: users can read all, update own
create policy "Profiles are viewable by authenticated users" on profiles for select using (auth.uid() is not null);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Activities: public read
-- (no RLS needed, use service role or make public)

-- User preferences: own only
create policy "Users can manage own preferences" on user_preferences for all using (auth.uid() = user_id);

-- Loops: everyone can read active
create policy "Active loops are viewable" on loops for select using (status = 'active');
create policy "Authenticated can create loops" on loops for insert with check (auth.uid() is not null);

-- Loop members: viewable by loop members, joinable by authenticated
create policy "Loop members are viewable" on loop_members for select using (true);
create policy "Authenticated can join loops" on loop_members for insert with check (auth.uid() = user_id);
create policy "Members can leave" on loop_members for delete using (auth.uid() = user_id);

-- Messages: viewable by loop members, sendable by authenticated
create policy "Messages viewable by loop members" on messages for select using (
  exists (select 1 from loop_members where loop_members.loop_id = messages.loop_id and loop_members.user_id = auth.uid())
);
create policy "Loop members can send messages" on messages for insert with check (
  auth.uid() = user_id and
  exists (select 1 from loop_members where loop_members.loop_id = messages.loop_id and loop_members.user_id = auth.uid())
);

-- Indexes
create index idx_loop_members_loop on loop_members(loop_id);
create index idx_loop_members_user on loop_members(user_id);
create index idx_messages_loop on messages(loop_id);
create index idx_user_preferences_user on user_preferences(user_id);

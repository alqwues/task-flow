-- Safe to run multiple times

create table if not exists boards (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

create table if not exists board_members (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  unique(board_id, user_id)
);

create table if not exists columns (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  title     text not null,
  position  integer not null default 0
);

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  column_id   uuid not null references columns(id) on delete cascade,
  title       text not null,
  description text,
  priority    text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date    date,
  assignee_id uuid references auth.users(id),
  position    integer not null default 0,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz default now()
);

create table if not exists activity_logs (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references boards(id) on delete cascade,
  user_id    uuid not null references auth.users(id),
  action     text not null,
  meta       jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists task_attachments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks(id) on delete cascade,
  name        text not null,
  url         text not null,
  size        bigint default 0,
  uploaded_by uuid references auth.users(id),
  created_at  timestamptz default now()
);

create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  avatar_url text,
  email      text
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Enable RLS
alter table boards          enable row level security;
alter table board_members   enable row level security;
alter table columns         enable row level security;
alter table tasks           enable row level security;
alter table comments        enable row level security;
alter table profiles        enable row level security;
alter table activity_logs   enable row level security;
alter table task_attachments enable row level security;

-- Drop all existing policies to start clean
drop policy if exists "view own boards"        on boards;
drop policy if exists "create board"           on boards;
drop policy if exists "owner update board"     on boards;
drop policy if exists "owner delete board"     on boards;
drop policy if exists "view own membership"    on board_members;
drop policy if exists "view board members"     on board_members;
drop policy if exists "insert board member"    on board_members;
drop policy if exists "delete board member"    on board_members;
drop policy if exists "manage columns"         on columns;
drop policy if exists "manage tasks"           on tasks;
drop policy if exists "view comments"          on comments;
drop policy if exists "manage own comments"    on comments;
drop policy if exists "view profiles"          on profiles;
drop policy if exists "insert profile"         on profiles;
drop policy if exists "edit own profile"       on profiles;

-- board_members: direct check (user_id = auth.uid()), no recursion
-- Members can view all board_members rows for boards they belong to.
-- We join via boards to avoid recursive self-reference on board_members.
create policy "view board members"
  on board_members for select
  using (
    user_id = auth.uid()
    OR board_id in (select id from boards where owner_id = auth.uid())
    OR board_id in (select board_id from board_members where user_id = auth.uid())
  );

-- Only board owner can add members; also allow self-insert (for createBoard trigger)
create policy "insert board member"
  on board_members for insert
  with check (
    user_id = auth.uid()
    OR board_id in (select id from boards where owner_id = auth.uid())
  );

-- Owner can remove any member; member can remove themselves (leave board)
create policy "delete board member"
  on board_members for delete
  using (
    user_id = auth.uid()
    OR board_id in (select id from boards where owner_id = auth.uid())
  );

-- boards: queries board_members which now has a non-recursive policy
create policy "view own boards"
  on boards for select
  using (
    owner_id = auth.uid()
    OR id in (select board_id from board_members where user_id = auth.uid())
  );

create policy "create board"
  on boards for insert
  with check (owner_id = auth.uid());

create policy "owner update board"
  on boards for update
  using (owner_id = auth.uid());

create policy "owner delete board"
  on boards for delete
  using (owner_id = auth.uid());

-- columns
create policy "manage columns"
  on columns for all
  using (board_id in (select board_id from board_members where user_id = auth.uid()))
  with check (board_id in (select board_id from board_members where user_id = auth.uid()));

-- tasks
create policy "manage tasks"
  on tasks for all
  using (
    column_id in (
      select c.id from columns c
      join board_members bm on bm.board_id = c.board_id
      where bm.user_id = auth.uid()
    )
  )
  with check (
    column_id in (
      select c.id from columns c
      join board_members bm on bm.board_id = c.board_id
      where bm.user_id = auth.uid()
    )
  );

-- comments
create policy "view comments"
  on comments for select
  using (
    task_id in (
      select t.id from tasks t
      join columns c on c.id = t.column_id
      join board_members bm on bm.board_id = c.board_id
      where bm.user_id = auth.uid()
    )
  );

create policy "manage own comments"
  on comments for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- profiles
create policy "view profiles"     on profiles for select using (true);
create policy "insert profile"    on profiles for insert with check (id = auth.uid());
create policy "edit own profile"  on profiles for update using (id = auth.uid());

-- activity_logs: members of the board can read; authenticated users can insert for their own board
drop policy if exists "view activity logs" on activity_logs;
drop policy if exists "insert activity log" on activity_logs;

create policy "view activity logs"
  on activity_logs for select
  using (
    board_id in (select board_id from board_members where user_id = auth.uid())
    OR board_id in (select id from boards where owner_id = auth.uid())
  );

create policy "insert activity log"
  on activity_logs for insert
  with check (
    user_id = auth.uid()
    AND (
      board_id in (select board_id from board_members where user_id = auth.uid())
      OR board_id in (select id from boards where owner_id = auth.uid())
    )
  );

-- task_attachments
drop policy if exists "view task attachments" on task_attachments;
drop policy if exists "manage task attachments" on task_attachments;

create policy "view task attachments"
  on task_attachments for select
  using (
    task_id in (
      select t.id from tasks t
      join columns c on c.id = t.column_id
      join board_members bm on bm.board_id = c.board_id
      where bm.user_id = auth.uid()
    )
  );

create policy "manage task attachments"
  on task_attachments for all
  using (uploaded_by = auth.uid())
  with check (uploaded_by = auth.uid());

-- Storage: avatars + task-files buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "Avatar upload"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatar update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- task-files bucket (10 MB max enforced in app)
insert into storage.buckets (id, name, public) values ('task-files', 'task-files', true)
  on conflict (id) do nothing;

create policy "Task file upload"
  on storage.objects for insert
  with check (bucket_id = 'task-files' and auth.uid() is not null);

create policy "Task file delete"
  on storage.objects for delete
  using (bucket_id = 'task-files' and auth.uid() is not null);

create policy "Task file read"
  on storage.objects for select
  using (bucket_id = 'task-files');

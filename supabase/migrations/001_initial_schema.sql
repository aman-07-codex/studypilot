-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. PROFILES (Linked to auth.users)
-- ==========================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  current_streak integer default 0 not null,
  last_study_date date,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
alter table public.profiles enable row level security;
create policy "Users can manage own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- ==========================================
-- 2. SUBJECTS
-- ==========================================
create table public.subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null check (trim(name) <> ''),
  color_code text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique (id, user_id) -- Added for composite foreign key targeting
);
create index idx_subjects_user_id on public.subjects(user_id);
alter table public.subjects enable row level security;
create policy "Users can manage own subjects" on subjects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- 3. TOPICS
-- ==========================================
create table public.topics (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null check (trim(name) <> ''),
  is_completed boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique (id, user_id), -- Added for composite foreign key targeting
  foreign key (subject_id, user_id) references public.subjects(id, user_id) on delete cascade
);
create index idx_topics_subject_id on public.topics(subject_id);
create index idx_topics_user_id on public.topics(user_id);
alter table public.topics enable row level security;
create policy "Users can manage own topics" on topics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- 4. EXAMS
-- ==========================================
create table public.exams (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid not null,
  exam_date timestamp with time zone not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique (id, user_id), -- Added for composite foreign key targeting
  foreign key (subject_id, user_id) references public.subjects(id, user_id) on delete cascade
);
create index idx_exams_user_id on public.exams(user_id);
create index idx_exams_subject_id on public.exams(subject_id);
create index idx_exams_user_date on public.exams(user_id, exam_date); -- Composite index
alter table public.exams enable row level security;
create policy "Users can manage own exams" on exams for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- 5. STUDY PLANS
-- ==========================================
create table public.study_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  exam_id uuid not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique (id, user_id), -- Added for composite foreign key targeting
  foreign key (exam_id, user_id) references public.exams(id, user_id) on delete cascade
);
create index idx_study_plans_user_id on public.study_plans(user_id);
create index idx_study_plans_exam_id on public.study_plans(exam_id);
alter table public.study_plans enable row level security;
create policy "Users can manage own study plans" on study_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- 6. STUDY TASKS
-- ==========================================
create table public.study_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  study_plan_id uuid not null,
  topic_id uuid,
  task_date date not null,
  duration_minutes integer not null check (duration_minutes > 0),
  priority text not null check (priority in ('low', 'medium', 'high')),
  is_completed boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  foreign key (study_plan_id, user_id) references public.study_plans(id, user_id) on delete cascade,
  foreign key (topic_id, user_id) references public.topics(id, user_id) on delete set null (topic_id)
);
create index idx_study_tasks_user_id on public.study_tasks(user_id);
create index idx_study_tasks_plan_id on public.study_tasks(study_plan_id);
create index idx_study_tasks_topic_id on public.study_tasks(topic_id);
create index idx_study_tasks_user_date on public.study_tasks(user_id, task_date); -- Composite index
alter table public.study_tasks enable row level security;
create policy "Users can manage own study tasks" on study_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- 7. STUDY SESSIONS
-- ==========================================
create table public.study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic_id uuid,
  duration_minutes integer not null check (duration_minutes > 0),
  started_at timestamp with time zone not null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  foreign key (topic_id, user_id) references public.topics(id, user_id) on delete set null (topic_id)
);
create index idx_study_sessions_user_id on public.study_sessions(user_id);
create index idx_study_sessions_user_start on public.study_sessions(user_id, started_at); -- Composite index
alter table public.study_sessions enable row level security;
create policy "Users can manage own study sessions" on study_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- TRIGGERS: update_updated_at
-- ==========================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_subjects_updated
  before update on public.subjects
  for each row execute procedure public.handle_updated_at();

create trigger on_topics_updated
  before update on public.topics
  for each row execute procedure public.handle_updated_at();

create trigger on_exams_updated
  before update on public.exams
  for each row execute procedure public.handle_updated_at();

create trigger on_study_plans_updated
  before update on public.study_plans
  for each row execute procedure public.handle_updated_at();

create trigger on_study_tasks_updated
  before update on public.study_tasks
  for each row execute procedure public.handle_updated_at();

-- ==========================================
-- TRIGGERS: auto-create profile on signup
-- ==========================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, current_streak)
  values (new.id, new.raw_user_meta_data->>'full_name', 0);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

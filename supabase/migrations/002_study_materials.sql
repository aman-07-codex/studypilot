-- ==========================================
-- 8. STUDY MATERIALS (Notes & PYQs)
-- ==========================================
create table public.study_materials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid not null,
  topic_id uuid,
  material_type text not null check (material_type in ('note', 'pyq')),
  title text not null,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size integer not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  foreign key (subject_id, user_id) references public.subjects(id, user_id) on delete cascade,
  foreign key (topic_id, user_id) references public.topics(id, user_id) on delete cascade,
  
  constraint check_material_type_topic_id check (
    (material_type = 'pyq' and topic_id is null) or
    (material_type = 'note' and topic_id is not null)
  )
);

create index idx_study_materials_user_id on public.study_materials(user_id);
create index idx_study_materials_subject_id on public.study_materials(subject_id);
create index idx_study_materials_topic_id on public.study_materials(topic_id);

alter table public.study_materials enable row level security;

create policy "Users can manage own study materials" on study_materials
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger on_study_materials_updated
  before update on public.study_materials
  for each row execute procedure public.handle_updated_at();

-- ==========================================
-- STORAGE BUCKET: study_materials
-- ==========================================
insert into storage.buckets (id, name, public) 
values ('study_materials', 'study_materials', false)
on conflict (id) do nothing;

create policy "Users can upload their own materials"
  on storage.objects for insert
  with check (
    bucket_id = 'study_materials' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their own materials"
  on storage.objects for select
  using (
    bucket_id = 'study_materials' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own materials"
  on storage.objects for update
  using (
    bucket_id = 'study_materials' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own materials"
  on storage.objects for delete
  using (
    bucket_id = 'study_materials' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

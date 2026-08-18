-- ==========================================
-- 9. MATERIAL EXTRACTION
-- ==========================================
alter table public.study_materials
add column extracted_text text,
add column extraction_status text not null default 'pending' check (extraction_status in ('pending', 'processing', 'completed', 'failed')),
add column extraction_error text,
add column extracted_at timestamp with time zone,
add column extraction_truncated boolean not null default false;

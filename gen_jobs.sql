-- BANNON free model-gen queue (shared by gen_selfhosted_server.mjs and the Colab notebook)
-- Run in Supabase SQL editor. Then: Storage -> New bucket -> name "assets" -> Public.

create table if not exists gen_jobs (
  id uuid primary key default gen_random_uuid(),
  prompt text,
  image_url text,
  character_key text,
  status text default 'queued',   -- queued | running | succeeded | failed
  progress int default 0,
  glb_url text,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- auto-touch updated_at
create or replace function touch_gen_jobs() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_touch_gen_jobs on gen_jobs;
create trigger trg_touch_gen_jobs before update on gen_jobs
  for each row execute function touch_gen_jobs();

-- the notebook grabs the oldest queued job with:  select * from gen_jobs where status='queued' order by created_at limit 1;
create index if not exists gen_jobs_status_idx on gen_jobs (status, created_at);

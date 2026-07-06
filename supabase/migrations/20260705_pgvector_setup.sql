-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your codebase chunks and their embeddings
create table if not exists bannon_codebase (
  id bigserial primary key,
  file_path text not null,
  content text not null,
  embedding vector(1536), -- Adjust the dimension based on your embedding model (e.g., 1536 for OpenAI, or 768 for nomic-embed-text)
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a function to search for code chunks based on vector similarity
create or replace function match_codebase (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  file_path text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    bannon_codebase.id,
    bannon_codebase.file_path,
    bannon_codebase.content,
    1 - (bannon_codebase.embedding <=> query_embedding) as similarity
  from bannon_codebase
  where 1 - (bannon_codebase.embedding <=> query_embedding) > match_threshold
  order by bannon_codebase.embedding <=> query_embedding
  limit match_count;
$$;

-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your codebase chunks and their embeddings
create table if not exists code_embeddings (
  id bigserial primary key,
  file_path text not null,
  content text not null,
  embedding vector(1536), -- 1536 dimensions
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a function to search for code chunks based on vector similarity
create or replace function match_code_embeddings (
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
    code_embeddings.id,
    code_embeddings.file_path,
    code_embeddings.content,
    1 - (code_embeddings.embedding <=> query_embedding) as similarity
  from code_embeddings
  where 1 - (code_embeddings.embedding <=> query_embedding) > match_threshold
  order by code_embeddings.embedding <=> query_embedding
  limit match_count;
$$;

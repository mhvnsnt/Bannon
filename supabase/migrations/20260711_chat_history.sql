CREATE TABLE IF NOT EXISTS chat_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id text NOT NULL,
  user_id text NOT NULL,
  message text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create policy for anon/authenticated 
CREATE POLICY "Enable read access for all users" ON chat_history FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON chat_history FOR INSERT WITH CHECK (true);

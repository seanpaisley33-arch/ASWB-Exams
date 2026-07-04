-- Note for existing databases: Run these ALTER commands to update your live schema
-- ALTER TABLE public.schedule_requests ALTER COLUMN exam_type TYPE TEXT;
-- ALTER TABLE public.schedule_requests RENAME COLUMN daily_study_hours TO study_hours;
-- ALTER TABLE public.schedule_requests ADD COLUMN study_frequency TEXT;
-- ALTER TABLE public.schedule_requests ADD COLUMN phone_number TEXT;
-- ALTER TABLE public.schedule_requests ADD COLUMN location TEXT;
-- ALTER TABLE public.schedule_requests ADD COLUMN preferred_coach TEXT;
-- DROP TYPE exam_type_enum;
-- ALTER TABLE public.chat_messages ADD COLUMN is_edited BOOLEAN DEFAULT false;

-- Create Enums
CREATE TYPE request_status_enum AS ENUM ('pending', 'active', 'reviewed', 'completed');
CREATE TYPE sender_type_enum AS ENUM ('client', 'admin');

-- Create schedule_requests table
CREATE TABLE public.schedule_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    target_exam_date DATE,
    study_frequency TEXT,
    study_hours NUMERIC,
    phone_number TEXT,
    location TEXT,
    preferred_coach TEXT,
    roadblock_notes TEXT,
    status request_status_enum DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES public.schedule_requests(id) ON DELETE CASCADE,
    sender_type sender_type_enum NOT NULL,
    message_body TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    file_url TEXT,
    file_type TEXT,
    file_name TEXT,
    is_edited BOOLEAN DEFAULT false
);

-- Disable Row Level Security (RLS) to allow passwordless token access
ALTER TABLE public.schedule_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;

-- Enable Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create Storage Bucket for Chat Attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true) 
ON CONFLICT (id) DO NOTHING;

-- Set up Storage Security Policies for 'chat-attachments'
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'chat-attachments' );
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'chat-attachments' );
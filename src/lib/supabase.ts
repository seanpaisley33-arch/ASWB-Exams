import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      schedule_requests: {
        Row: {
          id: string
          full_name: string
          email: string
          exam_type: string
          target_exam_date: string | null
          study_frequency: string | null
          study_hours: number | null
          phone_number: string | null
          location: string | null
          preferred_coach: string | null
          roadblock_notes: string | null
          status: 'pending' | 'active' | 'reviewed' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          exam_type: string
          target_exam_date?: string | null
          study_frequency?: string | null
          study_hours?: number | null
          phone_number?: string | null
          location?: string | null
          preferred_coach?: string | null
          roadblock_notes?: string | null
          status?: 'pending' | 'active' | 'reviewed' | 'completed'
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'active' | 'reviewed' | 'completed'
        }
      }
      chat_messages: {
        Row: {
          id: number
          request_id: string
          sender_type: 'client' | 'admin'
          message_body: string | null
          is_read: boolean
          created_at: string
          file_url?: string | null
          file_type?: string | null
          file_name?: string | null
        }
        Insert: {
          id?: number
          request_id: string
          sender_type: 'client' | 'admin'
          message_body?: string | null
          is_read?: boolean
          created_at?: string
          file_url?: string | null
          file_type?: string | null
          file_name?: string | null
        }
        Update: {
          is_read?: boolean
        }
      }
    }
  }
}

export type ScheduleRequest = Database['public']['Tables']['schedule_requests']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']

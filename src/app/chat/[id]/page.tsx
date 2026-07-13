import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { ChatClient } from './ChatClient'
import Link from 'next/link'

import { HeaderContactButtons } from '@/components/HeaderContactButtons'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Fetch request details
  const { data: request, error: requestError } = await supabase
    .from('schedule_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (requestError || !request) {
    notFound()
  }

  // Fetch initial messages
  const { data: messages, error: messagesError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200/50 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between max-w-7xl">
          <Link href="/">
            <h1 className="text-2xl font-extrabold tracking-tighter text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-black leading-none tracking-tighter text-xl">A</span>
              </div>
              ASWB<span className="text-blue-600">Mastery</span>
            </h1>
          </Link>
          <HeaderContactButtons />
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <ChatClient request={request} initialMessages={messages || []} />
      </main>
    </div>
  )
}

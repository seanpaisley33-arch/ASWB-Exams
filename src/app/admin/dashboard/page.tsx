import { supabase } from '@/lib/supabase'
import { DashboardClient } from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const { data: requests } = await supabase
    .from('schedule_requests')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tighter">ASWB<span className="text-blue-400">Mastery</span> <span className="font-light text-slate-400 ml-2">Admin Workspace</span></h1>
          <div className="text-sm font-medium text-slate-300">
            Admin Panel
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <DashboardClient initialRequests={requests || []} initialMessages={messages || []} />
      </main>
    </div>
  )
}

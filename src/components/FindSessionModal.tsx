'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function FindSessionModal() {
  const [requestId, setRequestId] = useState('')
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchSessions = async () => {
      const saved = localStorage.getItem('recent_sessions')
      if (saved) {
        try {
          const ids = JSON.parse(saved)
          if (ids && ids.length > 0) {
            const { data } = await supabase
              .from('schedule_requests')
              .select('id, created_at, exam_type')
              .in('id', ids)
            
            if (data) {
              // Preserve original order from local storage
              const ordered = ids.map((id: string) => data.find(d => d.id === id)).filter(Boolean)
              setRecentSessions(ordered)

              // Purge deleted sessions from local storage
              const validIds = ordered.map(s => s.id)
              if (validIds.length !== ids.length) {
                localStorage.setItem('recent_sessions', JSON.stringify(validIds))
              }
            }
          }
        } catch(e) {}
      }
    }
    fetchSessions()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let id = requestId.trim()
    if (id.includes('/chat/')) {
      id = id.split('/chat/')[1]
    }
    if (id) {
      router.push(`/chat/${id}`)
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={
        <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold h-9 px-4">
          Resume Session
        </Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resume Your Strategy Session</DialogTitle>
          <DialogDescription>
            Enter your unique Request ID or paste your private URL to continue your chat with your coach.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex space-x-2 mt-4">
          <Input 
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="Paste ID or Link here..." 
            className="flex-1"
          />
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            Go
          </Button>
        </form>

        {recentSessions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">RECENT CHATS</span>
            <div className="space-y-2">
              {recentSessions.map((session, index) => (
                <div key={`${session.id}-${index}`} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex flex-col overflow-hidden mr-2">
                    <span className="text-sm font-semibold text-slate-700 truncate">{session.exam_type} Coaching</span>
                    <span className="text-[10px] text-slate-500 truncate">
                      {new Date(session.created_at).toLocaleDateString()} at {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <Button size="sm" variant="secondary" className="h-8 text-xs bg-white hover:bg-slate-100 shrink-0" onClick={() => router.push(`/chat/${session.id}`)}>
                    Resume
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

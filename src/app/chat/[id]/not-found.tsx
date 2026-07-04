'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquareOff, ArrowLeft, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function NotFound() {
  const router = useRouter()
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const saved = localStorage.getItem('recent_sessions')
        if (!saved) {
          setIsLoading(false)
          return
        }

        const ids = JSON.parse(saved)
        if (ids && ids.length > 0) {
          const { data } = await supabase
            .from('schedule_requests')
            .select('id, created_at, exam_type')
            .in('id', ids)
          
          if (data && data.length > 0) {
            // Preserve original order from local storage
            const ordered = ids.map((id: string) => data.find(d => d.id === id)).filter(Boolean)
            setActiveSessions(ordered)

            // Purge deleted sessions from local storage
            const validIds = ordered.map(s => s.id)
            if (validIds.length !== ids.length) {
              localStorage.setItem('recent_sessions', JSON.stringify(validIds))
            }
          } else {
            // If none of the saved IDs exist in the DB, clear the local storage
            localStorage.removeItem('recent_sessions')
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActiveSessions()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageSquareOff className="w-10 h-10 text-slate-400" />
        </div>
        
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Session Not Found</h2>
        
        <p className="text-slate-600 leading-relaxed">
          We couldn't find the coaching session you're looking for. It may have been permanently deleted by an administrator, or the URL might be incorrect.
        </p>

        {!isLoading && activeSessions.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-100 text-left">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-center">
              Your Active Sessions
            </h3>
            <div className="space-y-3">
              {activeSessions.map((session, index) => (
                <div key={`${session.id}-${index}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                  <div className="flex flex-col overflow-hidden mb-3 sm:mb-0 mr-4">
                    <span className="text-sm font-bold text-slate-800 truncate">{session.exam_type} Coaching</span>
                    <span className="text-xs text-slate-500 truncate">
                      Started {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button 
                    onClick={() => router.push(`/chat/${session.id}`)}
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 shrink-0 shadow-none font-semibold w-full sm:w-auto"
                  >
                    Resume <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6">
          <Link href="/">
            <Button variant="outline" className="text-slate-600 h-12 px-8 rounded-full font-medium w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

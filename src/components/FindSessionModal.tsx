'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Info } from 'lucide-react'

export function FindSessionModal({ children }: { children?: React.ReactNode }) {
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
              const validIds = ordered.map((s: any) => s.id)
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

  const [isOpen, setIsOpen] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
    setTimeout(() => {
      setToastVisible(false)
    }, 4000)
  }

  const handleMainClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (recentSessions.length > 0) {
      router.push(`/chat/${recentSessions[0].id}`)
    } else {
      setShowManualInput(false)
      setIsOpen(true)
    }
  }

  const handleGoToForm = () => {
    setIsOpen(false)
    const form = document.getElementById('intake-form')
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => {
        const firstInput = form.querySelector('input')
        if (firstInput) firstInput.focus()
      }, 500)
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Smart Redirect Button */}
      <div onClick={handleMainClick} className="cursor-pointer inline-block w-full text-center">
        {children || (
          <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold h-9 px-3 sm:px-4 text-xs sm:text-sm w-full sm:w-auto">
            <span className="hidden sm:inline">Resume Session</span>
            <span className="sm:hidden">Resume</span>
          </Button>
        )}
      </div>



      {/* The Dialog is now completely controlled */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl">
          {recentSessions.length === 0 && !showManualInput ? (
            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Info className="w-6 h-6" />
              </div>
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-xl font-bold text-slate-900">No Active Session Found</DialogTitle>
                <DialogDescription className="text-sm text-slate-500 max-w-xs">
                  It looks like you haven't submitted the intake form yet. Please fill it out to start chatting with your coach.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col w-full gap-2 pt-2">
                <Button 
                  onClick={handleGoToForm} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 rounded-xl w-full"
                >
                  OK, Let's Start
                </Button>
                <button 
                  onClick={() => setShowManualInput(true)} 
                  className="text-xs text-slate-400 hover:text-blue-600 font-medium py-2 transition-colors"
                >
                  Have a code from another device? Enter it here
                </button>
              </div>
            </div>
          ) : (
            <>
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
              
              {recentSessions.length === 0 && (
                <button 
                  onClick={() => setShowManualInput(false)} 
                  className="text-xs text-slate-400 hover:text-blue-600 font-medium mt-4 transition-colors w-full text-center"
                >
                  ← Back to info
                </button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm w-[90vw] border border-slate-700/50"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm font-medium leading-tight">
              {toastMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

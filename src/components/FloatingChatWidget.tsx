'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase, ChatMessage } from '@/lib/supabase'
import { MessageCircle } from 'lucide-react'

export function FloatingChatWidget() {
  const [requestId, setRequestId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  // Hide the widget completely if the user is on the dedicated chat page or admin dashboard
  const isDedicatedChatPage = pathname?.startsWith('/chat/')
  const isAdminPage = pathname?.startsWith('/admin')

  useEffect(() => {
    // Check local storage for active session
    const saved = localStorage.getItem('recent_sessions')
    if (saved) {
      try {
        const sessions = JSON.parse(saved)
        if (sessions && sessions.length > 0) {
          setRequestId(sessions[0]) // use most recent session
        }
      } catch (e) {}
    }
  }, [pathname])

  useEffect(() => {
    if (!requestId || isDedicatedChatPage || isAdminPage) return

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', requestId)
        .eq('sender_type', 'admin')
        .eq('is_read', false)
      
      setUnreadCount(count || 0)
    }

    fetchUnreadCount()

    const channel = supabase.channel(`widget_${requestId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `request_id=eq.${requestId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          if (newMsg.sender_type === 'admin' && !newMsg.is_read) {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `request_id=eq.${requestId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          // If a message was marked as read
          if (newMsg.sender_type === 'admin' && newMsg.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId, isDedicatedChatPage, isAdminPage])

  if (!requestId || isDedicatedChatPage || isAdminPage) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <button 
        onClick={() => router.push(`/chat/${requestId}`)}
        className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-700 transition-transform hover:scale-105 active:scale-95 relative"
        title="Resume Coaching Session"
      >
        <MessageCircle size={24} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}

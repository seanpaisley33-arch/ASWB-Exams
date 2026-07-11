'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, ScheduleRequest, ChatMessage } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { EditRequestModal } from '@/components/EditRequestModal'
import { MessageAttachment } from '@/components/MessageAttachment'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Send, Clock, BookOpen, ShieldCheck, Copy, Check, Home, Target, Paperclip, Loader2, X, FileIcon, ImageIcon, CheckCheck, Mic, Square, MoreVertical, Edit2, Download, Reply, Trash2, Share, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeToPush } from '@/app/actions'
import { PushNotificationManager } from '@/components/PushNotificationManager'

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function ChatClient({ request, initialMessages }: { request: ScheduleRequest, initialMessages: ChatMessage[] }) {
  const [currentRequest, setCurrentRequest] = useState<ScheduleRequest>(request)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editingMessageText, setEditingMessageText] = useState('')
  const [replyingTo, setReplyingTo] = useState<{id: number, body: string, sender: string} | null>(null)

  // Notification Blocking State
  const [notifState, setNotifState] = useState<'checking' | 'granted' | 'denied' | 'default'>('checking')
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isEnabling, setIsEnabling] = useState(false)
  const [isBypassed, setIsBypassed] = useState(false)
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Detect iOS and Standalone
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)
    
    // Detect In-App Browser (Facebook/Instagram/LinkedIn)
    const isInApp = /fban|fbav|instagram|linkedin/.test(userAgent)
    setIsInAppBrowser(isInApp)

    const isStandaloneMode = ('standalone' in window.navigator) && !!(window.navigator as any).standalone
    setIsStandalone(isStandaloneMode)

    // Check Notification Permission
    if (!('Notification' in window)) {
      setNotifState('granted') // Ignore unsupported browsers completely
    } else {
      setNotifState(Notification.permission)
      
      // Auto-detect permission changes
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'notifications' }).then((status) => {
          status.onchange = () => {
            setNotifState(status.state as any)
          }
        }).catch(console.error)
      }
    }

    // Capture the native PWA install prompt for Android/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    // Mark all unread admin messages as read upon entering the chat
    const markUnreadAsRead = async () => {
      const unreadIds = messages.filter(m => m.sender_type === 'admin' && !m.is_read).map(m => m.id)
      if (unreadIds.length > 0) {
        // Update local state immediately for snappy UI
        setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, is_read: true } : m))
        // Update DB
        await supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds)
      }
    }
    markUnreadAsRead()
  }, [messages.length]) // Only run when total message count changes

  useEffect(() => {
    const channel = supabase
      .channel(`chat_${request.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `request_id=eq.${request.id}`
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `request_id=eq.${request.id}`
      }, (payload) => {
        setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? payload.new as ChatMessage : msg))
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
        filter: `request_id=eq.${request.id}`
      }, (payload) => {
        setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id))
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'schedule_requests',
        filter: `id=eq.${request.id}`
      }, (payload) => {
        setCurrentRequest(payload.new as ScheduleRequest)
      })
      .subscribe()

    // Typing Indicator Channel
    const typingChannel = supabase.channel(`typing_${request.id}`, {
      config: { broadcast: { ack: false } }
    })

    typingChannel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.sender_type === 'admin') {
        setAdminTyping(payload.isTyping)
      }
    }).subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(typingChannel)
    }
  }, [request.id])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if ((!newMessage.trim() && selectedFiles.length === 0) || isSending) return

    setIsSending(true)
    
    try {
      // 1. Upload and send all queued files first
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `${request.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath)

        await supabase.from('chat_messages').insert({
          request_id: request.id,
          sender_type: 'client',
          message_body: null,
          file_url: publicUrl,
          file_type: file.type,
          file_name: file.name
        })
      }

      const textToSend = replyingTo 
        ? `> ${replyingTo.body}\n\n${newMessage.trim()}`
        : newMessage.trim()

      // 2. Send text message if exists
      if (textToSend) {
        const { error } = await supabase
          .from('chat_messages')
          .insert({
            request_id: request.id,
            sender_type: 'client',
            message_body: textToSend
          })
        if (error) throw error
      }

      // 3. Send Notifications (Non-blocking)
      import('@/app/actions').then(m => {
        m.sendPushNotification(request.id, 'client', textToSend || 'Sent an attachment').catch(console.error);
        m.sendEmailNotification(request.id, textToSend || 'Sent an attachment').catch(console.error);
      }).catch(console.error)

      // 4. Clear everything on success
      setNewMessage('')
      setReplyingTo(null)
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error("Error sending message", err)
      alert('Failed to send message or files. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setSelectedFiles(prev => [...prev, ...files])
    
    // Reset input so the same files can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    
    const typingChannel = supabase.channel(`typing_${request.id}`)
    typingChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender_type: 'client', isTyping: true }
    })

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      typingChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_type: 'client', isTyping: false }
      })
    }, 2000)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], `Voice_Message_${Math.floor(Date.now() / 1000)}.webm`, { type: 'audio/webm' })
        setSelectedFiles(prev => [...prev, audioFile])
        stream.getTracks().forEach(track => track.stop())
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
        setRecordingDuration(0)
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)

    } catch (err) {
      console.error("Error accessing mic:", err)
      alert("Could not access your microphone. Please check your browser permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200'
      case 'reviewed': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'completed': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-amber-100 text-amber-700 border-amber-200'
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEmailClick = () => {
    const email = process.env.NEXT_PUBLIC_COACH_EMAIL || 'drkevinaswb@gmail.com'
    navigator.clipboard.writeText(email).catch(() => {})
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 3000)
  }

  const handleSaveEdit = async () => {
    if (!editingMessageId) return
    await supabase.from('chat_messages').update({ message_body: editingMessageText.trim(), is_edited: true }).eq('id', editingMessageId)
    setEditingMessageId(null)
    setEditingMessageText('')
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleEnableNotifications = async () => {
    setIsEnabling(true)
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setNotifState('granted')
        return
      }

      const permission = await Notification.requestPermission()
      setNotifState(permission)

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const existingSubscription = await registration.pushManager.getSubscription()
        
        if (!existingSubscription) {
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          if (vapidPublicKey) {
            const newSubscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            })
            await subscribeToPush(JSON.parse(JSON.stringify(newSubscription)), request.id)
          }
        } else {
          await subscribeToPush(JSON.parse(JSON.stringify(existingSubscription)), request.id)
        }
      }
    } catch (err) {
      console.error('Error enabling notifications:', err)
    } finally {
      setIsEnabling(false)
    }
  }

  // Block the UI if notifications are not enabled and not bypassed
  if (notifState !== 'granted' && notifState !== 'checking' && !isBypassed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-slate-200">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔔</span>
            </div>
            <CardTitle className="text-2xl">Enable Notifications</CardTitle>
            <CardDescription className="text-base mt-2">
              To chat with your coach and receive instant updates on your study plan, you must enable notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isIOS && !isStandalone ? (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  📱 iPhone/iPad Setup Required
                </h4>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Apple requires you to add this app to your Home Screen to receive notifications.
                </p>
                
                <Button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'ASWB Coaching',
                        url: window.location.href
                      }).catch(console.error)
                    }
                  }}
                  className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white font-bold h-12"
                >
                  <Share className="w-5 h-5 mr-2" />
                  Tap Here to Share
                </Button>

                <div className="mt-4 text-sm font-medium text-amber-900 bg-white p-3 rounded-lg border border-amber-100">
                  After tapping the button above (or the Share icon in your browser):<br/><br/>
                  1. Scroll down and select <strong>"Add to Home Screen"</strong>.<br/><br/>
                  2. Open the app from your home screen.
                </div>
              </div>
            ) : isInAppBrowser ? (
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
                <h4 className="font-bold text-purple-900 mb-2">App Browser Detected</h4>
                <p className="text-sm text-purple-800 mb-4">
                  You are viewing this inside Facebook or Instagram. Notifications are not supported here.
                </p>
                <div className="text-sm font-medium text-purple-900 bg-white p-3 rounded-lg border border-purple-100 mb-4">
                  Tap the <strong>3 dots menu</strong> in the top corner of your screen and select <strong>"Open in Chrome"</strong> or <strong>"Open in System Browser"</strong> to continue.
                </div>
                <Button 
                  onClick={() => {
                    const intentUrl = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
                    window.location.href = intentUrl;
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 mb-2"
                >
                  Force Open in Chrome
                </Button>
                <Button 
                  onClick={() => setIsBypassed(true)}
                  variant="ghost" 
                  className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                >
                  I'm having trouble, continue anyway
                </Button>
              </div>
            ) : notifState === 'denied' ? (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center flex flex-col gap-3">
                <h4 className="font-bold text-red-900 mb-1">Notifications Blocked</h4>
                <p className="text-sm text-red-800">
                  You have blocked notifications. Click the <strong>lock icon 🔒</strong> in your address bar, change Notifications to <strong>Allow</strong>, and we'll automatically let you in.
                </p>
                <div className="mt-2 pt-3 border-t border-red-200/50">
                  <Button 
                    onClick={() => setIsBypassed(true)}
                    variant="ghost" 
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-100 h-10"
                  >
                    I'm having trouble, continue anyway
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button 
                  onClick={async () => {
                    await handleEnableNotifications()
                    if (deferredPrompt) {
                      try {
                        deferredPrompt.prompt()
                        const { outcome } = await deferredPrompt.userChoice
                        if (outcome === 'accepted') {
                          setDeferredPrompt(null)
                        }
                      } catch (err) {
                        console.error('PWA Prompt error:', err)
                      }
                    }
                  }} 
                  className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-md"
                  disabled={isEnabling}
                >
                  {isEnabling ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
                  Enable & Install App
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  This will securely connect you to your coach and add a shortcut to your device.
                </p>
                <Button 
                  onClick={() => setIsBypassed(true)}
                  variant="ghost" 
                  className="w-full mt-2 text-slate-500 hover:text-slate-700"
                >
                  Continue without notifications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (notifState === 'checking') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[calc(100vh-9rem)]">
      <PushNotificationManager userId={currentRequest.id} />
      
      {/* Sidebar Overview */}
      <div className="lg:col-span-4 flex flex-col gap-6 lg:h-full lg:overflow-y-auto pr-2 pb-4">
        
        <Button onClick={() => window.location.href = '/'} variant="ghost" className="w-fit text-slate-500 hover:text-slate-900 font-semibold group -ml-2">
          <Home className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Button>

        {/* Status Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-start justify-between relative z-10 mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Coaching Strategy</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">ID: {currentRequest.id.split('-')[0]}...</p>
            </div>
            <Badge variant="outline" className={`${getStatusColor(currentRequest.status)} capitalize font-bold px-3 py-1.5 shadow-sm`}>
              {currentRequest.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 hover:bg-blue-50 transition-colors">
              <span className="text-blue-500 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5"/> Exam Tier
              </span>
              <p className="font-extrabold text-blue-950 text-lg uppercase">{currentRequest.exam_type}</p>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 hover:bg-emerald-50 transition-colors">
              <span className="text-emerald-600 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5"/> Target Date
              </span>
              <p className="font-extrabold text-emerald-950 text-lg">{currentRequest.target_exam_date ? new Date(currentRequest.target_exam_date).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Target className="w-3.5 h-3.5"/> Your Roadblocks
            </span>
            <p className="text-slate-700 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-sm leading-relaxed font-medium">
              {currentRequest.roadblock_notes}
            </p>
          </div>

          <EditRequestModal request={currentRequest} />
        </div>

        {/* Secure Link Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 shadow-xl shadow-indigo-900/20 border border-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-start gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shrink-0">
              <ShieldCheck className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg tracking-tight">Secure Workspace</h3>
              <p className="text-indigo-200/80 text-sm font-medium mt-1 leading-relaxed">Save this link. It is your private access to your coach and study roadmap.</p>
            </div>
          </div>
          <Button 
            onClick={handleCopyLink} 
            className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold h-12 rounded-xl transition-all shadow-lg"
          >
            {copied ? <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Copied to Clipboard!</span> : <span className="flex items-center gap-2"><Copy className="w-4 h-4" /> Copy Secure Link</span>}
          </Button>
        </div>

      </div>

      {/* Chat Area */}
      <div className="lg:col-span-8 flex flex-col bg-white rounded-3xl lg:rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden h-[calc(100dvh-160px)] min-h-[400px] lg:h-full lg:min-h-0">
        
        {isBypassed && notifState !== 'granted' && (
          <div className="bg-amber-100 text-amber-800 text-xs px-4 py-2 font-medium flex justify-between items-center shrink-0 border-b border-amber-200">
            <span>⚠️ You are missing instant coach updates. Enable notifications in your browser settings.</span>
            <button onClick={() => handleEnableNotifications()} className="font-bold underline hover:text-amber-900">Enable</button>
          </div>
        )}

        {/* Chat Header */}
        <div className="border-b border-slate-100 p-5 bg-white shrink-0 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="text-white font-black text-lg">CO</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Coach Workspace</h2>
              <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Replies in less than 5 to 10 mins
              </p>
            </div>
          </div>
          {/* Contact Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "flex items-center justify-center text-green-600 border-green-200 hover:bg-green-50/50 shadow-sm font-bold w-11 h-11 p-0 sm:w-auto sm:h-11 sm:px-4 sm:gap-2 text-base shrink-0 rounded-xl transition-all"
              )}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
            <a 
              href={`mailto:${process.env.NEXT_PUBLIC_COACH_EMAIL || 'drkevinaswb@gmail.com'}`}
              onClick={handleEmailClick}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "flex items-center justify-center text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm font-bold w-11 h-11 p-0 sm:w-auto sm:h-11 sm:px-4 sm:gap-2 text-base shrink-0 rounded-xl transition-all"
              )}
            >
              {emailCopied ? <Check className="w-5 h-5 text-green-600 shrink-0" /> : <Mail className="w-5 h-5 shrink-0" />}
              <span className="hidden sm:inline">{emailCopied ? 'Copied!' : 'Email'}</span>
            </a>
          </div>
        </div>
        
        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6 max-w-md mx-auto text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                <Send className="w-10 h-10 text-blue-400 ml-2" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Start the Conversation</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Your dedicated coach is ready. Send a message to outline your immediate goals or ask about specific exam domains.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isClient = msg.sender_type === 'client'
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    key={msg.id} 
                    className={`flex ${isClient ? 'justify-end' : 'justify-start'} group relative`}
                  >
                    <div className={`flex items-start gap-2 ${isClient ? 'flex-row-reverse' : 'flex-row'} max-w-full md:max-w-[85%]`}>
                      <div className={`px-6 py-4 shadow-sm relative ${
                        isClient 
                          ? 'bg-blue-600 text-white rounded-[2rem] rounded-tr-sm' 
                          : 'bg-white border border-slate-200/60 text-slate-800 rounded-[2rem] rounded-tl-sm'
                      }`}>
                        {editingMessageId === msg.id ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <Textarea 
                              value={editingMessageText}
                              onChange={(e) => setEditingMessageText(e.target.value)}
                              className={`text-sm min-h-[60px] ${isClient ? 'text-slate-900 bg-white' : 'text-slate-900'}`}
                            />
                            <div className="flex justify-end gap-2 mt-1">
                              <Button size="sm" variant="ghost" className={isClient ? 'text-blue-100 hover:text-white hover:bg-blue-700 h-7 text-xs' : 'h-7 text-xs'} onClick={() => setEditingMessageId(null)}>Cancel</Button>
                              <Button size="sm" onClick={handleSaveEdit} className="bg-white text-blue-600 hover:bg-slate-50 h-7 text-xs">Save</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {msg.message_body && <p className="whitespace-pre-wrap font-medium leading-relaxed">{msg.message_body}</p>}
                            {msg.file_url && (
                              <MessageAttachment 
                                fileUrl={msg.file_url} 
                                fileType={msg.file_type || 'application/octet-stream'} 
                                fileName={msg.file_name || 'Attachment'} 
                              />
                            )}
                            <span suppressHydrationWarning className={`text-[10px] mt-3 flex items-center font-medium ${isClient ? 'text-blue-200' : 'text-slate-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {msg.is_edited && <span className="ml-1 italic">(edited)</span>}
                              {isClient && (
                                <span className="ml-1.5 flex items-center">
                                  • 
                                  {msg.is_read ? (
                                    <span className="flex items-center ml-1.5 text-blue-200" title="Seen by Coach">
                                      <CheckCheck className="w-3.5 h-3.5" />
                                    </span>
                                  ) : (
                                    <span className="flex items-center ml-1.5 opacity-70" title="Delivered">
                                      <Check className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </span>
                              )}
                            </span>
                          </>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger className={`w-8 h-8 rounded-full items-center justify-center text-slate-400 hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity flex shrink-0 mt-2 focus:outline-none border-none`}>
                          <MoreVertical size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isClient ? "end" : "start"} className="w-48">
                          {msg.message_body && (
                            <DropdownMenuItem onClick={() => handleCopyText(msg.message_body || '')}>
                              <Copy className="mr-2 h-4 w-4" /> Copy Text
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setReplyingTo({ id: msg.id, body: msg.message_body || 'Attachment', sender: isClient ? 'You' : 'Coach' })}>
                            <Reply className="mr-2 h-4 w-4" /> Reply
                          </DropdownMenuItem>
                          {msg.file_url && (
                            <DropdownMenuItem onClick={() => window.open(msg.file_url || undefined, '_blank')}>
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                          )}
                          {isClient && (
                            <DropdownMenuItem onClick={() => {
                              setEditingMessageId(msg.id)
                              setEditingMessageText(msg.message_body || '')
                            }}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit Message
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
          {adminTyping && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="bg-white border border-slate-200/60 text-slate-500 rounded-[2rem] rounded-tl-sm px-5 py-3 shadow-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-100 shrink-0 flex flex-col">
          
          {/* File Previews */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4 max-w-5xl mx-auto w-full px-2">
              {selectedFiles.map((file, idx) => {
                const isImg = file.type.startsWith('image/')
                const isAudio = file.type.startsWith('audio/')
                const previewUrl = isImg ? URL.createObjectURL(file) : null
                
                return (
                  <div key={idx} className="relative group w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shadow-sm">
                    {isImg && previewUrl ? (
                      <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        {isAudio ? <Mic className="w-6 h-6 mb-1" /> : <FileIcon className="w-6 h-6 mb-1" />}
                        <span className="text-[9px] font-medium truncate w-16 text-center">
                          {isAudio ? formatDuration(recordingDuration || 0) : file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <button 
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Replying To Preview */}
          {replyingTo && (
            <div className="flex items-center justify-between bg-slate-100 border-l-2 border-blue-500 p-2 rounded-md mb-4 max-w-5xl mx-auto w-full text-sm text-slate-600">
              <div className="truncate flex-1 pr-4">
                <span className="font-semibold text-xs text-blue-600 block">Replying to {replyingTo.sender}</span>
                <span className="truncate block opacity-80">{replyingTo.body}</span>
              </div>
              <button type="button" onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-3 items-end relative max-w-5xl mx-auto w-full">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || isRecording}
              className="h-[60px] w-[60px] rounded-full border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors p-0 flex items-center justify-center shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            
            {isRecording ? (
              <Button 
                type="button" 
                onClick={stopRecording}
                className="h-[60px] flex-1 rounded-3xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors p-0 flex items-center justify-center border border-red-200"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                  <span className="font-bold font-mono text-lg">{formatDuration(recordingDuration)}</span>
                  <span className="ml-2 font-medium">Recording Voice Message... Tap to Stop</span>
                  <Square className="w-4 h-4 ml-1 fill-current" />
                </div>
              </Button>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={startRecording}
                  disabled={isSending}
                  className="h-[60px] w-[60px] rounded-full border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors p-0 flex items-center justify-center shrink-0"
                >
                  <Mic className="w-5 h-5" />
                </Button>
                <Textarea 
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Type your message here... (Shift+Enter for new line)" 
                  className="flex-1 min-h-[60px] max-h-24 lg:max-h-40 rounded-3xl border-slate-200 focus-visible:ring-blue-500 bg-slate-50 hover:bg-slate-100/50 transition-colors resize-none py-4 px-6 font-medium shadow-inner text-base"
                  disabled={isSending}
                />
              </>
            )}

            <Button 
              type="submit" 
              disabled={isSending || isRecording || (!newMessage.trim() && selectedFiles.length === 0)} 
              className="h-[60px] w-[60px] rounded-full bg-blue-600 hover:bg-blue-700 transition-all p-0 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20 disabled:shadow-none"
            >
              {isSending ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white ml-1" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, ScheduleRequest, ChatMessage } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Send, Users, MessageSquare, ClipboardList, CheckCircle2, User, Phone, MapPin, Calendar, Clock, BookOpen, AlertCircle, Trash2, Loader2, Paperclip, X, FileIcon, ImageIcon, Check, CheckCheck, Mic, Square, MoreVertical, Copy, Edit2, Download, Reply } from 'lucide-react'
import { deleteScheduleRequest, sendEmailNotification } from '@/app/actions'
import { MessageAttachment } from '@/components/MessageAttachment'
import { motion, AnimatePresence } from 'framer-motion'

export function DashboardClient({ 
  initialRequests, 
  initialMessages 
}: { 
  initialRequests: ScheduleRequest[],
  initialMessages: ChatMessage[]
}) {
  const [requests, setRequests] = useState<ScheduleRequest[]>(initialRequests)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTier, setFilterTier] = useState<string>('all')

  const [newMessage, setNewMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [clientTyping, setClientTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editingMessageText, setEditingMessageText] = useState('')
  const [replyingTo, setReplyingTo] = useState<{id: number, body: string, sender: string} | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const selectedRequest = requests.find(r => r.id === selectedRequestId)
  const selectedMessages = messages.filter(m => m.request_id === selectedRequestId)

  useEffect(() => {
    // Scroll chat to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }

    // Mark unread client messages as read when viewing this chat
    if (selectedRequestId) {
      const markUnreadAsRead = async () => {
        const unreadIds = selectedMessages.filter(m => m.sender_type === 'client' && !m.is_read).map(m => m.id)
        if (unreadIds.length > 0) {
          setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, is_read: true } : m))
          await supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds)
        }
      }
      markUnreadAsRead()
    }
  }, [selectedMessages.length, selectedRequestId])

  useEffect(() => {
    if (!selectedRequestId) return
    
    // Typing Indicator Channel
    const typingChannel = supabase.channel(`typing_${selectedRequestId}`, {
      config: { broadcast: { ack: false } }
    })

    typingChannel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.sender_type === 'client') {
        setClientTyping(payload.isTyping)
      }
    }).subscribe()

    return () => {
      supabase.removeChannel(typingChannel)
      setClientTyping(false)
    }
  }, [selectedRequestId])

  useEffect(() => {
    // Subscribe to new requests
    const reqChannel = supabase
      .channel('admin_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_requests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRequests(prev => [payload.new as ScheduleRequest, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new as ScheduleRequest : r))
        }
      })
      .subscribe()

    // Subscribe to new messages and message updates (read receipts)
    const msgChannel = supabase
      .channel('admin_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new as ChatMessage : msg))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(reqChannel)
      supabase.removeChannel(msgChannel)
    }
  }, [])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if ((!newMessage.trim() && selectedFiles.length === 0) || isSending || !selectedRequestId) return

    setIsSending(true)
    
    try {
      // 1. Upload and send all queued files first
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `${selectedRequestId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath)

        await supabase.from('chat_messages').insert({
          request_id: selectedRequestId,
          sender_type: 'admin',
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
            request_id: selectedRequestId,
            sender_type: 'admin',
            message_body: textToSend
          })
        if (error) throw error
      }

      // 3. Send Email Notification (Non-blocking)
      sendEmailNotification(selectedRequestId, textToSend || 'Sent an attachment').catch(console.error)

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
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    if (!selectedRequestId) return

    const typingChannel = supabase.channel(`typing_${selectedRequestId}`)
    typingChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender_type: 'admin', isTyping: true }
    })

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      typingChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_type: 'admin', isTyping: false }
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

  const handleUpdateStatus = async (status: 'pending' | 'active' | 'reviewed' | 'completed') => {
    if (!selectedRequestId) return
    await supabase.from('schedule_requests').update({ status }).eq('id', selectedRequestId)
  }

  const handleDeleteMessage = async (msgId: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return
    await supabase.from('chat_messages').delete().eq('id', msgId)
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

  const handleDeleteClient = async () => {
    if (!selectedRequestId) return
    setIsDeleting(true)
    
    const result = await deleteScheduleRequest(selectedRequestId)
    if (result?.success) {
      setRequests(prev => prev.filter(r => r.id !== selectedRequestId))
      setMessages(prev => prev.filter(m => m.request_id !== selectedRequestId))
      setSelectedRequestId(null)
    } else {
      console.error(result?.error)
      alert("Failed to delete client.")
    }
    setIsDeleting(false)
  }

  const filteredRequests = requests.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (filterTier !== 'all' && r.exam_type !== filterTier) return false
    return true
  })

  // Metrics
  const totalRequests = requests.length
  const pendingRequests = requests.filter(r => r.status === 'pending').length
  const activeRoadmaps = requests.filter(r => r.status === 'active').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'reviewed': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-amber-100 text-amber-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Metric Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Inquiries</p>
              <p className="text-2xl font-bold text-slate-900">{totalRequests}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Review</p>
              <p className="text-2xl font-bold text-slate-900">{pendingRequests}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Roadmaps</p>
              <p className="text-2xl font-bold text-slate-900">{activeRoadmaps}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Pipeline Data Table */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200 flex flex-col overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Active Pipeline</CardTitle>
              <div className="flex gap-2">
                <Select value={filterTier} onValueChange={(v) => v && setFilterTier(v)}>
                  <SelectTrigger className="w-[120px] h-8 text-xs bg-white">
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="BSW">BSW</SelectItem>
                    <SelectItem value="MSW">MSW</SelectItem>
                    <SelectItem value="LCSW">LCSW</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs bg-white">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Tier & Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map(req => (
                  <TableRow 
                    key={req.id} 
                    className={`cursor-pointer transition-colors ${selectedRequestId === req.id ? 'bg-blue-50 hover:bg-blue-50' : 'hover:bg-slate-50'}`}
                    onClick={() => setSelectedRequestId(req.id)}
                  >
                    <TableCell>
                      <p className="font-medium text-slate-900">{req.full_name}</p>
                      <p className="text-xs text-slate-500">{req.email}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit text-[10px]">{req.exam_type}</Badge>
                        <span className="text-xs text-slate-600">
                          {req.target_exam_date ? new Date(req.target_exam_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${getStatusColor(req.status)} text-xs capitalize`}>
                        {req.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                      No requests found matching criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Integrated Chat Panel */}
        <Card className="shadow-sm border-slate-200 flex flex-col overflow-hidden">
          {selectedRequest ? (
            <>
              <CardHeader className="bg-slate-900 text-white border-b border-slate-800 py-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base text-white">{selectedRequest.full_name}</CardTitle>
                    <CardDescription className="text-slate-400 text-xs mt-1">
                      {selectedRequest.exam_type} | {selectedRequest.study_hours} hrs {selectedRequest.study_frequency?.toLowerCase()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select 
                      value={selectedRequest.status} 
                      onValueChange={(val: any) => handleUpdateStatus(val)}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-[10px] bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-500/10" />}>
                        <Trash2 size={16} />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Client Record?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{selectedRequest.full_name}</strong>'s request and their entire chat history. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteClient} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <Tabs defaultValue="chat" className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="border-b border-slate-100 bg-white px-4 pt-2 shrink-0">
                  <TabsList className="bg-transparent space-x-4">
                    <TabsTrigger value="chat" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 pb-2">Chat History</TabsTrigger>
                    <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 pb-2">Client Overview</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="flex-1 overflow-y-auto p-6 bg-slate-50 m-0 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b pb-2"><User size={16}/> Contact Details</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-500 w-24 inline-block">Name:</span> <span className="font-medium">{selectedRequest.full_name}</span></p>
                        <p><span className="text-slate-500 w-24 inline-block">Email:</span> <span className="font-medium">{selectedRequest.email}</span></p>
                        <p><span className="text-slate-500 w-24 inline-block">Phone:</span> <span className="font-medium">{selectedRequest.phone_number || 'N/A'}</span></p>
                        <p><span className="text-slate-500 w-24 inline-block">Location:</span> <span className="font-medium">{selectedRequest.location || 'N/A'}</span></p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b pb-2"><BookOpen size={16}/> Exam Details</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-500 w-24 inline-block">Exam:</span> <span className="font-medium">{selectedRequest.exam_type}</span></p>
                        <p><span className="text-slate-500 w-24 inline-block">Target Date:</span> <span className="font-medium">{selectedRequest.target_exam_date ? new Date(selectedRequest.target_exam_date).toLocaleDateString() : 'N/A'}</span></p>
                        <p><span className="text-slate-500 w-24 inline-block">Coach:</span> <span className="font-medium">{selectedRequest.preferred_coach || 'No preference'}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b pb-2"><Clock size={16}/> Study Plan</h4>
                    <div className="flex gap-8 text-sm">
                      <p><span className="text-slate-500">Frequency:</span> <span className="font-medium">{selectedRequest.study_frequency || 'N/A'}</span></p>
                      <p><span className="text-slate-500">Hours:</span> <span className="font-medium">{selectedRequest.study_hours || 0}</span></p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b pb-2"><AlertCircle size={16}/> Roadblocks</h4>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedRequest.roadblock_notes || 'No roadblocks provided.'}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {selectedMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 text-center">
                        <MessageSquare size={32} className="text-slate-300" />
                        <p className="text-sm">No messages yet.<br/>Start the conversation!</p>
                      </div>
                    ) : (
                      selectedMessages.map(msg => {
                        const isAdmin = msg.sender_type === 'admin'
                        return (
                          <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} group relative`}>
                            
                            <div className={`flex items-center gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                                isAdmin 
                                  ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm' 
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                              }`}>
                                {editingMessageId === msg.id ? (
                                  <div className="flex flex-col gap-2 min-w-[200px]">
                                    <Textarea 
                                      value={editingMessageText}
                                      onChange={(e) => setEditingMessageText(e.target.value)}
                                      className="text-slate-800 text-sm min-h-[60px]"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button size="sm" variant="ghost" className={isAdmin ? 'text-blue-100 hover:text-white hover:bg-blue-700' : ''} onClick={() => setEditingMessageId(null)}>Cancel</Button>
                                      <Button size="sm" onClick={handleSaveEdit} className="bg-white text-blue-600 hover:bg-slate-50">Save</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {msg.message_body && <p className="whitespace-pre-wrap">{msg.message_body}</p>}
                                    {msg.file_url && (
                                      <MessageAttachment 
                                        fileUrl={msg.file_url} 
                                        fileType={msg.file_type || 'application/octet-stream'} 
                                        fileName={msg.file_name || 'Attachment'} 
                                      />
                                    )}
                                    <span className={`text-[9px] mt-2 flex items-center opacity-80 ${isAdmin ? 'text-blue-100' : 'text-slate-400'}`}>
                                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      {msg.is_edited && <span className="ml-1 italic">(edited)</span>}
                                      {isAdmin && (
                                        <span className="ml-1 flex items-center">
                                          • 
                                          {msg.is_read ? (
                                            <span className="flex items-center ml-1 text-blue-100" title="Seen by Client">
                                              <CheckCheck className="w-3 h-3" />
                                            </span>
                                          ) : (
                                            <span className="flex items-center ml-1 opacity-70" title="Delivered">
                                              <Check className="w-3 h-3" />
                                            </span>
                                          )}
                                        </span>
                                      )}
                                    </span>
                                  </>
                                )}
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger className={`w-8 h-8 rounded-full items-center justify-center text-slate-400 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity flex shrink-0 focus:outline-none border-none`}>
                                  <MoreVertical size={16} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isAdmin ? "end" : "start"} className="w-48">
                                  {msg.message_body && (
                                    <DropdownMenuItem onClick={() => handleCopyText(msg.message_body || '')}>
                                      <Copy className="mr-2 h-4 w-4" /> Copy Text
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => setReplyingTo({ id: msg.id, body: msg.message_body || 'Attachment', sender: isAdmin ? 'You' : selectedRequest?.full_name || 'Client' })}>
                                    <Reply className="mr-2 h-4 w-4" /> Reply
                                  </DropdownMenuItem>
                                  {msg.file_url && (
                                    <DropdownMenuItem onClick={() => window.open(msg.file_url || undefined, '_blank')}>
                                      <Download className="mr-2 h-4 w-4" /> Download
                                    </DropdownMenuItem>
                                  )}
                                  {isAdmin && (
                                    <DropdownMenuItem onClick={() => {
                                      setEditingMessageId(msg.id)
                                      setEditingMessageText(msg.message_body || '')
                                    }}>
                                      <Edit2 className="mr-2 h-4 w-4" /> Edit Message
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => handleDeleteMessage(msg.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                            </div>
                          </div>
                        )
                      })
                    )}
                    {clientTyping && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                        <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm flex items-center gap-2 max-w-[85%]">
                          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="p-3 bg-white border-t border-slate-100 shrink-0 flex flex-col">
                    
                    {/* File Previews */}
                    {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedFiles.map((file, idx) => {
                          const isImg = file.type.startsWith('image/')
                          const isAudio = file.type.startsWith('audio/')
                          const previewUrl = isImg ? URL.createObjectURL(file) : null
                          
                          return (
                            <div key={idx} className="relative group w-14 h-14 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shadow-sm">
                              {isImg && previewUrl ? (
                                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex flex-col items-center text-slate-400">
                                  {isAudio ? <Mic className="w-5 h-5 mb-0.5" /> : <FileIcon className="w-5 h-5 mb-0.5" />}
                                  <span className="text-[8px] font-medium truncate w-12 text-center">
                                    {isAudio ? formatDuration(recordingDuration || 0) : file.name.split('.').pop()?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <button 
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
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
                        disabled={isSending || !selectedRequestId || isRecording}
                        className="h-[40px] w-10 border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors p-0 flex items-center justify-center shrink-0"
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      
                      {isRecording ? (
                        <Button 
                          type="button" 
                          onClick={stopRecording}
                          className="h-[40px] flex-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors p-0 flex items-center justify-center border border-red-200"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                            <span className="font-bold font-mono text-sm">{formatDuration(recordingDuration)}</span>
                            <span className="ml-1 font-medium text-xs hidden sm:inline">Recording... Tap to Stop</span>
                            <Square className="w-3 h-3 ml-1 fill-current hidden sm:inline" />
                          </div>
                        </Button>
                      ) : (
                        <>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={startRecording}
                            disabled={isSending || !selectedRequestId}
                            className="h-[40px] w-10 border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors p-0 flex items-center justify-center shrink-0"
                          >
                            <Mic className="w-4 h-4" />
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
                            placeholder="Reply... (Shift+Enter for new line)" 
                            className="min-h-[40px] max-h-32 text-sm flex-1 bg-slate-50 resize-none py-2"
                            disabled={isSending}
                          />
                        </>
                      )}

                      <Button type="submit" size="icon" className="h-[40px] w-10 bg-blue-600 hover:bg-blue-700 shrink-0" disabled={isSending || isRecording || (!newMessage.trim() && selectedFiles.length === 0)}>
                        {isSending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send size={16} />}
                      </Button>
                    </form>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center bg-slate-50/50">
              <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-slate-300" />
              </div>
              <p>Select a client from the pipeline<br/>to view their request and chat.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

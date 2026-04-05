'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Loop, Message, Profile } from '@/lib/types'
import { DAYS } from '@/lib/types'

const INITIAL_COLORS = [
  'bg-sage', 'bg-terra', 'bg-warm', 'bg-sage-dark',
  'bg-sage-light', 'bg-warm-light',
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getColor(index: number): string {
  return INITIAL_COLORS[index % INITIAL_COLORS.length]
}

export default function LoopDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const loopId = params.id as string

  const [loop, setLoop] = useState<Loop | null>(null)
  const [members, setMembers] = useState<Array<{ user_id: string; profiles: Profile }>>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      setUserId(user.id)

      // Fetch loop details
      const { data: loopData } = await supabase
        .from('loops')
        .select(`
          *,
          activities (*)
        `)
        .eq('id', loopId)
        .single()

      if (!loopData) {
        router.push('/dashboard')
        return
      }

      setLoop(loopData)

      // Fetch members with profiles
      const { data: memberData } = await supabase
        .from('loop_members')
        .select(`
          user_id,
          profiles (*)
        `)
        .eq('loop_id', loopId)

      if (memberData) {
        setMembers(
          memberData as unknown as Array<{ user_id: string; profiles: Profile }>
        )
      }

      // Fetch messages
      const { data: messageData } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (name)
        `)
        .eq('loop_id', loopId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (messageData) {
        setMessages(messageData as Message[])
      }

      setLoading(false)
    }

    load()
  }, [loopId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription for new messages
  useEffect(() => {
    if (loading) return

    const channel = supabase
      .channel(`messages:${loopId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `loop_id=eq.${loopId}`,
        },
        async (payload) => {
          // Fetch the full message with profile
          const { data } = await supabase
            .from('messages')
            .select('*, profiles (name)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data as Message])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loopId, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !userId || sending) return

    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    await supabase.from('messages').insert({
      loop_id: loopId,
      user_id: userId,
      content,
    })

    setSending(false)
  }

  function getNextOccurrence(dayOfWeek: number): string {
    const today = new Date()
    const todayDay = today.getDay()
    const diff = (dayOfWeek - todayDay + 7) % 7
    const next = new Date(today)
    next.setDate(today.getDate() + (diff === 0 ? 7 : diff))
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${DAYS[dayOfWeek]}, ${monthNames[next.getMonth()]} ${next.getDate()}`
  }

  function formatTime(isoString: string): string {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  function formatDate(isoString: string): string {
    const d = new Date(isoString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'

    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sage border-t-transparent" />
          <p className="text-sm text-muted">Loading loop...</p>
        </div>
      </div>
    )
  }

  if (!loop) return null

  // Group messages by date
  const groupedMessages: Array<{ date: string; messages: Message[] }> = []
  let currentDateGroup = ''
  for (const msg of messages) {
    const dateLabel = formatDate(msg.created_at)
    if (dateLabel !== currentDateGroup) {
      currentDateGroup = dateLabel
      groupedMessages.push({ date: dateLabel, messages: [msg] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-warm-light bg-cream px-6 py-4">
        <div className="mx-auto max-w-lg">
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warm-light text-2xl">
              {loop.activities?.emoji}
            </span>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">
                {loop.activities?.name}
              </h1>
              <p className="text-sm text-muted">
                {DAYS[loop.day_of_week]}s, {loop.time_slot}
                {loop.venue_name && ` \u00B7 ${loop.venue_name}`}
              </p>
            </div>
          </div>

          {/* Next meetup */}
          <div className="mt-4 rounded-xl bg-sage-light px-4 py-3">
            <p className="text-sm">
              <span className="font-medium text-sage-dark">Next meetup:</span>{' '}
              <span className="text-foreground">
                {getNextOccurrence(loop.day_of_week)}
                {loop.time_display && `, ${loop.time_display}`}
              </span>
            </p>
          </div>

          {/* Members */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
              Members ({members.length}/{loop.max_members})
            </p>
            <div className="flex flex-wrap gap-2">
              {members.map((member, i) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-2 rounded-full bg-background py-1.5 pl-1.5 pr-3"
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ${getColor(i)}`}
                  >
                    {getInitials(member.profiles?.name ?? '?')}
                  </div>
                  <span className="text-sm text-foreground">
                    {member.profiles?.name?.split(' ')[0] ?? 'Member'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-lg">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-cream text-2xl">
                {'\u{1F44B}'}
              </div>
              <p className="text-sm text-muted">
                No messages yet. Say hi to your loop!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {groupedMessages.map((group) => (
                <div key={group.date}>
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-warm-light" />
                    <span className="text-xs font-medium text-muted">
                      {group.date}
                    </span>
                    <div className="h-px flex-1 bg-warm-light" />
                  </div>

                  {group.messages.map((msg) => {
                    const isOwn = msg.user_id === userId
                    const memberIndex = members.findIndex(
                      (m) => m.user_id === msg.user_id
                    )

                    return (
                      <div
                        key={msg.id}
                        className={`mb-3 flex gap-2.5 ${
                          isOwn ? 'flex-row-reverse' : ''
                        }`}
                      >
                        {!isOwn && (
                          <div
                            className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${getColor(memberIndex)}`}
                          >
                            {getInitials(
                              msg.profiles?.name ?? '?'
                            )}
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] ${
                            isOwn ? 'text-right' : ''
                          }`}
                        >
                          {!isOwn && (
                            <p className="mb-0.5 text-xs font-medium text-muted">
                              {msg.profiles?.name?.split(' ')[0]}
                            </p>
                          )}
                          <div
                            className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              isOwn
                                ? 'rounded-tr-md bg-sage text-white'
                                : 'rounded-tl-md bg-cream text-foreground'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <p
                            className={`mt-0.5 text-xs text-muted/70 ${
                              isOwn ? 'text-right' : ''
                            }`}
                          >
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="border-t border-warm-light bg-cream px-6 py-4">
        <form
          onSubmit={handleSend}
          className="mx-auto flex max-w-lg gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Say something..."
            className="flex-1 rounded-2xl border border-warm-light bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage text-white transition-all hover:bg-sage-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

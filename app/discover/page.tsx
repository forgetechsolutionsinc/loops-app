'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Loop, Activity } from '@/lib/types'
import { DAYS } from '@/lib/types'

const ALL_FILTER = 'all'

export default function DiscoverPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loops, setLoops] = useState<Loop[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [filter, setFilter] = useState<string>(ALL_FILTER)
  const [userId, setUserId] = useState<string | null>(null)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchLoops = useCallback(async () => {
    let query = supabase
      .from('loops')
      .select(`
        *,
        activities (*),
        loop_members (user_id)
      `)
      .eq('status', 'active')

    if (filter !== ALL_FILTER) {
      query = query.eq('activity_id', parseInt(filter))
    }

    const { data } = await query

    if (data) {
      setLoops(
        data.map((l) => ({
          ...l,
          member_count: l.loop_members?.length ?? 0,
        }))
      )
    }
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      setUserId(user.id)

      // Fetch activities for filter chips
      const { data: activityData } = await supabase
        .from('activities')
        .select('*')
        .order('id')

      if (activityData) setActivities(activityData)

      // Fetch user's current memberships
      const { data: memberships } = await supabase
        .from('loop_members')
        .select('loop_id')
        .eq('user_id', user.id)

      if (memberships) {
        setJoinedIds(new Set(memberships.map((m) => m.loop_id)))
      }

      setLoading(false)
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading) {
      fetchLoops()
    }
  }, [filter, loading, fetchLoops])

  const [joinError, setJoinError] = useState<string | null>(null)

  async function handleJoin(loopId: string) {
    if (!userId) return
    setJoiningId(loopId)
    setJoinError(null)

    const { error } = await supabase
      .from('loop_members')
      .insert({ loop_id: loopId, user_id: userId })

    if (!error) {
      setJoinedIds((prev) => new Set([...prev, loopId]))
    } else {
      setJoinError('Unable to join this loop. It may be full.')
    }

    await fetchLoops()
    setJoiningId(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sage border-t-transparent" />
          <p className="text-sm text-muted">Finding loops near you...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 pt-10 pb-2">
        <div className="mx-auto max-w-lg">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Dashboard
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">
            Discover loops
          </h1>
          <p className="mt-1 text-sm text-muted">
            Find a group that fits your schedule
          </p>
        </div>
      </header>

      {/* Filter chips */}
      <div className="px-6 py-4">
        <div className="mx-auto max-w-lg">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
            <button
              onClick={() => setFilter(ALL_FILTER)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === ALL_FILTER
                  ? 'bg-sage text-white'
                  : 'bg-cream text-foreground hover:bg-warm-light'
              }`}
            >
              All activities
            </button>
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => setFilter(String(activity.id))}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  filter === String(activity.id)
                    ? 'bg-sage text-white'
                    : 'bg-cream text-foreground hover:bg-warm-light'
                }`}
              >
                {activity.emoji} {activity.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {joinError && (
        <div className="px-6">
          <div className="mx-auto max-w-lg">
            <p className="mb-4 rounded-xl bg-terra/10 px-4 py-2.5 text-sm text-terra">{joinError}</p>
          </div>
        </div>
      )}

      {/* Loop cards */}
      <main className="px-6 pb-12">
        <div className="mx-auto max-w-lg">
          {loops.length === 0 ? (
            <div className="rounded-3xl bg-cream px-8 py-12 text-center">
              <p className="mb-1 text-lg font-medium text-foreground">
                No loops found
              </p>
              <p className="text-sm text-muted">
                {filter !== ALL_FILTER
                  ? 'Try a different activity filter'
                  : 'Check back soon for new loops in your area'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {loops.map((loop) => {
                const isFull =
                  (loop.member_count ?? 0) >= loop.max_members
                const isJoined = joinedIds.has(loop.id)
                const isJoining = joiningId === loop.id

                return (
                  <div
                    key={loop.id}
                    className="rounded-2xl bg-cream p-5"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warm-light text-2xl">
                          {loop.activities?.emoji}
                        </span>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {loop.activities?.name}
                          </h3>
                          <p className="text-sm text-muted">
                            {DAYS[loop.day_of_week]}s, {loop.time_slot}
                          </p>
                        </div>
                      </div>
                    </div>

                    {loop.venue_name && (
                      <p className="mb-2 flex items-center gap-1.5 text-sm text-muted">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {loop.venue_name}
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-warm-light pt-3">
                      <span className="text-sm text-muted">
                        {loop.member_count}/{loop.max_members} people
                      </span>

                      {isJoined ? (
                        <Link
                          href={`/loops/${loop.id}`}
                          className="rounded-xl bg-sage-light px-5 py-2 text-sm font-medium text-sage-dark transition-all hover:bg-sage hover:text-white"
                        >
                          View loop
                        </Link>
                      ) : isFull ? (
                        <span className="rounded-xl bg-warm-light px-5 py-2 text-sm font-medium text-muted">
                          Full
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoin(loop.id)}
                          disabled={isJoining}
                          className="rounded-xl bg-sage px-5 py-2 text-sm font-medium text-white transition-all hover:bg-sage-dark disabled:opacity-50"
                        >
                          {isJoining ? 'Joining...' : 'Join'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Loop, Profile } from '@/lib/types'
import { DAYS } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loops, setLoops] = useState<Loop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData && !profileData.onboarded) {
        router.push('/onboard')
        return
      }

      setProfile(profileData)

      // Fetch user's loops via loop_members join
      const { data: memberships } = await supabase
        .from('loop_members')
        .select('loop_id')
        .eq('user_id', user.id)

      if (memberships && memberships.length > 0) {
        const loopIds = memberships.map((m) => m.loop_id)

        const { data: loopsData } = await supabase
          .from('loops')
          .select(`
            *,
            activities (*),
            loop_members (user_id)
          `)
          .in('id', loopIds)
          .eq('status', 'active')

        if (loopsData) {
          setLoops(
            loopsData.map((l) => ({
              ...l,
              member_count: l.loop_members?.length ?? 0,
            }))
          )
        }
      }

      setLoading(false)
    }

    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function getWarmth(createdAt: string): { emoji: string; label: string; weeks: number } {
    const created = new Date(createdAt)
    const now = new Date()
    const weeks = Math.floor((now.getTime() - created.getTime()) / (7 * 24 * 60 * 60 * 1000))

    if (weeks < 1) return { emoji: '\u{1F331}', label: 'Just planted', weeks: 0 }
    if (weeks < 3) return { emoji: '\u{1FAB4}', label: `${weeks}w together`, weeks }
    if (weeks < 6) return { emoji: '\u{2600}\u{FE0F}', label: `${weeks}w together`, weeks }
    if (weeks < 10) return { emoji: '\u{1F525}', label: `${weeks}w strong`, weeks }
    return { emoji: '\u{1F49B}', label: `${weeks}w bonded`, weeks }
  }

  function getNextOccurrence(dayOfWeek: number): string {
    const today = new Date()
    const todayDay = today.getDay()
    const diff = (dayOfWeek - todayDay + 7) % 7
    const next = new Date(today)
    next.setDate(today.getDate() + diff)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${DAYS[dayOfWeek].slice(0, 3)}, ${monthNames[next.getMonth()]} ${next.getDate()}`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sage border-t-transparent" />
          <p className="text-sm text-muted">Loading your loops...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 pt-10 pb-6">
        <div className="mx-auto max-w-lg">
          <p className="text-sm text-muted">Welcome back,</p>
          <h1 className="text-2xl font-semibold text-foreground">
            {profile?.name ?? 'Friend'}
          </h1>
        </div>
      </header>

      <main className="px-6 pb-32">
        <div className="mx-auto max-w-lg">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Your loops
            </h2>
            <Link
              href="/discover"
              className="text-sm font-medium text-sage hover:text-sage-dark transition-colors"
            >
              Find more
            </Link>
          </div>

          {loops.length === 0 ? (
            /* Empty state */
            <div className="rounded-3xl bg-cream px-8 py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warm-light text-3xl">
                <span className="opacity-60">{'\u{1F331}'}</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                No loops yet
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-muted">
                You haven&apos;t joined any loops yet. Discover a group that
                matches your interests and schedule.
              </p>
              <Link
                href="/discover"
                className="inline-block rounded-2xl bg-sage px-8 py-3 font-medium text-white transition-all hover:bg-sage-dark"
              >
                Find a loop
              </Link>
            </div>
          ) : (
            /* Loop cards */
            <div className="space-y-4">
              {loops.map((loop) => (
                <Link
                  key={loop.id}
                  href={`/loops/${loop.id}`}
                  className="block rounded-2xl bg-cream p-5 transition-all hover:shadow-md hover:shadow-sage/5"
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
                    <span className="rounded-full bg-sage-light px-3 py-1 text-xs font-medium text-sage-dark">
                      {loop.member_count}/{loop.max_members} people
                    </span>
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
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-sage-dark font-medium">
                        Next: {getNextOccurrence(loop.day_of_week)}
                      </p>
                      {(() => {
                        const warmth = getWarmth(loop.created_at)
                        return (
                          <span className="flex items-center gap-1 rounded-full bg-warm-light px-2 py-0.5 text-xs text-warm">
                            <span>{warmth.emoji}</span>
                            <span>{warmth.label}</span>
                          </span>
                        )
                      })()}
                    </div>
                    <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom CTA */}
      {loops.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-background via-background to-transparent pb-8 pt-12 px-6">
          <div className="mx-auto max-w-lg">
            <Link
              href="/discover"
              className="block w-full rounded-2xl bg-sage py-3.5 text-center font-medium text-white transition-all hover:bg-sage-dark"
            >
              Find a loop
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

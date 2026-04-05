'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { DAYS, TIME_SLOTS } from '@/lib/types'

const ACTIVITIES = [
  { id: 1, name: 'Morning Walk', emoji: '\u{1F6B6}' },
  { id: 2, name: 'Coffee & Work', emoji: '\u2615' },
  { id: 3, name: 'Evening Run', emoji: '\u{1F3C3}' },
  { id: 4, name: 'Book Club', emoji: '\u{1F4DA}' },
  { id: 5, name: 'Cooking', emoji: '\u{1F373}' },
  { id: 6, name: 'Art & Sketch', emoji: '\u{1F3A8}' },
  { id: 7, name: 'Board Games', emoji: '\u{1F3B2}' },
  { id: 8, name: 'Language Exchange', emoji: '\u{1F5E3}\u{FE0F}' },
]

interface ScheduleEntry {
  activityId: number
  dayOfWeek: number | null
  timeSlot: 'morning' | 'afternoon' | 'evening' | null
}

export default function OnboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [locationSet, setLocationSet] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [selectedActivities, setSelectedActivities] = useState<number[]>([])
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSteps = 4

  function toggleActivity(id: number) {
    setSelectedActivities((prev) => {
      if (prev.includes(id)) {
        return prev.filter((a) => a !== id)
      }
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  function requestLocation() {
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setLocationSet(true)
        setLocationLoading(false)
      },
      () => {
        setLocationLoading(false)
      }
    )
  }

  const initSchedules = useCallback(() => {
    setSchedules(
      selectedActivities.map((id) => ({
        activityId: id,
        dayOfWeek: null,
        timeSlot: null,
      }))
    )
  }, [selectedActivities])

  function updateSchedule(
    activityId: number,
    field: 'dayOfWeek' | 'timeSlot',
    value: number | string
  ) {
    setSchedules((prev) =>
      prev.map((s) =>
        s.activityId === activityId ? { ...s, [field]: value } : s
      )
    )
  }

  function goNext() {
    if (step === 2) {
      initSchedules()
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upsert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          lat,
          lng,
          onboarded: true,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Delete existing preferences
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id)

      // Insert new preferences
      const prefs = schedules
        .filter((s) => s.dayOfWeek !== null && s.timeSlot !== null)
        .map((s) => ({
          user_id: user.id,
          activity_id: s.activityId,
          day_of_week: s.dayOfWeek,
          time_slot: s.timeSlot,
        }))

      if (prefs.length > 0) {
        const { error: prefError } = await supabase
          .from('user_preferences')
          .insert(prefs)

        if (prefError) throw prefError
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  const canAdvance =
    (step === 0 && name.trim().length >= 1) ||
    step === 1 ||
    (step === 2 && selectedActivities.length >= 1) ||
    (step === 3 &&
      schedules.every((s) => s.dayOfWeek !== null && s.timeSlot !== null))

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="px-6 pt-8 pb-4">
        <div className="mx-auto flex max-w-sm gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-colors duration-300"
              style={{
                backgroundColor:
                  i <= step
                    ? 'var(--sage)'
                    : 'var(--warm-light)',
              }}
            />
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted">
          Step {step + 1} of {totalSteps}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center px-6 pb-8">
        <div className="w-full max-w-sm flex-1">
          {/* Step 0: Name */}
          {step === 0 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h1 className="mb-2 text-2xl font-semibold text-foreground">
                What should we call you?
              </h1>
              <p className="mb-8 text-sm text-muted">
                Just your first name is perfect. This is how others in your
                loops will know you.
              </p>
              <input
                type="text"
                placeholder="Your first name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full rounded-2xl border border-warm-light bg-cream px-4 py-3.5 text-lg text-foreground placeholder:text-muted/60 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all"
              />
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h1 className="mb-2 text-2xl font-semibold text-foreground">
                Where are you?
              </h1>
              <p className="mb-8 text-sm text-muted">
                We use your location to find loops nearby. You can skip this and
                set it later.
              </p>

              {locationSet ? (
                <div className="flex items-center gap-3 rounded-2xl bg-sage-light px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-white">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-sage-dark">Location set</p>
                    <p className="text-xs text-muted">
                      We&apos;ll find loops near you
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={requestLocation}
                    disabled={locationLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sage py-3.5 font-medium text-white transition-all hover:bg-sage-dark disabled:opacity-50"
                  >
                    {locationLoading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Requesting...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        Use my location
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Activity picker */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h1 className="mb-2 text-2xl font-semibold text-foreground">
                What do you enjoy?
              </h1>
              <p className="mb-6 text-sm text-muted">
                Pick 1 to 3 activities. We&apos;ll match you with people who like the
                same things.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ACTIVITIES.map((activity) => {
                  const selected = selectedActivities.includes(activity.id)
                  return (
                    <button
                      key={activity.id}
                      onClick={() => toggleActivity(activity.id)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 transition-all ${
                        selected
                          ? 'border-sage bg-sage-light'
                          : 'border-transparent bg-cream hover:border-warm-light'
                      }`}
                    >
                      <span className="text-3xl">{activity.emoji}</span>
                      <span
                        className={`text-sm font-medium ${
                          selected ? 'text-sage-dark' : 'text-foreground'
                        }`}
                      >
                        {activity.name}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-4 text-center text-xs text-muted">
                {selectedActivities.length}/3 selected
              </p>
            </div>
          )}

          {/* Step 3: Schedule picker */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h1 className="mb-2 text-2xl font-semibold text-foreground">
                When works for you?
              </h1>
              <p className="mb-6 text-sm text-muted">
                Pick a day and time for each activity. This is when you&apos;d meet
                your loop every week.
              </p>

              <div className="space-y-6">
                {schedules.map((schedule) => {
                  const activity = ACTIVITIES.find(
                    (a) => a.id === schedule.activityId
                  )
                  if (!activity) return null

                  return (
                    <div
                      key={schedule.activityId}
                      className="rounded-2xl bg-cream p-5"
                    >
                      <div className="mb-4 flex items-center gap-2">
                        <span className="text-2xl">{activity.emoji}</span>
                        <span className="font-medium text-foreground">
                          {activity.name}
                        </span>
                      </div>

                      {/* Day picker */}
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                        Day
                      </p>
                      <div className="mb-4 flex flex-wrap gap-2">
                        {DAYS.map((day, i) => (
                          <button
                            key={day}
                            onClick={() =>
                              updateSchedule(schedule.activityId, 'dayOfWeek', i)
                            }
                            className={`rounded-xl px-3 py-1.5 text-sm transition-all ${
                              schedule.dayOfWeek === i
                                ? 'bg-sage text-white'
                                : 'bg-background text-foreground hover:bg-warm-light'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>

                      {/* Time slot picker */}
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                        Time
                      </p>
                      <div className="flex gap-2">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() =>
                              updateSchedule(
                                schedule.activityId,
                                'timeSlot',
                                slot.value
                              )
                            }
                            className={`flex-1 rounded-xl px-3 py-2 text-center transition-all ${
                              schedule.timeSlot === slot.value
                                ? 'bg-sage text-white'
                                : 'bg-background text-foreground hover:bg-warm-light'
                            }`}
                          >
                            <p className="text-sm font-medium">{slot.label}</p>
                            <p className={`text-xs ${
                              schedule.timeSlot === slot.value
                                ? 'text-white/70'
                                : 'text-muted'
                            }`}>
                              {slot.time}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 w-full max-w-sm rounded-xl bg-terra/10 px-4 py-2.5 text-sm text-terra">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex w-full max-w-sm gap-3 pt-6">
          {step > 0 && (
            <button
              onClick={goBack}
              className="rounded-2xl border border-warm-light px-6 py-3.5 font-medium text-foreground transition-colors hover:bg-cream"
            >
              Back
            </button>
          )}

          {step < totalSteps - 1 ? (
            <button
              onClick={goNext}
              disabled={!canAdvance}
              className="flex-1 rounded-2xl bg-sage py-3.5 font-medium text-white transition-all hover:bg-sage-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 1 && !locationSet ? 'Skip' : 'Continue'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canAdvance || submitting}
              className="flex-1 rounded-2xl bg-terra py-3.5 font-medium text-white transition-all hover:bg-terra/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Setting up...
                </span>
              ) : (
                'Find my loops'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

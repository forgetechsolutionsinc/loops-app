'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="mb-12 block text-center">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            Loops
          </span>
        </Link>

        {sent ? (
          /* Check your email state */
          <div className="rounded-3xl bg-cream p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage-light">
              <svg
                className="h-8 w-8 text-sage-dark"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Check your email
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-muted">
              We sent a magic link to{' '}
              <span className="font-medium text-foreground">{email}</span>.
              Click the link to sign in.
            </p>
            <button
              onClick={() => {
                setSent(false)
                setEmail('')
              }}
              className="text-sm font-medium text-sage-dark hover:text-sage transition-colors"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* Email input form */
          <div className="rounded-3xl bg-cream p-8">
            <h1 className="mb-2 text-center text-2xl font-semibold text-foreground">
              Welcome to Loops
            </h1>
            <p className="mb-8 text-center text-sm text-muted">
              Enter your email to get started
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-2xl border border-warm-light bg-background px-4 py-3.5 text-foreground placeholder:text-muted/60 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-terra/10 px-4 py-2.5 text-sm text-terra">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-2xl bg-sage py-3.5 text-base font-medium text-white transition-all hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage/30 focus:ring-offset-2 focus:ring-offset-cream disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Continue with email'
                )}
              </button>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

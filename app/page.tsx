import Link from 'next/link'

const ACTIVITIES = [
  { emoji: '\u{1F6B6}', name: 'Morning Walk' },
  { emoji: '\u2615', name: 'Coffee & Work' },
  { emoji: '\u{1F3C3}', name: 'Evening Run' },
  { emoji: '\u{1F4DA}', name: 'Book Club' },
  { emoji: '\u{1F373}', name: 'Cooking' },
  { emoji: '\u{1F3A8}', name: 'Art & Sketch' },
  { emoji: '\u{1F3B2}', name: 'Board Games' },
  { emoji: '\u{1F5E3}\u{FE0F}', name: 'Language Exchange' },
]

const FEATURES = [
  {
    title: 'Small groups',
    description:
      '4\u20136 people. Enough to feel comfortable, small enough to really connect.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: 'Same people, every week',
    description:
      'Friendship forms through repetition. See the same faces and watch strangers become friends.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
      </svg>
    ),
  },
  {
    title: 'Activity-first',
    description:
      'Walking, cooking, reading, running. The activity is the excuse. The connection is the point.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="px-6 py-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-foreground">
            Loops
          </span>
          <Link
            href="/auth"
            className="rounded-full bg-cream px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-warm-light"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mx-auto max-w-2xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl sm:leading-tight">
            The people you&apos;ll see{' '}
            <span className="text-sage">every week</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            Join a small group. Do something you love. Same time, same people,
            every week. Friendship happens naturally.
          </p>
          <div className="mt-10">
            <Link
              href="/auth"
              className="inline-block rounded-full bg-sage px-10 py-4 text-lg font-medium text-white transition-all hover:bg-sage-dark hover:shadow-lg hover:shadow-sage/20"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 sm:pb-28">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl bg-cream p-7 sm:p-8"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-light text-sage-dark">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activity showcase */}
      <section className="px-6 pb-20 sm:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-2 text-2xl font-semibold text-foreground sm:text-3xl">
            Something for everyone
          </h2>
          <p className="mb-10 text-muted">
            Pick the activities that make you happy
          </p>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar sm:flex-wrap sm:justify-center sm:overflow-visible">
            {ACTIVITIES.map((activity) => (
              <div
                key={activity.name}
                className="flex shrink-0 flex-col items-center gap-3 rounded-2xl bg-cream px-6 py-5 transition-transform hover:scale-105"
              >
                <span className="text-4xl">{activity.emoji}</span>
                <span className="whitespace-nowrap text-sm font-medium text-foreground">
                  {activity.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-20 sm:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl bg-sage px-8 py-14 sm:px-16 sm:py-20">
            <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
              Ready to find your people?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-sage-light">
              It takes less than 2 minutes to set up. We&apos;ll match you with a
              group that fits your schedule and interests.
            </p>
            <Link
              href="/auth"
              className="inline-block rounded-full bg-white px-10 py-4 text-lg font-medium text-sage-dark transition-all hover:shadow-lg"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-warm-light px-6 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-lg font-bold tracking-tight text-foreground">
            Loops
          </span>
          <p className="mt-2 text-sm text-muted">
            A better way to make friends
          </p>
        </div>
      </footer>
    </div>
  )
}

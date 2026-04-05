export interface Profile {
  id: string
  name: string
  lat: number | null
  lng: number | null
  neighborhood: string | null
  onboarded: boolean
  created_at: string
}

export interface Activity {
  id: number
  name: string
  emoji: string
  description: string | null
}

export interface UserPreference {
  id: number
  user_id: string
  activity_id: number
  day_of_week: number
  time_slot: 'morning' | 'afternoon' | 'evening'
}

export interface Loop {
  id: string
  activity_id: number
  day_of_week: number
  time_slot: string
  time_display: string | null
  venue_name: string | null
  venue_address: string | null
  lat: number | null
  lng: number | null
  max_members: number
  status: string
  created_at: string
  // Joined fields
  activities?: Activity
  loop_members?: LoopMember[]
  member_count?: number
}

export interface LoopMember {
  loop_id: string
  user_id: string
  role: string
  joined_at: string
  profiles?: Profile
}

export interface Message {
  id: string
  loop_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Rsvp {
  id: string
  loop_id: string
  user_id: string
  week_date: string
  status: 'going' | 'not_going'
  created_at: string
  profiles?: Pick<Profile, 'name'>
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const TIME_SLOTS = [
  { value: 'morning' as const, label: 'Morning', time: '7-11am' },
  { value: 'afternoon' as const, label: 'Afternoon', time: '12-5pm' },
  { value: 'evening' as const, label: 'Evening', time: '6-10pm' },
]

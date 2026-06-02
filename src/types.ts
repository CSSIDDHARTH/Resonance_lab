export type AppSection =
  | 'landing'
  | 'dashboard'
  | 'metronome'
  | 'rhythm-lab'
  | 'practice-hub'
  | 'theory-toolkit'
  | 'ear-training'
  | 'producer-tools'
  | 'settings';

export interface DailyHabit {
  date: string;
  completed: boolean;
}

export interface RepertoireSong {
  id: string;
  title: string;
  artist: string;
  learnedDate: string;
  lastReviewedDate: string;
  difficulty: 1 | 2 | 3 | 4 | 5; // 1: Easy, 5: Virtuoso
  retentionScore: number; // 0 - 100
}

export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastPracticeDate?: string;
  hasCompletedTour?: boolean;
  badges: string[]; // ids of earned badges
  repertoire: RepertoireSong[];
}

export interface PracticeBlock {
  id: string;
  name: string;
  durationMinutes: number;
  category: 'scales' | 'songs' | 'exercises' | 'technique';
}

export interface PracticeJournalEntry {
  id: string;
  date: string;
  category: string;
  sessionNotes: string;
  bpmReached: number;
  durationMinutes: number;
  observations: string;
}

export interface RhythmTestResult {
  id: string;
  date: string;
  accuracy: number;     // 0 - 100
  consistency: number;  // 0 - 100 (jitter variation)
  offsets: number[];     // ms offset for each tap
}

export interface ClockChallengeResult {
  id: string;
  date: string;
  targetBpm: number;
  tapsCount: number;
  driftMs: number;     // average offset in ms from expected click times during silent phase
  feedback: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirementXp?: number;
  requirementStreak?: number;
  category: 'streak' | 'xp' | 'rhythm' | 'session';
}

export const ACHIEVEMENTS: Badge[] = [
  {
    id: 'first_session',
    name: 'First Session',
    description: 'Began your musical journey with your very first practice log.',
    icon: 'Play',
    category: 'session',
  },
  {
    id: 'streak_3',
    name: 'Rhythm Foundation',
    description: 'Maintained a 3-day practice streak.',
    icon: 'Flame',
    requirementStreak: 3,
    category: 'streak',
  },
  {
    id: 'streak_7',
    name: 'Dedicated Artist',
    description: 'Maintained a consecutive 7-day practice streak.',
    icon: 'Zap',
    requirementStreak: 7,
    category: 'streak',
  },
  {
    id: 'rhythm_expert',
    name: 'Subdivision Guru',
    description: 'Achieve 92% or greater accuracy in the Rhythm Test.',
    icon: 'Sparkles',
    category: 'rhythm',
  },
  {
    id: 'xp_1000',
    name: 'Resonance Legend',
    description: 'Earned over 1,000 Practice XP.',
    icon: 'Crown',
    requirementXp: 1000,
    category: 'xp',
  },
];

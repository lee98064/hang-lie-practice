export type InputMode = 'code' | 'text'
export type LessonKind = 'roots' | 'full-code' | 'phrase' | 'quick-code' | 'review'
export type AutoHintSeconds = 8 | 15 | 30 | 60 | null

export interface KeyDefinition {
  key: string
  coordinate: string
  roots: string[]
  row: 'upper' | 'middle' | 'lower'
}

export interface CharacterEntry {
  char: string
  fullCodes: string[]
  quickCodes: string[]
  specialCodes: string[]
  tier: number
}

export interface TextEntry {
  id: string
  text: string
  category: string
}

export interface GeneratedData {
  meta: {
    version: string
    generatedAt: string
    source: string
    entryCount: number
  }
  characters: CharacterEntry[]
  phrases: TextEntry[]
  sentences: TextEntry[]
}

export interface Attempt {
  itemId: string
  char?: string
  mode: InputMode
  lesson: LessonKind
  correct: boolean
  wrongCount: number
  hintsUsed: number
  elapsedMs: number
  occurredAt: string
}

export interface MasteryRecord {
  level: number
  correctCount: number
  wrongCount: number
  lastPracticedAt: string
  nextReviewAt: string
}

export interface TrainerSettings {
  showTray: boolean
  inputMode: InputMode
  lastLesson: LessonKind
  dailyGoal: number
  autoHintSeconds: AutoHintSeconds
}

export interface PersistedState {
  schemaVersion: 1
  settings: TrainerSettings
  mastery: Record<string, MasteryRecord>
  attempts: Attempt[]
  completedSessions: number
}

export interface PracticePrompt {
  id: string
  kind: 'root' | 'character' | 'text'
  text: string
  activeIndex: number
  expectedAnswers: string[]
  isRetry?: boolean
}

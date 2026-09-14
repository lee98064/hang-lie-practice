import type { Attempt, AutoHintSeconds, MasteryRecord, PersistedState } from '../types'

export const STORAGE_KEY = 'array30-trainer:v1'
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const
export const AUTO_HINT_OPTIONS: AutoHintSeconds[] = [8, 15, 30, 60, null]

export function createDefaultState(): PersistedState {
  return {
    schemaVersion: 1,
    settings: {
      showTray: true,
      inputMode: 'code',
      lastLesson: 'roots',
      dailyGoal: 20,
      autoHintSeconds: 8,
    },
    mastery: {},
    attempts: [],
    completedSessions: 0,
  }
}

export function loadPersistedState(storage: Pick<Storage, 'getItem'> = localStorage): PersistedState {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    if (parsed.schemaVersion !== 1 || !parsed.settings || !parsed.mastery || !Array.isArray(parsed.attempts)) {
      return createDefaultState()
    }
    const defaults = createDefaultState()
    const autoHintSeconds = AUTO_HINT_OPTIONS.includes(parsed.settings.autoHintSeconds as AutoHintSeconds)
      ? parsed.settings.autoHintSeconds as AutoHintSeconds
      : defaults.settings.autoHintSeconds
    return {
      ...defaults,
      ...parsed,
      settings: { ...defaults.settings, ...parsed.settings, autoHintSeconds },
      attempts: parsed.attempts.slice(-240),
    }
  } catch {
    return createDefaultState()
  }
}

export function updateMastery(
  current: MasteryRecord | undefined,
  attempt: Attempt,
  now = new Date(attempt.occurredAt),
): MasteryRecord {
  const previousLevel = Math.min(5, Math.max(0, current?.level ?? 0))
  let level = previousLevel
  if (attempt.wrongCount > 0) level = Math.max(0, previousLevel - 1)
  else if (attempt.correct && attempt.hintsUsed === 0) level = Math.min(5, previousLevel + 1)

  const nextReview = new Date(now)
  nextReview.setDate(nextReview.getDate() + REVIEW_INTERVAL_DAYS[level])

  return {
    level,
    correctCount: (current?.correctCount ?? 0) + (attempt.correct ? 1 : 0),
    wrongCount: (current?.wrongCount ?? 0) + attempt.wrongCount,
    lastPracticedAt: now.toISOString(),
    nextReviewAt: nextReview.toISOString(),
  }
}

export function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapWith]] = [copy[swapWith], copy[index]]
  }
  return copy
}

export function isValidPrefix(buffer: string, answers: string[]): boolean {
  return answers.some((answer) => answer.startsWith(buffer))
}

export function matchingAnswer(buffer: string, answers: string[]): string | undefined {
  return answers.find((answer) => answer === buffer)
}

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Attempt, InputMode, LessonKind } from '../types'
import { createDefaultState, loadPersistedState, STORAGE_KEY, updateMastery } from '../utils/practice'

export const useProgressStore = defineStore('progress', () => {
  const initial = loadPersistedState()
  const settings = ref(initial.settings)
  const mastery = ref(initial.mastery)
  const attempts = ref(initial.attempts)
  const completedSessions = ref(initial.completedSessions)

  const practicedToday = computed(() => {
    const today = new Date().toDateString()
    return attempts.value.filter((attempt) => new Date(attempt.occurredAt).toDateString() === today).length
  })

  const dueCount = computed(() => {
    const now = Date.now()
    return Object.values(mastery.value).filter((record) => Date.parse(record.nextReviewAt) <= now).length
  })

  const averageAccuracy = computed(() => {
    if (!attempts.value.length) return 0
    return Math.round((attempts.value.filter(({ correct }) => correct).length / attempts.value.length) * 100)
  })

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      schemaVersion: 1,
      settings: settings.value,
      mastery: mastery.value,
      attempts: attempts.value.slice(-240),
      completedSessions: completedSessions.value,
    }))
  }

  function setShowTray(value: boolean) {
    settings.value.showTray = value
    persist()
  }

  function setInputMode(value: InputMode) {
    settings.value.inputMode = value
    persist()
  }

  function setLesson(value: LessonKind) {
    settings.value.lastLesson = value
    persist()
  }

  function recordAttempt(attempt: Attempt) {
    attempts.value.push(attempt)
    if (attempts.value.length > 240) attempts.value.splice(0, attempts.value.length - 240)
    if (attempt.char) {
      mastery.value[attempt.char] = updateMastery(mastery.value[attempt.char], attempt)
    }
    persist()
  }

  function completeSession() {
    completedSessions.value += 1
    persist()
  }

  function resetProgress() {
    const fresh = createDefaultState()
    mastery.value = fresh.mastery
    attempts.value = fresh.attempts
    completedSessions.value = 0
    persist()
  }

  return {
    settings,
    mastery,
    attempts,
    completedSessions,
    practicedToday,
    dueCount,
    averageAccuracy,
    setShowTray,
    setInputMode,
    setLesson,
    recordAttempt,
    completeSession,
    resetProgress,
  }
})

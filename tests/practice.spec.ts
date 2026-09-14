import { describe, expect, it } from 'vitest'
import type { Attempt, MasteryRecord } from '../src/types'
import { createDefaultState, isValidPrefix, loadPersistedState, matchingAnswer, STORAGE_KEY, updateMastery } from '../src/utils/practice'

const attempt: Attempt = {
  itemId: 'char:行',
  char: '行',
  mode: 'code',
  lesson: 'full-code',
  correct: true,
  wrongCount: 0,
  hintsUsed: 0,
  elapsedMs: 1200,
  occurredAt: '2026-09-14T00:00:00.000Z',
}

describe('逐鍵判定', () => {
  it('接受合法前綴與完整容錯碼', () => {
    const answers = ['qiue', 'qiuw']
    expect(isValidPrefix('qiu', answers)).toBe(true)
    expect(isValidPrefix('qix', answers)).toBe(false)
    expect(matchingAnswer('qiuw', answers)).toBe('qiuw')
  })
})

describe('熟練度', () => {
  it('無提示正確會升級並排定一天後複習', () => {
    const result = updateMastery(undefined, attempt)
    expect(result.level).toBe(1)
    expect(result.nextReviewAt).toBe('2026-09-15T00:00:00.000Z')
  })

  it('答錯會降級並立即排入複習', () => {
    const current: MasteryRecord = {
      level: 3,
      correctCount: 4,
      wrongCount: 0,
      lastPracticedAt: '2026-09-10T00:00:00.000Z',
      nextReviewAt: '2026-09-17T00:00:00.000Z',
    }
    const result = updateMastery(current, { ...attempt, correct: false, wrongCount: 1 })
    expect(result.level).toBe(2)
    expect(result.wrongCount).toBe(1)
    expect(result.nextReviewAt).toBe('2026-09-17T00:00:00.000Z')
  })
})

describe('本機資料', () => {
  it('損壞資料安全回復預設值', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json')
    expect(loadPersistedState()).toEqual(createDefaultState())
  })

  it('舊版 schema 不會影響啟動', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 0 }))
    expect(loadPersistedState().schemaVersion).toBe(1)
    expect(loadPersistedState().settings.showTray).toBe(true)
  })

  it('舊設定會補上預設提示秒數，無效秒數不會被採用', () => {
    const defaults = createDefaultState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...defaults,
      settings: { ...defaults.settings, autoHintSeconds: 999 },
    }))

    expect(loadPersistedState().settings.autoHintSeconds).toBe(8)
  })
})

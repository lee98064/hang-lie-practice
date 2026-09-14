<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BasicStrokeGuide from '../components/BasicStrokeGuide.vue'
import ModeSwitch from '../components/ModeSwitch.vue'
import SessionSummary from '../components/SessionSummary.vue'
import TypeTray from '../components/TypeTray.vue'
import { arrayData, characterByGlyph, characterEntries, isCjkCharacter } from '../data'
import { ARRAY_KEYS, codeToCoordinates, VALID_CODE_KEYS } from '../data/keys'
import { useProgressStore } from '../stores/progress'
import type { Attempt, AutoHintSeconds, CharacterEntry, InputMode, LessonKind, PracticePrompt } from '../types'
import { AUTO_HINT_OPTIONS, isValidPrefix, matchingAnswer, shuffle } from '../utils/practice'

const SESSION_SIZE = 20
const autoHintChoices = AUTO_HINT_OPTIONS.map((seconds) => ({
  value: seconds === null ? 'manual' : String(seconds),
  label: seconds === null ? '僅手動' : `${seconds} 秒`,
}))
const lessons: { kind: LessonKind; label: string; short: string }[] = [
  { kind: 'roots', label: '認識字根', short: '鍵位' },
  { kind: 'full-code', label: '完整拆碼', short: '單字' },
  { kind: 'phrase', label: '詞句實戰', short: '詞句' },
  { kind: 'quick-code', label: '速度碼', short: '快碼' },
  { kind: 'review', label: '錯題複習', short: '複習' },
]

const progress = useProgressStore()
const lesson = ref<LessonKind>(progress.settings.lastLesson)
const queue = ref<PracticePrompt[]>([])
const promptIndex = ref(0)
const codeBuffer = ref('')
const textInput = ref('')
const wrongCount = ref(0)
const hintsUsed = ref(0)
const hintLevel = ref(0)
const feedback = ref('')
const errorKey = ref('')
const pressedKey = ref('')
const isResolving = ref(false)
const resultCorrect = ref(true)
const isComplete = ref(false)
const sessionAttempts = ref<Attempt[]>([])
const questionStartedAt = ref(Date.now())
const composing = ref(false)
const lastInvalidText = ref('')
const captureInput = ref<HTMLInputElement | null>(null)
const textArea = ref<HTMLTextAreaElement | null>(null)
const remainingSeconds = ref(60)
const speedActive = ref(false)
let hintTimer: ReturnType<typeof setTimeout> | undefined
let revealTimer: ReturnType<typeof setTimeout> | undefined
let speedTimer: ReturnType<typeof setInterval> | undefined
let transitionTimer: ReturnType<typeof setTimeout> | undefined

const mode = computed<InputMode>({
  get: () => progress.settings.inputMode,
  set: (value) => progress.setInputMode(value),
})

const currentPrompt = computed(() => queue.value[promptIndex.value])
const currentCharacters = computed(() => Array.from(currentPrompt.value?.text ?? ''))
const activeGlyph = computed(() => {
  if (!currentPrompt.value) return ''
  if (currentPrompt.value.kind === 'root') return currentPrompt.value.text
  return currentCharacters.value[currentPrompt.value.activeIndex] ?? currentPrompt.value.text
})
const activeEntry = computed(() => characterByGlyph.get(activeGlyph.value))
const rootDefinition = computed(() => currentPrompt.value?.kind === 'root'
  ? ARRAY_KEYS.find(({ key }) => key === currentPrompt.value?.expectedAnswers[0])
  : undefined)

const acceptedAnswers = computed(() => {
  const prompt = currentPrompt.value
  if (!prompt) return []
  if (prompt.kind === 'text') return activeEntry.value?.fullCodes ?? []
  return prompt.expectedAnswers
})

const primaryAnswer = computed(() => acceptedAnswers.value[0] ?? '')
const activeCandidate = computed(() => acceptedAnswers.value.find((answer) => answer.startsWith(codeBuffer.value)) ?? primaryAnswer.value)
const nextExpectedKey = computed(() => activeCandidate.value[codeBuffer.value.length] ?? '')
const answerCoordinates = computed(() => codeToCoordinates(primaryAnswer.value))
const lessonTitle = computed(() => lessons.find(({ kind }) => kind === lesson.value)?.label ?? '')
const progressPercent = computed(() => {
  if (lesson.value === 'quick-code') return speedActive.value ? (60 - remainingSeconds.value) / 60 * 100 : 0
  return queue.value.length ? Math.min(100, promptIndex.value / queue.value.length * 100) : 0
})
const progressText = computed(() => lesson.value === 'quick-code'
  ? `${remainingSeconds.value} 秒`
  : `${Math.min(promptIndex.value + 1, queue.value.length)} / ${queue.value.length}`)

const statusTone = computed(() => {
  if (isResolving.value) return resultCorrect.value ? 'success' : 'warning'
  if (errorKey.value || lastInvalidText.value) return 'error'
  if (hintLevel.value) return 'hint'
  return 'neutral'
})

function codesFor(entry: CharacterEntry, kind: LessonKind): string[] {
  if (kind === 'quick-code') return [...entry.specialCodes, ...entry.quickCodes].filter(Boolean)
  return entry.fullCodes
}

function selectCharacterEntries(kind: LessonKind): CharacterEntry[] {
  if (kind === 'quick-code') {
    return shuffle(characterEntries.filter((entry) => codesFor(entry, kind).length)).slice(0, 100)
  }
  if (kind === 'review') {
    const now = Date.now()
    const due = Object.entries(progress.mastery)
      .filter(([, record]) => Date.parse(record.nextReviewAt) <= now)
      .sort(([, a], [, b]) => a.level - b.level)
      .map(([char]) => characterByGlyph.get(char))
      .filter((entry): entry is CharacterEntry => Boolean(entry?.fullCodes.length))
    if (due.length) return due.slice(0, SESSION_SIZE)
    const recentWrong = [...progress.attempts].reverse()
      .filter(({ char, wrongCount }) => char && wrongCount > 0)
      .map(({ char }) => characterByGlyph.get(char!))
      .filter((entry): entry is CharacterEntry => Boolean(entry))
    const uniqueRecent = [...new Map(recentWrong.map((entry) => [entry.char, entry])).values()]
    if (uniqueRecent.length) return uniqueRecent.slice(0, SESSION_SIZE)
  }
  const beginnerPool = characterEntries.filter((entry) => entry.fullCodes.length && entry.tier <= (kind === 'full-code' ? 3 : 2)).slice(0, 420)
  return shuffle(beginnerPool).slice(0, SESSION_SIZE)
}

function buildQueue() {
  if (lesson.value === 'roots') {
    queue.value = shuffle(ARRAY_KEYS).slice(0, SESSION_SIZE).map((definition) => ({
      id: `root:${definition.key}`,
      kind: 'root',
      text: definition.roots[0],
      activeIndex: 0,
      expectedAnswers: [definition.key],
    }))
    return
  }
  if (lesson.value === 'phrase') {
    queue.value = shuffle([...arrayData.phrases, ...arrayData.sentences]).slice(0, SESSION_SIZE).map((item) => ({
      id: item.id,
      kind: 'text',
      text: item.text,
      activeIndex: firstCjkIndex(item.text),
      expectedAnswers: [item.text],
    }))
    return
  }
  queue.value = selectCharacterEntries(lesson.value).map((entry) => ({
    id: `char:${entry.char}`,
    kind: 'character',
    text: entry.char,
    activeIndex: 0,
    expectedAnswers: codesFor(entry, lesson.value),
  }))
}

function firstCjkIndex(text: string): number {
  return Array.from(text).findIndex(isCjkCharacter)
}

function nextCjkIndex(text: string, after: number): number {
  const characters = Array.from(text)
  for (let index = after + 1; index < characters.length; index += 1) {
    if (isCjkCharacter(characters[index])) return index
  }
  return -1
}

function clearQuestionTimers() {
  if (hintTimer) clearTimeout(hintTimer)
  if (revealTimer) clearTimeout(revealTimer)
}

function scheduleHints() {
  clearQuestionTimers()
  if (isComplete.value || isResolving.value || (lesson.value === 'quick-code' && !speedActive.value)) return
  const delaySeconds = progress.settings.autoHintSeconds
  if (delaySeconds === null) return
  const delay = delaySeconds * 1000
  hintTimer = setTimeout(() => raiseHint(1, true), delay)
  revealTimer = setTimeout(() => raiseHint(2, true), delay * 2)
}

function focusAnswer() {
  nextTick(() => {
    if (mode.value === 'code') captureInput.value?.focus()
    else textArea.value?.focus()
  })
}

function resetQuestionState() {
  codeBuffer.value = ''
  textInput.value = ''
  wrongCount.value = 0
  hintsUsed.value = 0
  hintLevel.value = 0
  feedback.value = mode.value === 'text' ? '開啟系統行列輸入法，輸入上方文字。' : '看清字形後，直接按下完整鍵碼。'
  errorKey.value = ''
  pressedKey.value = ''
  isResolving.value = false
  resultCorrect.value = true
  composing.value = false
  lastInvalidText.value = ''
  questionStartedAt.value = Date.now()
  scheduleHints()
  focusAnswer()
}

function restartSession() {
  clearQuestionTimers()
  if (speedTimer) clearInterval(speedTimer)
  if (transitionTimer) clearTimeout(transitionTimer)
  buildQueue()
  promptIndex.value = 0
  sessionAttempts.value = []
  isComplete.value = false
  remainingSeconds.value = 60
  speedActive.value = lesson.value !== 'quick-code'
  resetQuestionState()
}

function chooseLesson(kind: LessonKind) {
  if (lesson.value === kind && !isComplete.value) return
  lesson.value = kind
  progress.setLesson(kind)
  if ((kind === 'roots' || kind === 'quick-code' || kind === 'review') && mode.value === 'text') mode.value = 'code'
  restartSession()
}

function changeMode(value: InputMode) {
  if (value === mode.value) return
  mode.value = value
  restartSession()
}

function startSpeed() {
  remainingSeconds.value = 60
  speedActive.value = true
  resetQuestionState()
  speedTimer = setInterval(() => {
    remainingSeconds.value -= 1
    if (remainingSeconds.value <= 0) finishSession()
  }, 1000)
}

function raiseHint(level = hintLevel.value + 1, automatic = false) {
  if (isResolving.value || isComplete.value) return
  const nextLevel = Math.min(2, Math.max(level, hintLevel.value))
  if (nextLevel > hintLevel.value) {
    hintsUsed.value += nextLevel - hintLevel.value
    hintLevel.value = nextLevel
  }
  feedback.value = hintLevel.value === 1
    ? `下一鍵是 ${codeToCoordinates(nextExpectedKey.value)[0] ?? nextExpectedKey.value}，字根匣已經亮起。`
    : `完整拆碼是 ${answerCoordinates.value.join('、')}。`
  if (!automatic) scheduleHints()
  focusAnswer()
}

function registerWrong(key = '') {
  wrongCount.value += 1
  errorKey.value = key
  feedback.value = wrongCount.value === 1
    ? '這個鍵不在目前拆碼裡，沒有寫入答案。'
    : '再看一次字形；需要的話，讓提示帶你走下一步。'
  if (progress.settings.autoHintSeconds !== null) {
    if (wrongCount.value >= 4) raiseHint(2, true)
    else if (wrongCount.value >= 2) raiseHint(1, true)
  }
  setTimeout(() => { if (errorKey.value === key) errorKey.value = '' }, 420)
  focusAnswer()
}

function toggleTray(event: Event) {
  progress.setShowTray((event.target as HTMLInputElement).checked)
  focusAnswer()
}

function changeAutoHint(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  const seconds: AutoHintSeconds = value === 'manual' ? null : Number(value) as Exclude<AutoHintSeconds, null>
  progress.setAutoHintSeconds(seconds)
  feedback.value = seconds === null
    ? '自動提示已關閉；需要時再按「提示」。'
    : `停頓 ${seconds} 秒後會亮起下一鍵。`
  scheduleHints()
  focusAnswer()
}

function handlePhysicalKey(event: KeyboardEvent) {
  if (mode.value !== 'code' || event.metaKey || event.ctrlKey || event.altKey || isResolving.value || isComplete.value) return
  const target = event.target as HTMLElement | null
  if (target && target !== captureInput.value && target.matches('input, textarea, select, button, [contenteditable="true"]')) return
  if (event.key === 'Backspace') {
    event.preventDefault()
    codeBuffer.value = codeBuffer.value.slice(0, -1)
    scheduleHints()
    return
  }
  const key = event.key.toLowerCase()
  if (!VALID_CODE_KEYS.has(key)) return
  event.preventDefault()
  handleCodeKey(key)
}

function handleCodeKey(key: string) {
  if (mode.value !== 'code' || isResolving.value || isComplete.value || (lesson.value === 'quick-code' && !speedActive.value)) return
  const candidate = codeBuffer.value + key
  if (!isValidPrefix(candidate, acceptedAnswers.value)) {
    registerWrong(key)
    return
  }
  codeBuffer.value = candidate
  pressedKey.value = key
  errorKey.value = ''
  feedback.value = `已放入 ${codeToCoordinates(key)[0]}。`
  setTimeout(() => { if (pressedKey.value === key) pressedKey.value = '' }, 320)
  if (matchingAnswer(candidate, acceptedAnswers.value)) completeCurrent(true)
  else scheduleHints()
  focusAnswer()
}

function handleTextInput() {
  if (composing.value || isResolving.value || isComplete.value) return
  const target = currentPrompt.value?.text ?? ''
  if (textInput.value === target) {
    lastInvalidText.value = ''
    completeCurrent(true)
    return
  }
  if (!target.startsWith(textInput.value)) {
    if (lastInvalidText.value !== textInput.value) registerWrong()
    lastInvalidText.value = textInput.value
  } else {
    lastInvalidText.value = ''
    const typedLength = Array.from(textInput.value).length
    const targetCharacters = Array.from(target)
    const nextTargetIndex = targetCharacters.findIndex((char, index) => index >= typedLength && isCjkCharacter(char))
    if (currentPrompt.value && nextTargetIndex >= 0) currentPrompt.value.activeIndex = nextTargetIndex
    feedback.value = textInput.value ? '前面都正確，繼續輸入。' : '開啟系統行列輸入法，輸入上方文字。'
    scheduleHints()
  }
}

function makeAttempt(answered: boolean): Attempt {
  return {
    itemId: currentPrompt.value?.id ?? 'unknown',
    char: mode.value === 'code' && currentPrompt.value?.kind !== 'root' ? activeGlyph.value : undefined,
    mode: mode.value,
    lesson: lesson.value,
    correct: answered && wrongCount.value === 0,
    wrongCount: answered ? wrongCount.value : Math.max(1, wrongCount.value),
    hintsUsed: answered ? hintsUsed.value : Math.max(1, hintsUsed.value),
    elapsedMs: Date.now() - questionStartedAt.value,
    occurredAt: new Date().toISOString(),
  }
}

function queueRetry(attempt: Attempt) {
  if (attempt.wrongCount === 0 || currentPrompt.value?.isRetry || lesson.value === 'quick-code') return
  queue.value.push({
    id: `retry:${attempt.itemId}:${queue.value.length}`,
    kind: currentPrompt.value?.kind === 'root' ? 'root' : 'character',
    text: activeGlyph.value,
    activeIndex: 0,
    expectedAnswers: [...acceptedAnswers.value],
    isRetry: true,
  })
}

function completeCurrent(answered: boolean) {
  if (isResolving.value) return
  clearQuestionTimers()
  isResolving.value = true
  resultCorrect.value = answered
  const attempt = makeAttempt(answered)
  progress.recordAttempt(attempt)
  sessionAttempts.value.push(attempt)
  queueRetry(attempt)
  feedback.value = answered
    ? (mode.value === 'text' ? '輸入正確｜這一句已經排好了。' : `排好了｜${answerCoordinates.value.join(' · ')}`)
    : `先收進錯題｜答案是 ${answerCoordinates.value.join(' · ')}`

  transitionTimer = setTimeout(() => {
    const prompt = currentPrompt.value
    if (answered && prompt?.kind === 'text' && mode.value === 'code') {
      const nextIndex = nextCjkIndex(prompt.text, prompt.activeIndex)
      if (nextIndex >= 0) {
        prompt.activeIndex = nextIndex
        resetQuestionState()
        return
      }
    }
    promptIndex.value += 1
    if (promptIndex.value >= queue.value.length) finishSession()
    else resetQuestionState()
  }, 520)
}

function skipPrompt() {
  if (isResolving.value) return
  hintLevel.value = 2
  completeCurrent(false)
}

function finishSession() {
  clearQuestionTimers()
  if (speedTimer) clearInterval(speedTimer)
  speedActive.value = false
  isComplete.value = true
  progress.completeSession()
}

function openReview() {
  chooseLesson('review')
}

function restoreAnswerFocus() {
  focusAnswer()
}

function restoreVisibleAnswerFocus() {
  if (document.visibilityState !== 'hidden') restoreAnswerFocus()
}

watch(() => currentPrompt.value?.id, () => {
  if (!isComplete.value) resetQuestionState()
})

onMounted(() => {
  restartSession()
  window.addEventListener('keydown', handlePhysicalKey)
  window.addEventListener('focus', restoreAnswerFocus)
  document.addEventListener('visibilitychange', restoreVisibleAnswerFocus)
})
onBeforeUnmount(() => {
  clearQuestionTimers()
  if (speedTimer) clearInterval(speedTimer)
  if (transitionTimer) clearTimeout(transitionTimer)
  window.removeEventListener('keydown', handlePhysicalKey)
  window.removeEventListener('focus', restoreAnswerFocus)
  document.removeEventListener('visibilitychange', restoreVisibleAnswerFocus)
})
</script>

<template>
  <div class="practice-page">
    <nav class="course-track" aria-label="練習課程">
      <button
        v-for="(item, index) in lessons"
        :key="item.kind"
        :class="{ active: lesson === item.kind }"
        @click="chooseLesson(item.kind)"
      >
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        <b>{{ item.label }}</b>
        <small>{{ item.short }}</small>
      </button>
    </nav>

    <section class="workbench" :class="{ 'tray-open': progress.settings.showTray }">
      <header class="workbench-header">
        <div class="session-name">
          <span class="section-kicker">{{ currentPrompt?.isRetry ? '再排一次' : '本回合' }}</span>
          <h1>{{ lessonTitle }}</h1>
        </div>
        <div class="session-progress" aria-label="本回合進度">
          <span>{{ progressText }}</span>
          <i><b :style="{ width: `${progressPercent}%` }" /></i>
        </div>
        <ModeSwitch
          :model-value="mode"
          :disabled-text="lesson === 'roots' || lesson === 'quick-code' || lesson === 'review'"
          @update:model-value="changeMode"
        />
        <div class="practice-settings">
          <label class="hint-delay">
            <span>自動提示</span>
            <select
              :value="progress.settings.autoHintSeconds ?? 'manual'"
              aria-label="自動提示等待時間"
              @change="changeAutoHint"
            >
              <option v-for="choice in autoHintChoices" :key="choice.value" :value="choice.value">
                {{ choice.label }}
              </option>
            </select>
          </label>
          <label class="tray-toggle">
            <input
              type="checkbox"
              :checked="progress.settings.showTray"
              @change="toggleTray"
            />
            <span aria-hidden="true" />
            顯示拆碼表
          </label>
        </div>
      </header>

      <BasicStrokeGuide compact class="practice-strokes" />

      <SessionSummary
        v-if="isComplete"
        :attempts="sessionAttempts"
        :lesson="lesson"
        @restart="restartSession"
        @review="openReview"
      />

      <section v-else-if="lesson === 'quick-code' && !speedActive" class="speed-intro">
        <span class="speed-dial">60</span>
        <p class="section-kicker">一分鐘字盤</p>
        <h1>把熟悉的字，排得更快。</h1>
        <p>這一關只出一、二級簡碼與特別碼。計時開始後，答錯不會扣秒。</p>
        <button class="button primary" @click="startSpeed">開始 60 秒</button>
      </section>

      <div v-else class="practice-stage">
        <div v-if="currentPrompt?.kind === 'text'" class="phrase-context" aria-label="練習文字">
          <span
            v-for="(char, index) in currentCharacters"
            :key="`${char}-${index}`"
            :class="{ active: mode === 'code' && index === currentPrompt.activeIndex }"
          >{{ char }}</span>
        </div>
        <div v-else class="prompt-caption">
          <span v-if="currentPrompt?.isRetry">剛才卡住的字，再看一次</span>
          <span v-else-if="currentPrompt?.kind === 'root'">找出這組字根所在的鍵</span>
          <span v-else>看字拆碼</span>
        </div>

        <div v-if="mode === 'code'" class="glyph-platen" :class="{ root: currentPrompt?.kind === 'root' }">
          <span class="platen-guide" aria-hidden="true" />
          <strong>{{ activeGlyph }}</strong>
          <small v-if="rootDefinition">同鍵字根：{{ rootDefinition.roots.join('・') }}</small>
        </div>
        <div v-else class="text-platen">
          <span>請輸入</span>
          <strong>{{ currentPrompt?.text }}</strong>
        </div>

        <div v-if="mode === 'code'" class="code-rail" aria-label="拆碼輸入格">
          <span
            v-for="(key, index) in [...primaryAnswer]"
            :key="`${key}-${index}`"
            class="code-cell"
            :class="{
              filled: Boolean(codeBuffer[index]),
              revealed: hintLevel >= 2,
              next: hintLevel >= 1 && index === codeBuffer.length,
              typeset: Boolean(codeBuffer[index]) && index === codeBuffer.length - 1,
            }"
          >
            <b>{{ codeBuffer[index]?.toUpperCase() || (hintLevel >= 2 ? key.toUpperCase() : '·') }}</b>
            <small>{{ codeBuffer[index] || hintLevel >= 2 || (hintLevel >= 1 && index === codeBuffer.length) ? answerCoordinates[index] : '待拆' }}</small>
          </span>
        </div>

        <div class="feedback-line" :class="statusTone" role="status" aria-live="polite">
          <span class="feedback-icon" aria-hidden="true">{{ isResolving ? (resultCorrect ? '✓' : '↺') : hintLevel ? '⌁' : '·' }}</span>
          <p>{{ feedback }}</p>
        </div>

        <input
          v-if="mode === 'code'"
          ref="captureInput"
          class="keyboard-capture"
          aria-label="鍵碼輸入區，直接按鍵作答"
          :value="codeBuffer"
          readonly
          autocomplete="off"
          @keydown.stop="handlePhysicalKey"
        />
        <textarea
          v-else
          ref="textArea"
          v-model="textInput"
          class="ime-input"
          :class="{ invalid: lastInvalidText }"
          rows="2"
          aria-label="使用系統行列輸入法輸入題目"
          autocomplete="off"
          spellcheck="false"
          @compositionstart="composing = true"
          @compositionend="composing = false; handleTextInput()"
          @input="handleTextInput"
        />

        <div class="practice-actions">
          <button class="button hint-button" :disabled="hintLevel >= 2" @click="raiseHint()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21h6m-5-3h4m4-8a6 6 0 1 0-10.1 4.4c.7.6 1.1 1.4 1.1 2.1h6c0-.8.4-1.6 1.1-2.2A5.9 5.9 0 0 0 18 10Z" /></svg>
            {{ hintLevel === 0 ? '給我一點提示' : hintLevel === 1 ? '顯示完整拆碼' : '答案已顯示' }}
          </button>
          <button class="button text-button" @click="skipPrompt">先跳過</button>
        </div>
      </div>

      <Transition name="tray-slide">
        <TypeTray
          v-if="progress.settings.showTray && !isComplete"
          :next-key="hintLevel >= 1 ? nextExpectedKey : undefined"
          :entered-keys="[...codeBuffer]"
          :pressed-key="pressedKey"
          :error-key="errorKey"
          :show-numbers="lesson === 'quick-code'"
          :interactive="mode === 'code'"
          @key="handleCodeKey"
        />
      </Transition>
    </section>
  </div>
</template>

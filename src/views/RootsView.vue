<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BasicStrokeGuide from '../components/BasicStrokeGuide.vue'
import TypeTray from '../components/TypeTray.vue'
import { isArrayLookupCharacter } from '../data'
import { codeToCoordinates } from '../data/keys'
import { lookupCharacter, lookupManifest } from '../data/lookup'
import type { CharacterEntry } from '../types'

const query = ref('')
const searchedChar = computed(() => Array.from(query.value.trim()).find(isArrayLookupCharacter) ?? '')
const result = ref<CharacterEntry>()
const lookupState = ref<'idle' | 'loading' | 'found' | 'not-found' | 'error'>('idle')
let searchToken = 0

const unicodeLabel = computed(() => {
  const codePoint = searchedChar.value.codePointAt(0)
  return codePoint === undefined ? '' : `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`
})

const lookupCount = new Intl.NumberFormat('zh-TW').format(lookupManifest.unifiedIdeographEntryCount)

async function runLookup(char: string) {
  const token = ++searchToken
  result.value = undefined
  if (!char) {
    lookupState.value = 'idle'
    return
  }

  lookupState.value = 'loading'
  try {
    const entry = await lookupCharacter(char)
    if (token !== searchToken) return
    result.value = entry
    lookupState.value = entry ? 'found' : 'not-found'
  } catch {
    if (token === searchToken) lookupState.value = 'error'
  }
}

watch(searchedChar, runLookup, { immediate: true })

</script>

<template>
  <div class="reference-page page-shell">
    <section class="reference-hero">
      <div>
        <p class="section-kicker">拆碼參考室</p>
        <h1>兩個方向，<br />找到一個字根。</h1>
      </div>
      <p class="hero-explainer">
        首筆決定數字行，尾筆決定鍵盤列。尾筆 0–4 在上列、5 或無尾筆在中列、6–9 在下列。
      </p>
    </section>

    <BasicStrokeGuide />

    <TypeTray :interactive="false" />

    <section class="lookup-panel">
      <div class="lookup-copy">
        <p class="section-kicker">單字查碼</p>
        <h2>卡住時，先把字查清楚。</h2>
        <p>輸入一個中文字，查看完整碼、簡碼與特別碼。練習題仍會把三者分開。</p>
        <p class="lookup-coverage">涵蓋官方大字集中的 <b>{{ lookupCount }}</b> 個 Unicode 17 統一表意文字。</p>
      </div>
      <div class="lookup-control">
        <label for="character-lookup">要查哪個字？</label>
        <input
          id="character-lookup"
          v-model="query"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          aria-describedby="lookup-font-note"
          placeholder="例：行或𨑨"
        />
      </div>
      <div v-if="lookupState === 'found' && result" class="lookup-result" aria-live="polite">
        <div class="lookup-glyph">
          <strong>{{ result.char }}</strong>
          <small>{{ unicodeLabel }}</small>
        </div>
        <dl>
          <div>
            <dt>完整碼</dt>
            <dd v-for="code in result.fullCodes" :key="code">
              <b>{{ code.toUpperCase() }}</b><span>{{ codeToCoordinates(code).join(' · ') }}</span>
            </dd>
          </div>
          <div v-if="result.quickCodes.length">
            <dt>簡碼</dt>
            <dd><b>{{ result.quickCodes.join(' / ').toUpperCase() }}</b></dd>
          </div>
          <div v-if="result.specialCodes.length">
            <dt>特別碼</dt>
            <dd><b>{{ result.specialCodes.join(' / ').toUpperCase() }}</b></dd>
          </div>
        </dl>
      </div>
      <p v-else-if="lookupState === 'loading'" class="lookup-status" role="status">正在翻查 {{ unicodeLabel }} 的字碼…</p>
      <p v-else-if="lookupState === 'not-found'" class="lookup-empty" role="status">
        官方 {{ lookupManifest.version }} 大字集中找不到「{{ searchedChar }}」。
      </p>
      <div v-else-if="lookupState === 'error'" class="lookup-empty lookup-error" role="alert">
        <span>字碼資料未能載入，請稍後再試。</span>
        <button class="button quiet" type="button" @click="runLookup(searchedChar)">重新查詢</button>
      </div>
      <p v-else-if="query.trim()" class="lookup-empty" role="status">請輸入一個中文字再查詢。</p>
      <p id="lookup-font-note" class="lookup-font-note">
        罕見字能否顯示原字形，取決於瀏覽器或裝置已安裝的字型；即使顯示成方框，字碼仍可正常查詢。
      </p>
    </section>
  </div>
</template>

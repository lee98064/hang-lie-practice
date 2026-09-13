<script setup lang="ts">
import { computed, ref } from 'vue'
import TypeTray from '../components/TypeTray.vue'
import { arrayData, characterByGlyph } from '../data'
import { codeToCoordinates } from '../data/keys'

const query = ref('')
const searchedChar = computed(() => Array.from(query.value.trim())[0] ?? '')
const result = computed(() => characterByGlyph.get(searchedChar.value))
const basicStrokes = [
  ['1', '一', '橫'], ['2', '𠃋', '逆彎'], ['3', '丨', '直'], ['4', '十', '正交'], ['5', '㇇', '順彎'],
  ['6', '丶', '點'], ['7', 'ㄇ', '蓋'], ['8', '八・乀', '八捺'], ['9', '丿', '撇'], ['0', '口', '方框'],
]
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

    <section class="stroke-system" aria-labelledby="stroke-title">
      <header>
        <p class="section-kicker">十種基本筆形</p>
        <h2 id="stroke-title">先認數字，再找上中下。</h2>
      </header>
      <div class="stroke-grid">
        <div v-for="stroke in basicStrokes" :key="stroke[0]">
          <b>{{ stroke[0] }}</b>
          <strong>{{ stroke[1] }}</strong>
          <span>{{ stroke[2] }}</span>
        </div>
      </div>
    </section>

    <TypeTray :interactive="false" />

    <section class="lookup-panel">
      <div class="lookup-copy">
        <p class="section-kicker">單字查碼</p>
        <h2>卡住時，先把字查清楚。</h2>
        <p>輸入一個繁體中文字，查看完整碼、簡碼與特別碼。練習題仍會把三者分開。</p>
      </div>
      <div class="lookup-control">
        <label for="character-lookup">要查哪個字？</label>
        <input id="character-lookup" v-model="query" maxlength="2" placeholder="例：行" />
      </div>
      <div v-if="result" class="lookup-result" aria-live="polite">
        <strong>{{ result.char }}</strong>
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
      <p v-else-if="searchedChar" class="lookup-empty" role="status">目前的 {{ arrayData.meta.entryCount }} 字練習教材中找不到這個字。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProgressStore } from '../stores/progress'

const progress = useProgressStore()
const confirmingReset = ref(false)

const learnedCount = computed(() => Object.keys(progress.mastery).length)
const masteryLevels = computed(() => Array.from({ length: 6 }, (_, level) => ({
  level,
  count: Object.values(progress.mastery).filter((record) => record.level === level).length,
})))
const maxLevelCount = computed(() => Math.max(1, ...masteryLevels.value.map(({ count }) => count)))
const recentAttempts = computed(() => [...progress.attempts].reverse().slice(0, 12))
const totalWrong = computed(() => progress.attempts.reduce((total, attempt) => total + attempt.wrongCount, 0))

function resetAll() {
  progress.resetProgress()
  confirmingReset.value = false
}
</script>

<template>
  <div class="progress-page page-shell">
    <section class="progress-hero">
      <div>
        <p class="section-kicker">手指留下的路徑</p>
        <h1>不追排名，<br />只看今天比昨天熟一點。</h1>
      </div>
      <RouterLink class="button primary" to="/">繼續練習</RouterLink>
    </section>

    <section class="metric-strip" aria-label="練習統計">
      <div><strong>{{ progress.practicedToday }}</strong><span>今天完成</span></div>
      <div><strong>{{ progress.averageAccuracy }}%</strong><span>首次正確</span></div>
      <div><strong>{{ learnedCount }}</strong><span>練過的字</span></div>
      <div><strong>{{ progress.dueCount }}</strong><span>待複習</span></div>
    </section>

    <section class="mastery-panel">
      <header>
        <div>
          <p class="section-kicker">熟練度 0—5</p>
          <h2>記憶不是直線，是一次次回來。</h2>
        </div>
        <p>無提示答對會向前一級；卡住的字會更早回到練習匣。</p>
      </header>
      <div class="mastery-chart">
        <div v-for="item in masteryLevels" :key="item.level">
          <span class="bar-track"><i :style="{ height: `${Math.max(item.count ? 12 : 2, item.count / maxLevelCount * 100)}%` }" /></span>
          <b>{{ item.count }}</b>
          <small>第 {{ item.level }} 級</small>
        </div>
      </div>
    </section>

    <section class="history-panel">
      <header>
        <div>
          <p class="section-kicker">最近練習</p>
          <h2>{{ recentAttempts.length ? '剛才排過的字' : '第一筆紀錄會出現在這裡' }}</h2>
        </div>
        <span v-if="recentAttempts.length">累計錯鍵 {{ totalWrong }} 次</span>
      </header>
      <div v-if="recentAttempts.length" class="attempt-list">
        <div v-for="attempt in recentAttempts" :key="`${attempt.occurredAt}-${attempt.itemId}`">
          <b>{{ attempt.char || '句' }}</b>
          <span>{{ attempt.lesson === 'roots' ? '字根鍵位' : attempt.lesson === 'quick-code' ? '速度碼' : attempt.lesson === 'phrase' ? '詞句' : '完整碼' }}</span>
          <span>{{ attempt.hintsUsed ? `提示 ${attempt.hintsUsed}` : '無提示' }}</span>
          <time :datetime="attempt.occurredAt">{{ new Date(attempt.occurredAt).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }) }}</time>
          <i :class="attempt.correct ? 'right' : 'retry'">{{ attempt.correct ? '穩' : '再練' }}</i>
        </div>
      </div>
      <div v-else class="history-empty">
        <span>字</span>
        <p>完成第一題後，這裡會記下熟練度與複習時間。</p>
      </div>
    </section>

    <section class="data-settings">
      <div>
        <p class="section-kicker">本機資料</p>
        <h2>紀錄只留在這個瀏覽器。</h2>
        <p>沒有帳號，也不會上傳練習內容。清除後無法復原。</p>
      </div>
      <button v-if="!confirmingReset" class="button danger-quiet" @click="confirmingReset = true">清除學習紀錄</button>
      <div v-else class="reset-confirm">
        <span>確定清除？</span>
        <button class="button danger" @click="resetAll">確定清除</button>
        <button class="button quiet" @click="confirmingReset = false">保留紀錄</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Attempt, LessonKind } from '../types'
import { median } from '../utils/practice'

const props = defineProps<{ attempts: Attempt[]; lesson: LessonKind }>()
defineEmits<{ restart: []; review: [] }>()

const accurate = computed(() => props.attempts.filter(({ correct }) => correct).length)
const noHint = computed(() => props.attempts.filter(({ correct, hintsUsed }) => correct && hintsUsed === 0).length)
const accuracy = computed(() => props.attempts.length ? Math.round(accurate.value / props.attempts.length * 100) : 0)
const medianSeconds = computed(() => (median(props.attempts.map(({ elapsedMs }) => elapsedMs)) / 1000).toFixed(1))
const weakChars = computed(() => [...new Set(props.attempts.filter(({ wrongCount }) => wrongCount > 0).map(({ char }) => char).filter(Boolean))].slice(0, 12))
</script>

<template>
  <section class="session-summary" aria-labelledby="summary-title">
    <span class="summary-stamp" aria-hidden="true">完成</span>
    <p class="section-kicker">本回合已排好</p>
    <h1 id="summary-title">手指記住了一些新位置。</h1>
    <div class="summary-grid">
      <div><strong>{{ accuracy }}%</strong><span>首次正確</span></div>
      <div><strong>{{ noHint }}</strong><span>無提示答對</span></div>
      <div><strong>{{ medianSeconds }}s</strong><span>反應中位數</span></div>
    </div>
    <div v-if="weakChars.length" class="weak-list">
      <span>已排入複習</span>
      <b v-for="char in weakChars" :key="char">{{ char }}</b>
    </div>
    <p v-else class="summary-note">這一回沒有新增錯題，節奏很穩。</p>
    <div class="summary-actions">
      <button class="button primary" @click="$emit('restart')">再練一回</button>
      <button class="button quiet" @click="$emit('review')">練剛才的錯字</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DecompositionStep } from '../types'

const props = defineProps<{
  char: string
  answers: string[]
  steps: DecompositionStep[]
  open: boolean
}>()

const emit = defineEmits<{ 'toggle-guide': [] }>()
</script>

<template>
  <section class="why-panel" aria-labelledby="why-title">
    <button
      class="why-toggle"
      type="button"
      :aria-expanded="props.open"
      aria-controls="why-content"
      @click="emit('toggle-guide')"
    >
      <span class="why-toggle-mark" aria-hidden="true">?</span>
      <span>
        <b id="why-title">為什麼這樣拆？</b>
        <small>查看這個字的鍵位理由</small>
      </span>
      <span class="why-chevron" aria-hidden="true">{{ props.open ? '−' : '+' }}</span>
    </button>

    <div v-if="props.open" id="why-content" class="why-content">
      <p v-if="props.answers.length" class="why-lead">
        「{{ props.char }}」的官方完整碼之一是
        <strong>{{ props.answers[0]?.toUpperCase() }}</strong>，下面逐鍵拆開看。
      </p>
      <p v-else class="why-lead">目前字集沒有「{{ props.char }}」的完整碼資料，請到字根表查詢。</p>

      <ol v-if="props.steps.length" class="why-steps">
        <li v-for="(step, index) in props.steps" :key="`${step.key}-${index}`">
          <span class="why-step-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <div class="why-step-copy">
            <div class="why-step-heading">
              <b>{{ step.key.toUpperCase() }}</b>
              <span>{{ step.coordinate }}</span>
              <em>{{ step.strokeGlyph }} {{ step.strokeName }}</em>
            </div>
            <p>
              數字 {{ step.strokeNumber }} 對應{{ step.strokeName }}；{{ step.row }}列是尾筆分類。
              這個鍵常見字根：<span class="why-roots">{{ step.roots.join('、') }}</span>
            </p>
          </div>
        </li>
      </ol>

      <p v-if="props.answers.length > 1" class="why-alternates">
        同字另有合法完整碼：{{ props.answers.slice(1).map((answer) => answer.toUpperCase()).join('、') }}
      </p>
      <p class="why-note">
        展開說明會視為完整提示。行列完整碼依字根順序取 1～4 鍵；本說明使用官方 CIN 的完整碼與鍵位資料，解釋可驗證的鍵碼規則，不猜測字形的筆畫分件。
      </p>
    </div>
  </section>
</template>

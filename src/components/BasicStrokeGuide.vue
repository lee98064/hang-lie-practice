<script setup lang="ts">
import { BASIC_STROKES } from '../data/keys'

withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false,
})
</script>

<template>
  <section
    class="stroke-system"
    :class="{ compact }"
    :aria-labelledby="compact ? 'practice-stroke-title' : 'stroke-title'"
  >
    <header>
      <p class="section-kicker">十種基本筆形</p>
      <h2 :id="compact ? 'practice-stroke-title' : 'stroke-title'">
        {{ compact ? '拆碼時，先看首尾兩筆。' : '先認數字，再找上中下。' }}
      </h2>
    </header>
    <div class="stroke-grid" role="list">
      <div
        v-for="stroke in BASIC_STROKES"
        :key="stroke.number"
        role="listitem"
        :aria-label="`${stroke.number} 號筆形，${stroke.name}`"
      >
        <b>{{ stroke.number }}</b>
        <strong>{{ stroke.glyph }}</strong>
        <span>{{ stroke.name }}</span>
      </div>
    </div>
  </section>
</template>

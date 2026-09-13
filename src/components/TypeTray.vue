<script setup lang="ts">
import { computed } from 'vue'
import { ARRAY_KEYS } from '../data/keys'

const props = withDefaults(defineProps<{
  nextKey?: string
  enteredKeys?: string[]
  pressedKey?: string
  errorKey?: string
  showNumbers?: boolean
  interactive?: boolean
  compact?: boolean
}>(), {
  enteredKeys: () => [],
  interactive: true,
  compact: false,
})

const emit = defineEmits<{ key: [value: string] }>()
const rows = ['upper', 'middle', 'lower'] as const
const grouped = computed(() => rows.map((row) => ARRAY_KEYS.filter((key) => key.row === row)))
const numberKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
</script>

<template>
  <section class="type-tray" :class="{ compact }" aria-label="行列三十鍵字根表">
    <header class="tray-heading">
      <div>
        <span class="section-kicker">字根匣</span>
        <strong>首筆定行，尾筆定列</strong>
      </div>
      <div class="tray-legend" aria-label="提示圖例">
        <span><i class="legend-next" />下一鍵</span>
        <span><i class="legend-used" />已輸入</span>
      </div>
    </header>

    <div v-if="showNumbers" class="number-row" aria-label="候選數字鍵">
      <button
        v-for="number in numberKeys"
        :key="number"
        type="button"
        :class="{ next: nextKey === number, pressed: pressedKey === number, error: errorKey === number }"
        :disabled="!interactive"
        :aria-label="`候選 ${number}`"
        @click="emit('key', number)"
      >
        <b>{{ number }}</b><small>候選</small>
      </button>
    </div>

    <div v-for="(row, rowIndex) in grouped" :key="rows[rowIndex]" class="tray-row">
      <span class="row-label">{{ ['上', '中', '下'][rowIndex] }}</span>
      <div class="key-grid">
        <button
          v-for="definition in row"
          :key="definition.key"
          type="button"
          :class="{
            next: nextKey === definition.key,
            used: enteredKeys.includes(definition.key),
            pressed: pressedKey === definition.key,
            error: errorKey === definition.key,
          }"
          :disabled="!interactive"
          :aria-label="`${definition.key.toUpperCase()}，${definition.coordinate}，字根 ${definition.roots.join('、')}`"
          @click="emit('key', definition.key)"
        >
          <span class="key-meta"><b>{{ definition.key.toUpperCase() }}</b><small>{{ definition.coordinate }}</small></span>
          <span class="key-roots">{{ definition.roots.join(' ') }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

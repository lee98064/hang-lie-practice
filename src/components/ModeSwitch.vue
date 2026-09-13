<script setup lang="ts">
import type { InputMode } from '../types'

defineProps<{ modelValue: InputMode; disabledText?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: InputMode] }>()
</script>

<template>
  <div class="mode-switch" role="group" aria-label="輸入模式">
    <button :class="{ active: modelValue === 'code' }" @click="emit('update:modelValue', 'code')">
      鍵碼拆字
    </button>
    <button
      :class="{ active: modelValue === 'text' }"
      :disabled="disabledText"
      :title="disabledText ? '這個課程需要直接按鍵' : undefined"
      @click="emit('update:modelValue', 'text')"
    >
      系統輸入
    </button>
  </div>
</template>

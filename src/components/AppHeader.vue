<script setup lang="ts">
import { useProgressStore } from '../stores/progress'

const progress = useProgressStore()
</script>

<template>
  <header class="site-header">
    <RouterLink class="brand" to="/" aria-label="行列練習所首頁">
      <span class="brand-mark" aria-hidden="true">
        <i v-for="index in 6" :key="index" />
      </span>
      <span>
        <b>行列練習所</b>
        <small>ARRAY 30 STUDIO</small>
      </span>
    </RouterLink>

    <nav class="primary-nav" aria-label="主要導覽">
      <RouterLink to="/">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5zM8 8h3v3H8zm5 0h3v3h-3zm-5 5h3v3H8zm5 0h3v3h-3z" /></svg>
        <span>開始練習</span>
      </RouterLink>
      <RouterLink to="/roots">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4zm16 0A2.5 2.5 0 0 0 17.5 3H16v14h.5a3 3 0 0 1 3 3H20z" /></svg>
        <span>字根表</span>
      </RouterLink>
      <RouterLink to="/progress">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9h3v10zm6 0V5h3v14zm6 0v-7h3v7z" /></svg>
        <span>學習紀錄</span>
      </RouterLink>
    </nav>

    <div class="daily-progress" :title="`今天已完成 ${progress.practicedToday} 題`">
      <span>{{ Math.min(progress.practicedToday, progress.settings.dailyGoal) }}/{{ progress.settings.dailyGoal }}</span>
      <i><b :style="{ width: `${Math.min(100, progress.practicedToday / progress.settings.dailyGoal * 100)}%` }" /></i>
      <small>今日練習</small>
    </div>
  </header>
</template>

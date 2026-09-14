<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <AppHeader />
  <main id="main-content">
    <RouterView />
  </main>
  <footer class="site-footer">
    <span>行列 30 練習所</span>
    <span>鍵碼資料：v2026-1.06 大字集 · 2026-08-01</span>
    <a href="https://github.com/gontera/array30" target="_blank" rel="noreferrer">資料來源與作者說明 ↗</a>
  </footer>
</template>

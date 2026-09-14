import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const githubProject = process.env.GITHUB_REPOSITORY?.split('/')[1]

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' && githubProject
    ? `/${githubProject}/`
    : '/',
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})

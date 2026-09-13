import { createRouter, createWebHashHistory } from 'vue-router'
import PracticeView from '../views/PracticeView.vue'
import RootsView from '../views/RootsView.vue'
import ProgressView from '../views/ProgressView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'practice', component: PracticeView },
    { path: '/roots', name: 'roots', component: RootsView },
    { path: '/progress', name: 'progress', component: ProgressView },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

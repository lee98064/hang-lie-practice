import '@fontsource-variable/noto-sans-tc'
import '@fontsource/lxgw-wenkai-tc/400.css'
import '@fontsource/lxgw-wenkai-tc/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './assets/main.css'

createApp(App).use(createPinia()).use(router).mount('#app')

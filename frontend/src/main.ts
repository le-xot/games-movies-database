import { PiniaColada } from '@pinia/colada'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from '@/app.vue'
import { router } from '@/router/router'
import '@/assets/index.css'
import 'vue-sonner/style.css'

const APP_VERSION = '3.3.0'
const STORAGE_VERSION_KEY = 'app_version'

const KEYS_TO_CLEAR = ['viewed-suggestions', 'suggestion-sort-by']

const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY)
if (storedVersion !== APP_VERSION) {
  for (const key of KEYS_TO_CLEAR) {
    localStorage.removeItem(key)
  }
  localStorage.setItem(STORAGE_VERSION_KEY, APP_VERSION)
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.use(PiniaColada, {
  pinia,
  queryOptions: { refetchOnMount: true, refetchOnWindowFocus: false },
})

app.mount('#app')

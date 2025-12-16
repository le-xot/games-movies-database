import { router } from '@/lib/router/router'
import { PiniaColada } from '@pinia/colada'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './app.vue'
import './assets/index.css'

const APP_VERSION = '3.1.0'
const STORAGE_VERSION_KEY = 'app_version'

const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY)
if (storedVersion !== APP_VERSION) {
  localStorage.clear()
  localStorage.setItem(STORAGE_VERSION_KEY, APP_VERSION)
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

PiniaColada(app, {
  pinia,
  refetchOnMount: true,
  refetchOnWindowFocus: false,
})

// highlight re-renders
// if (import.meta.env.DEV) {
//   app.mixin({
//     updated() {
//       const el = this.$el
//       if (el && el.style) {
//         el.style.transition = 'box-shadow 0.3s ease'
//         el.style.boxShadow = 'inset 0px 0px 0px 1px tomato'
//         setTimeout(() => el.style.boxShadow = '', 300)
//       }
//     },
//   })
// }

app.mount('#app')

import { PiniaColada } from '@pinia/colada'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from '@/app.vue'
import { router } from '@/router/router'
import { useUser } from '@/stores/use-user'
import '@/assets/index.css'
import 'vue-sonner/style.css'

const APP_VERSION = '3.3.0'
const STORAGE_VERSION_KEY = 'app_version'

/** Сколько ждём /api/auth/me до первого рендера. Дольше — монтируемся и догружаем в фоне. */
const AUTH_BOOT_TIMEOUT_MS = 1500

/** Сколько держим заставку ради баннера главной. Дольше — показываем страницу без него. */
const HERO_IMAGE_TIMEOUT_MS = 800

const KEYS_TO_CLEAR = ['viewed-suggestions', 'suggestion-sort-by']

const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY)
if (storedVersion !== APP_VERSION) {
  for (const key of KEYS_TO_CLEAR) {
    localStorage.removeItem(key)
  }
  localStorage.setItem(STORAGE_VERSION_KEY, APP_VERSION)
}

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(PiniaColada, {
    pinia,
    queryOptions: { staleTime: 30_000, refetchOnMount: true, refetchOnWindowFocus: false },
  })

  // Грузим пользователя параллельно с монтированием; заставка не даёт увидеть гостевой кадр.
  const authReady = useUser(pinia).fetchUser()
  const bootTimeout = new Promise((resolve) => setTimeout(resolve, AUTH_BOOT_TIMEOUT_MS))

  app.use(router)
  // Монтируем сразу: заставка непрозрачная и скрывает ещё не готовый интерфейс,
  // зато палитра, хоткеи и сокет живут с первого кадра.
  app.mount('#app')

  await Promise.race([authReady, bootTimeout])
  await Promise.race([
    router.isReady(),
    new Promise((resolve) => setTimeout(resolve, AUTH_BOOT_TIMEOUT_MS)),
  ])

  // Дефолтный экран — советы: прогреваем данные параллельно с монтированием,
  // чтобы первый кадр страницы был уже с контентом.
  if (router.currentRoute.value.name === 'suggestion') {
    void import('@/pages/suggestion/composables/use-suggestion').then(({ useSuggestion }) => {
      useSuggestion(pinia)
    })
  }

  await waitForHeroImage()

  hideBootSplash()
}

/**
 * Баннер главной грузится только после монтирования роута, а заставка к этому моменту
 * уже готова уйти. Ждём декод, чтобы не показать пустую ячейку с alt вместо картинки.
 */
async function waitForHeroImage() {
  if (router.currentRoute.value.name !== 'home') return

  const hero = document.querySelector<HTMLImageElement>('img[data-hero]')
  if (!hero || (hero.complete && hero.naturalWidth > 0)) return

  await Promise.race([
    hero.decode().catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, HERO_IMAGE_TIMEOUT_MS)),
  ])
}

/** Гасит инлайновую заставку из index.html уже поверх смонтированного приложения. */
function hideBootSplash() {
  const splash = document.getElementById('boot-splash')
  if (!splash) return

  // Заставка видна с первого кадра. Держим её минимум 200 мс, чтобы на очень быстрой
  // загрузке она не мигнула одним кадром, и плавно гасим поверх уже отрисованного приложения.
  const minVisible = 200
  const wait = Math.max(0, minVisible - performance.now())

  setTimeout(() => {
    splash.classList.add('boot-splash--hidden')
    setTimeout(() => splash.remove(), 200)
  }, wait)
}

void bootstrap()

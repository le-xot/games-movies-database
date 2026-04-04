import { PiniaColada } from '@pinia/colada';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { router } from '@/router/router';
import App from './app.vue';
import './assets/index.css';

// Migrate old shared columnsVisibility key to per-genre keys
const oldVisibility = localStorage.getItem('columnsVisibility');
if (oldVisibility !== null) {
  for (const genre of ['anime', 'cartoon', 'movie', 'games', 'series']) {
    if (!localStorage.getItem(`columnsVisibility:${genre}`)) {
      localStorage.setItem(`columnsVisibility:${genre}`, oldVisibility);
    }
  }
  localStorage.removeItem('columnsVisibility');
}

const APP_VERSION = '3.1.0';
const STORAGE_VERSION_KEY = 'app_version';

const KEYS_TO_CLEAR = [
  'columnsVisibility',
  'columnsVisibility:anime',
  'columnsVisibility:cartoon',
  'columnsVisibility:movie',
  'columnsVisibility:games',
  'columnsVisibility:series',
  'table-page-size',
  'viewed-suggestions',
  'suggestion-sort-by',
];

const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
if (storedVersion !== APP_VERSION) {
  for (const key of KEYS_TO_CLEAR) {
    localStorage.removeItem(key);
  }
  localStorage.setItem(STORAGE_VERSION_KEY, APP_VERSION);
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

PiniaColada(app, {
  pinia,
  refetchOnMount: true,
  refetchOnWindowFocus: false,
});

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

app.mount('#app');

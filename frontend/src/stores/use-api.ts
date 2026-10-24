import { api } from '@/lib/api'

/**
 * Eden-клиент нельзя держать в Pinia: он Proxy, а `reactive()` ломает его
 * внутренние ловушки (вызовы перестают собирать URL). Поэтому просто
 * возвращаем клиент — вызовы на местах выглядят как раньше.
 */
export function useApi() {
  return api
}

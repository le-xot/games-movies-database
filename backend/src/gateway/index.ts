import { Elysia } from 'elysia'
import { weatherRoutes, type WeatherReader } from '@/gateway/weather'

/**
 * Composition root гейтвея: доменные сервисы передаются явно, без DI-контейнера.
 * Гейтвей не знает ни про Nest, ни про то, как сервисы создаются.
 */
export interface GatewayDeps {
  weather: WeatherReader
}

export function createGateway(deps: GatewayDeps) {
  return new Elysia({ name: 'gateway' }).use(weatherRoutes(deps.weather))
}

export type Gateway = ReturnType<typeof createGateway>

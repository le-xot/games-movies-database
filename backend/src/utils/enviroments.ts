import process from "node:process"
import { cleanEnv, num, str } from "envalid"

export const env = cleanEnv(process.env, {
  DATASOURCE_URL: str({}),
  JWT_SECRET: str({}),
  APP_PORT: num({ default: 3000 }),

  NODE_ENV: str({ choices: ["development", "production"], default: "development" }),

  TWITCH_CLIENT_ID: str({ default: null }),
  TWITCH_CLIENT_SECRET: str({ default: null }),
  TWITCH_CALLBACK_URL: str({ }),
  TWITCH_ADMIN_ID: str({ default: null }),
  TWITCH_ADMIN_LOGIN: str({ default: null }),

  SPOTIFY_CLIENT_ID: str({ default: null }),
  SPOTIFY_CLIENT_SECRET: str({ default: null }),
  SPOTIFY_CALLBACK_URL: str({ default: null }),

  WEATHER_API_KEY: str({ default: null }),
  WEATHER_LAT: str({ default: null }),
  WEATHER_LON: str({ default: null }),

  KINOPOISK_API: str({ default: null }),
  TMBD_API: str({ default: null }),

  TWIR_API: str({ default: null }),
})

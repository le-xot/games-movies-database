import process from 'node:process'
import { cleanEnv, num, str } from 'envalid'

export const env = cleanEnv(process.env, {
  DATASOURCE_URL: str({}),
  JWT_SECRET: str({}),
  APP_PORT: num({ default: 3000 }),
  REDIS_URL: str({ default: 'redis://localhost:6379' }),

  NODE_ENV: str({ choices: ['development', 'production'], default: 'development' }),

  TWITCH_CLIENT_ID: str({ default: null }),
  TWITCH_CLIENT_SECRET: str({ default: null }),
  TWITCH_CALLBACK_URL: str({}),

  KICK_CLIENT_ID: str({ default: null }),
  KICK_CLIENT_SECRET: str({ default: null }),
  KICK_CALLBACK_URL: str({ default: null }),

  TELEGRAM_CLIENT_ID: str({ default: null }),
  TELEGRAM_CLIENT_SECRET: str({ default: null }),
  TELEGRAM_OIDC_REDIRECT_URI: str({
    default: 'http://localhost:3000/api/auth/telegram/oidc/callback',
  }),
  TELEGRAM_CALLBACK_URL: str({ default: 'http://localhost:5173/auth/callback/telegram' }),

  WEATHER_API_KEY: str({ default: null }),
  WEATHER_LAT: str({ default: null }),
  WEATHER_LON: str({ default: null }),

  KINOPOISK_API: str({ default: null }),

  TWIR_API: str({ default: null }),

  STEAM_API_KEY: str({ default: null }),
  STEAM_ID: str({ default: null }),

  PROXY: str({ default: null }),

  S3_ENDPOINT: str({ default: 'http://rustfs:9000' }),
  S3_ACCESS_KEY_ID: str({ default: 'rustfsadmin' }),
  S3_SECRET_ACCESS_KEY: str({ default: 'rustfsadmin' }),
  S3_BUCKET_IMAGES: str({ default: 'images' }),
  S3_BUCKET_AVATARS: str({ default: 'avatars' }),
})

import process from 'node:process'
import { cleanEnv, num, str } from 'envalid'
import { DEFAULT_CORS_ORIGINS } from '@/utils/cors-origins'

export const env = cleanEnv(process.env, {
  DATASOURCE_URL: str({}),
  JWT_SECRET: str({}),
  APP_PORT: num({ default: 3000 }),
  REDIS_URL: str({ default: 'redis://localhost:6379' }),
  CORS_ORIGINS: str({ default: DEFAULT_CORS_ORIGINS }),

  NODE_ENV: str({ choices: ['development', 'production'], default: 'development' }),

  TWITCH_CLIENT_ID: str({ default: undefined }),
  TWITCH_CLIENT_SECRET: str({ default: undefined }),
  TWITCH_CALLBACK_URL: str({}),

  KICK_CLIENT_ID: str({ default: undefined }),
  KICK_CLIENT_SECRET: str({ default: undefined }),
  KICK_CALLBACK_URL: str({ default: undefined }),

  TELEGRAM_CLIENT_ID: str({ default: undefined }),
  TELEGRAM_CLIENT_SECRET: str({ default: undefined }),
  TELEGRAM_OIDC_REDIRECT_URI: str({
    default: 'http://localhost:3000/api/auth/telegram/oidc/callback',
  }),
  TELEGRAM_CALLBACK_URL: str({ default: 'http://localhost:5173/auth/callback/telegram' }),

  TELEGRAM_BOT_TOKEN: str({ default: undefined }),
  TELEGRAM_BOT_WEBHOOK_URL: str({ default: undefined }),
  TELEGRAM_BOT_WEBHOOK_SECRET: str({ default: undefined }),

  APP_PUBLIC_URL: str({ devDefault: 'http://localhost:5173', default: 'https://le-xot.dev' }),

  WORDLE_NOTIFY_MORNING: str({ default: '12:00' }),
  WORDLE_NOTIFY_EVENING: str({ default: '20:00' }),

  WEATHER_API_KEY: str({ default: undefined }),
  WEATHER_LAT: str({ default: undefined }),
  WEATHER_LON: str({ default: undefined }),

  KINOPOISK_API: str({ default: undefined }),

  TWIR_API: str({ default: undefined }),

  STEAM_API_KEY: str({ default: undefined }),
  STEAM_ID: str({ default: undefined }),

  PROXY: str({ default: undefined }),

  S3_ENDPOINT: str({ default: 'http://rustfs:9000' }),
  S3_ACCESS_KEY_ID: str({ default: 'rustfsadmin' }),
  S3_SECRET_ACCESS_KEY: str({ default: 'rustfsadmin' }),
  S3_BUCKET_IMAGES: str({ default: 'images' }),
  S3_BUCKET_AVATARS: str({ default: 'avatars' }),

  WORDLE_ANSWERS_SALT: str({ devDefault: 'wordle-dev-insecure-salt' }),
})

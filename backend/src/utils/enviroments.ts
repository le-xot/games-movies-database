import process from 'node:process'
import dotenv from 'dotenv'
import { cleanEnv, num, str } from 'envalid'

dotenv.config()

export const env = cleanEnv(process.env, {
  DATASOURCE_URL: str({}),
  JWT_SECRET: str({}),
  APP_PORT: num({ default: 3000 }),
  NODE_ENV: str({ choices: ['development', 'production'], default: 'development' }),
  DEFAULT_ADMIN_PASSWORD: str({}),
  TWITCH_CLIENT_ID: str({}),
  TWITCH_CLIENT_SECRET: str({}),
  TWITCH_CALLBACK_URL: str({}),
})

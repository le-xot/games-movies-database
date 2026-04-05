import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'

export default defineConfig({
  earlyAccess: true,
  adapter: () => new PrismaPg({ connectionString: process.env.DATASOURCE_URL ?? '' }),
})

import { PrismaPg } from '@prisma/adapter-pg'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATASOURCE_URL ?? '',
  },
  adapter: () => new PrismaPg({ connectionString: process.env.DATASOURCE_URL ?? '' }),
})

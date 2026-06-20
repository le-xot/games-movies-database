import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATASOURCE_URL ?? '',
  },
})

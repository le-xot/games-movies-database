import { defineConfig } from 'prisma/config'

// eslint-disable-next-line import/no-unassigned-import
import 'dotenv/config'

export default defineConfig({
  datasource: {
    url: process.env.DATASOURCE_URL!,
  },
})

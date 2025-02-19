const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const process = require('node:process')
const {env} = require("../src/utils/enviroments");

const prisma = new PrismaClient()

async function seed() {
  await prisma.user.upsert(
    {
      where: { id: env.TWITCH_ADMIN_ID },
      update: {
        role: 'ADMIN',
      },
      create: {
        id: env.TWITCH_ADMIN_ID,
        login: env.TWITCH_ADMIN_LOGIN,
        role: 'ADMIN',
      },
    },
  )
}

seed()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

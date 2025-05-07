const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const process = require('node:process')

const prisma = new PrismaClient()

async function seed() {
  await prisma.user.upsert(
    {
      where: { id: process.env.TWITCH_ADMIN_ID },
      update: {
        role: 'ADMIN',
      },
      create: {
        id: process.env.TWITCH_ADMIN_ID,
        login: process.env.TWITCH_ADMIN_LOGIN,
        role: 'ADMIN',
      },
    },
  )
  await prisma.limit.upsert(
    {
      where: { name: 'SUGGESTION' },
      update: {},
      create: {
        name: 'SUGGESTION',
        quantity: 3,
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

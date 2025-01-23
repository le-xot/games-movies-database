const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const process = require('node:process')

const prisma = new PrismaClient()

async function seed() {
  await prisma.user.upsert(
    {
      where: { login: 'le_xot' },
      update: { },
      create: {
        login: 'le_xot',
        twitchId: '155644238',
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

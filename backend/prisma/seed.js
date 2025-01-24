const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const process = require('node:process')

const prisma = new PrismaClient()

async function seed() {
  await prisma.user.upsert(
    {
      where: { id: '155644238' },
      update: {
        role: 'ADMIN',
      },
      create: {
        id: '155644238',
        login: 'le_xot',
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

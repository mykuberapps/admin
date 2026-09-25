const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Users:', await prisma.user.count());
  console.log('Media:', await prisma.media.count());
}

main().finally(() => prisma.$disconnect());

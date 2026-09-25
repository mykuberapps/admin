const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.watchSession.findMany();
  console.log(`Found ${sessions.length} sessions`);
  
  if (sessions.length > 0) {
    const geoData = [
      { country: 'IN', state: 'MH' },
      { country: 'IN', state: 'KA' },
      { country: 'IN', state: 'DL' },
      { country: 'US', state: 'NY' },
      { country: 'US', state: 'CA' },
      { country: 'GB', state: 'ENG' }
    ];

    for (let i = 0; i < sessions.length; i++) {
      const geo = geoData[i % geoData.length];
      await prisma.watchSession.update({
        where: { id: sessions[i].id },
        data: { country: geo.country, state: geo.state }
      });
    }
    console.log('Updated watch sessions with geo data!');
  } else {
    console.log('No watch sessions found to update.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

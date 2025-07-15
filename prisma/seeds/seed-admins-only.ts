import { PrismaClient } from '@prisma/client';
import { seedAdmins } from './01-admins';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin users only...\n');

  try {
    await seedAdmins(prisma);
    console.log('✅ Admin users seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding admins:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

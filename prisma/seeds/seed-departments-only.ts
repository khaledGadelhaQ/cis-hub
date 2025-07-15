import { PrismaClient } from '@prisma/client';
import { seedDepartments } from './02-departments';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding departments only...\n');

  try {
    const result = await seedDepartments(prisma);
    console.log('✅ Departments seeded successfully!');
    console.log('Departments created:', result);
  } catch (error) {
    console.error('❌ Error seeding departments:', error);
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

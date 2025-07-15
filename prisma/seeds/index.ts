import { PrismaClient } from '@prisma/client';
import { seedAdmins } from './01-admins';
import { seedDepartments } from './02-departments';
import { seedUsers } from './03-users';
import { seedCourses } from './04-courses';
import { seedClasses } from './05-classes';
import { seedSections } from './06-sections';
import { seedStudentEnrollments } from './07-student-enrollments';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  try {
    // 1. Seed Admins
    console.log('👑 Seeding admin users...');
    await seedAdmins(prisma);
    console.log('✅ Admin users seeded successfully\n');

    // 2. Seed Departments
    console.log('🏢 Seeding departments...');
    const departments = await seedDepartments(prisma);
    console.log('✅ Departments seeded successfully\n');

    // 3. Seed Users (Professors, TAs, Students)
    console.log('👥 Seeding users (professors, TAs, students)...');
    const users = await seedUsers(prisma, departments);
    console.log('✅ Users seeded successfully\n');

    // 4. Seed Courses
    console.log('📚 Seeding courses...');
    const courses = await seedCourses(prisma, departments);
    console.log('✅ Courses seeded successfully\n');

    // 5. Seed Classes and assign professors
    console.log('🏫 Seeding course classes...');
    const classes = await seedClasses(prisma, courses, users.professors);
    console.log('✅ Course classes seeded successfully\n');

    // 6. Seed Sections and assign TAs
    console.log('📖 Seeding course sections...');
    const sections = await seedSections(prisma, courses, users.tas);
    console.log('✅ Course sections seeded successfully\n');

    // 7. Seed Student Enrollments
    console.log('🎓 Seeding student enrollments...');
    await seedStudentEnrollments(prisma, courses, classes, sections, users);
    console.log('✅ Student enrollments seeded successfully\n');

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
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

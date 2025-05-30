import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create General Department (for 1st-2nd year students)
  const generalDept = await prisma.department.create({
    data: {
      name: 'General Department',
      code: 'GEN',
      description: 'General department for 1st and 2nd year students',
      isGeneral: true,
    },
  });

  // Create specific departments
  const csDept = await prisma.department.create({
    data: {
      name: 'Computer Science',
      code: 'CS',
      description: 'Computer Science Department',
      isGeneral: false,
    },
  });

  const itDept = await prisma.department.create({
    data: {
      name: 'Information Technology',
      code: 'IT',
      description: 'Information Technology Department',
      isGeneral: false,
    },
  });

  // Create a sample semester
  const semester = await prisma.semester.create({
    data: {
      name: 'Fall 2024',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-12-31'),
      isActive: true,
    },
  });

  // Create sample admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@university.edu',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      mustChangePassword: false,
      departmentId: generalDept.id,
    },
  });

  console.log('Seed data created successfully!');
  console.log({ generalDept, csDept, itDept, semester, adminUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

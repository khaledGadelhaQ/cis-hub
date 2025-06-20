import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create General Department (for 1st-2nd year students)
  // const generalDept = await prisma.department.create({
  //   data: {
  //     name: 'General Department',
  //     code: 'GEN',
  //     description: 'General department for 1st and 2nd year students',
  //     isGeneral: true,
  //   },
  // });

  // // Create specific departments
  // const csDept = await prisma.department.create({
  //   data: {
  //     name: 'Computer Science',
  //     code: 'CS',
  //     description: 'Computer Science Department',
  //     isGeneral: false,
  //   },
  // });

  // const itDept = await prisma.department.create({
  //   data: {
  //     name: 'Information Technology',
  //     code: 'IT',
  //     description: 'Information Technology Department',
  //     isGeneral: false,
  //   },
  // });

  // // Create a sample semester
  // const semester = await prisma.semester.create({
  //   data: {
  //     name: 'Fall 2024',
  //     startDate: new Date('2024-09-01'),
  //     endDate: new Date('2024-12-31'),
  //     isActive: true,
  //   },
  // });

  // // Create sample admin user
  // const hashedPassword = await bcrypt.hash('admin123', 10);

  // const adminUser = await prisma.user.create({
  //   data: {
  //     email: 'admin@university.edu',
  //     passwordHash: hashedPassword,
  //     firstName: 'System',
  //     lastName: 'Administrator',
  //     role: UserRole.ADMIN,
  //     isEmailVerified: true,
  //     mustChangePassword: false,
  //     departmentId: generalDept.id,
  //   },
  // });

  // Create 10 test users with different scenarios
  // const testUsers = [];
  // const departments = [generalDept, csDept, itDept];
  
  for (let i = 1; i <= 10; i++) {
    const collegeId = Math.floor(Math.random() * 900000) + 100000; // Random 6-digit number
    const hashedUserPassword = await bcrypt.hash(collegeId.toString(), 10);
    
    // Create different email scenarios
    let email: string;
    if (i === 3) {
      email = `user${i}@gmail.com`; // Invalid university email
    } else if (i === 7) {
      email = `user${i}@yahoo.com`; // Another invalid email
    } else {
      email = `user${i}@std.mans.edu.eg`;
    }

    const testUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedUserPassword,
        firstName: `Test`,
        lastName: `User${i}`,
        role: UserRole.STUDENT,
        isEmailVerified: i % 3 !== 0, // Every 3rd user has unverified email
        mustChangePassword: i % 2 === 0, // Every even user must change password
        departmentId: 'cmbb0582d0000il3wm5sgggsi', // Rotate between departments
        collegeId: collegeId.toString(),
      },
    });

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

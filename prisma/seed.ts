import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create departments
  const genDept = await prisma.department.create({
    data: {
      name: 'General Department',
      code: 'GEN',
      description: 'General department for 1st and 2nd year students',
      isGeneral: true,
    },
  });

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

  const isDept = await prisma.department.create({
    data: {
      name: 'Information Systems',
      code: 'IS',
      description: 'Information Systems Department',
      isGeneral: false,
    },
  });

  console.log('Created departments:', { genDept: genDept.name, csDept: csDept.name, itDept: itDept.name, isDept: isDept.name });

  // Create sample semester
  const semester = await prisma.semester.create({
    data: {
      name: 'Fall 2025',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
    },
  });

  console.log('Created semester:', semester.name);

  // Create admin users
  const hashedAdminPassword = await bcrypt.hash('admin', 10);

  const admin1 = await prisma.user.create({
    data: {
      email: 'admin1@std.mans.edu.eg',
      passwordHash: hashedAdminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      mustChangePassword: false,
      departmentId: genDept.id,
      collegeId: '00000001',
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      email: 'admin2@std.mans.edu.eg',
      passwordHash: hashedAdminPassword,
      firstName: 'Academic',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      mustChangePassword: false,
      departmentId: genDept.id,
      collegeId: '00000002',
    },
  });

  console.log('Created admin users:', { admin1: admin1.email, admin2: admin2.email });

  // Create 10 test users with different departments and years
  const departments = [genDept, csDept, itDept, isDept];
  const testUsers: Array<{
    email: string;
    collegeId: string;
    department: string;
    year: number;
  }> = [];
  
  for (let i = 1; i <= 10; i++) {
    const collegeId = Math.floor(Math.random() * 90000000) + 10000000; // Random 8-digit number
    const hashedUserPassword = await bcrypt.hash(collegeId.toString(), 10);
    
    // Assign department based on year (1st-2nd year go to General, 3rd-4th to specific departments)
    const year = Math.floor(Math.random() * 4) + 1; // Random year 1-4
    let department;
    
    if (year <= 2) {
      department = genDept;
    } else {
      // For 3rd-4th year, randomly assign to CS, IT, or IS
      const specificDepts = [csDept, itDept, isDept];
      department = specificDepts[Math.floor(Math.random() * specificDepts.length)];
    }

    const email = `user${i}@std.mans.edu.eg`;

    const testUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedUserPassword,
        firstName: `Student`,
        lastName: `User${i}`,
        role: UserRole.STUDENT,
        isEmailVerified: Math.random() > 0.3, // 70% chance of verified email
        mustChangePassword: Math.random() > 0.5, // 50% chance must change password
        departmentId: department.id,
        collegeId: collegeId.toString(),
        currentYear: year,
      },
    });

    testUsers.push({
      email: testUser.email,
      collegeId: testUser.collegeId!,
      department: department.name,
      year: testUser.currentYear!,
    });
  }

  console.log('Created test users:');
  testUsers.forEach(user => {
    console.log(`- ${user.email} (ID: ${user.collegeId}, Dept: ${user.department}, Year: ${user.year})`);
  });

  console.log('\nDatabase seeding completed successfully!');

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

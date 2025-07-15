import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

interface Departments {
  cs: any;
  it: any;
  is: any;
  ge: any;
}

export async function seedUsers(prisma: PrismaClient, departments: Departments) {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Professors for each department
  const professors: any[] = [];
  
  // CS Professors
  const csProfessors = await Promise.all([
    prisma.user.upsert({
      where: { email: 'prof.ahmed.cs@mans.edu.eg' },
      update: {},
      create: {
        email: 'prof.ahmed.cs@mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Ahmed',
        lastName: 'Hassan',
        role: UserRole.PROFESSOR,
        departmentId: departments.cs.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'PROF001',
      },
    }),
    prisma.user.upsert({
      where: { email: 'prof.sara.cs@mans.edu.eg' },
      update: {},
      create: {
        email: 'prof.sara.cs@mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Sara',
        lastName: 'Mohamed',
        role: UserRole.PROFESSOR,
        departmentId: departments.cs.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'PROF002',
      },
    }),
  ]);

  // IT Professors
  const itProfessors = await Promise.all([
    prisma.user.upsert({
      where: { email: 'prof.mahmoud.it@mans.edu.eg' },
      update: {},
      create: {
        email: 'prof.mahmoud.it@mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Mahmoud',
        lastName: 'Ali',
        role: UserRole.PROFESSOR,
        departmentId: departments.it.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'PROF003',
      },
    }),
    prisma.user.upsert({
      where: { email: 'prof.nour.it@mans.edu.eg' },
      update: {},
      create: {
        email: 'prof.nour.it@mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Nour',
        lastName: 'Elsayed',
        role: UserRole.PROFESSOR,
        departmentId: departments.it.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'PROF004',
      },
    }),
  ]);

  // IS Professors
  const isProfessors = await Promise.all([
    prisma.user.upsert({
      where: { email: 'prof.omar.is@mans.edu.eg' },
      update: {},
      create: {
        email: 'prof.omar.is@mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Omar',
        lastName: 'Farouk',
        role: UserRole.PROFESSOR,
        departmentId: departments.is.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'PROF005',
      },
    }),
    prisma.user.upsert({
      where: { email: 'prof.mona.is@mans.edu.eg' },
      update: {},
      create: {
        email: 'prof.mona.is@mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Mona',
        lastName: 'Abdel',
        role: UserRole.PROFESSOR,
        departmentId: departments.is.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'PROF006',
      },
    }),
  ]);

  // GE Professors (for foundational courses)
  const geProfessors = await Promise.all([
    prisma.user.upsert({
      where: { email: 'prof.ahmed.ge@mans.edu.eg' },
      update: {},
      create: {
        email: 'prof.ahmed.ge@mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Ahmed',
        lastName: 'Mostafa',
        role: UserRole.PROFESSOR,
        departmentId: departments.ge.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'PROF007',
      },
    }),
    prisma.user.upsert({
      where: { email: 'prof.fatma.ge@mans.edu.eg' },
      update: {},
      create: {
        email: 'prof.fatma.ge@mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Fatma',
        lastName: 'Hassan',
        role: UserRole.PROFESSOR,
        departmentId: departments.ge.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'PROF008',
      },
    }),
  ]);

  professors.push(...csProfessors, ...itProfessors, ...isProfessors, ...geProfessors);

  // Create TAs for each department
  const tas: any[] = [];

  // CS TAs
  const csTAs = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ta.youssef.cs@std.mans.edu.eg' },
      update: {},
      create: {
        email: 'ta.youssef.cs@std.mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Youssef',
        lastName: 'Ahmed',
        role: UserRole.TA,
        departmentId: departments.cs.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'TA001',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ta.aya.cs@std.mans.edu.eg' },
      update: {},
      create: {
        email: 'ta.aya.cs@std.mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Aya',
        lastName: 'Mostafa',
        role: UserRole.TA,
        departmentId: departments.cs.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'TA002',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ta.karim.cs@std.mans.edu.eg' },
      update: {},
      create: {
        email: 'ta.karim.cs@std.mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Karim',
        lastName: 'Hassan',
        role: UserRole.TA,
        departmentId: departments.cs.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'TA003',
      },
    }),
  ]);

  // IT TAs
  const itTAs = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ta.mai.it@std.mans.edu.eg' },
      update: {},
      create: {
        email: 'ta.mai.it@std.mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Mai',
        lastName: 'Ibrahim',
        role: UserRole.TA,
        departmentId: departments.it.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'TA004',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ta.hassan.it@std.mans.edu.eg' },
      update: {},
      create: {
        email: 'ta.hassan.it@std.mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Hassan',
        lastName: 'Omar',
        role: UserRole.TA,
        departmentId: departments.it.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'TA005',
      },
    }),
  ]);

  // IS TAs
  const isTAs = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ta.salma.is@std.mans.edu.eg' },
      update: {},
      create: {
        email: 'ta.salma.is@std.mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Salma',
        lastName: 'Khaled',
        role: UserRole.TA,
        departmentId: departments.is.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'TA006',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ta.mohamed.is@std.mans.edu.eg' },
      update: {},
      create: {
        email: 'ta.mohamed.is@std.mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Mohamed',
        lastName: 'Tarek',
        role: UserRole.TA,
        departmentId: departments.is.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'TA007',
      },
    }),
  ]);

  // GE TAs (for foundational courses)
  const geTAs = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ta.ali.ge@std.mans.edu.eg' },
      update: {},
      create: {
        email: 'ta.ali.ge@std.mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Ali',
        lastName: 'Ahmed',
        role: UserRole.TA,
        departmentId: departments.ge.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'TA008',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ta.nada.ge@std.mans.edu.eg' },
      update: {},
      create: {
        email: 'ta.nada.ge@std.mans.edu.eg',
        passwordHash: hashedPassword,
        firstName: 'Nada',
        lastName: 'Mahmoud',
        role: UserRole.TA,
        departmentId: departments.ge.id,
        isEmailVerified: true,
        mustChangePassword: false,
        collegeId: 'TA009',
      },
    }),
  ]);

  tas.push(...csTAs, ...itTAs, ...isTAs, ...geTAs);

  // Create sample students following college system:
  // Years 1-2: All students in General (GE) department
  // Years 3-4: Students in specialized departments (CS, IT, IS)
  const students: any[] = [];
  
  // Create Year 1 and Year 2 students (all in General department)
  for (let year = 1; year <= 2; year++) {
    for (let i = 1; i <= 15; i++) { // More students in general years
      const studentId = `GE${year}${i.toString().padStart(3, '0')}`;
      const student = await prisma.user.upsert({
        where: { email: `${studentId.toLowerCase()}@std.mans.edu.eg` },
        update: {},
        create: {
          email: `${studentId.toLowerCase()}@std.mans.edu.eg`,
          passwordHash: hashedPassword,
          firstName: `Student${i}`,
          lastName: `Year${year}`,
          role: UserRole.STUDENT,
          departmentId: departments.ge.id,
          currentYear: year,
          isEmailVerified: true,
          mustChangePassword: false,
          collegeId: studentId,
        },
      });
      students.push(student);
    }
  }

  // Create Year 3 and Year 4 students (in specialized departments)
  for (const dept of [departments.cs, departments.it, departments.is]) {
    for (let year = 3; year <= 4; year++) {
      for (let i = 1; i <= 5; i++) {
        const studentId = `${dept.code}${year}${i.toString().padStart(3, '0')}`;
        const student = await prisma.user.upsert({
          where: { email: `${studentId.toLowerCase()}@std.mans.edu.eg` },
          update: {},
          create: {
            email: `${studentId.toLowerCase()}@std.mans.edu.eg`,
            passwordHash: hashedPassword,
            firstName: `Student${i}`,
            lastName: `Year${year}`,
            role: UserRole.STUDENT,
            departmentId: dept.id,
            currentYear: year,
            isEmailVerified: true,
            mustChangePassword: false,
            collegeId: studentId,
          },
        });
        students.push(student);
      }
    }
  }

  console.log(`  ✅ Created ${professors.length} professors`);
  console.log(`  ✅ Created ${tas.length} TAs`);
  console.log(`  ✅ Created ${students.length} students`);

  return {
    professors,
    tas,
    students,
  };
}

import { PrismaClient } from '@prisma/client';

interface Departments {
  cs: any;
  it: any;
  is: any;
  ge: any;
}

export async function seedCourses(prisma: PrismaClient, departments: Departments) {
  const courses: any[] = [];

  // Computer Science Courses (Years 3-4 only)
  const csCourses = await Promise.all([
    // Year 3 CS Courses
    prisma.course.upsert({
      where: { code: 'CS301' },
      update: {},
      create: {
        name: 'Operating Systems',
        code: 'CS301',
        description: 'Operating system concepts and implementation',
        creditHours: 3,
        departmentId: departments.cs.id,
        targetYear: 3,
      },
    }),
    prisma.course.upsert({
      where: { code: 'CS302' },
      update: {},
      create: {
        name: 'Database Systems',
        code: 'CS302',
        description: 'Database design and management systems',
        creditHours: 3,
        departmentId: departments.cs.id,
        targetYear: 3,
      },
    }),
    // Year 4 CS Courses
    prisma.course.upsert({
      where: { code: 'CS401' },
      update: {},
      create: {
        name: 'Software Engineering',
        code: 'CS401',
        description: 'Software development methodologies and project management',
        creditHours: 3,
        departmentId: departments.cs.id,
        targetYear: 4,
      },
    }),
    prisma.course.upsert({
      where: { code: 'CS402' },
      update: {},
      create: {
        name: 'Artificial Intelligence',
        code: 'CS402',
        description: 'Introduction to AI concepts and algorithms',
        creditHours: 3,
        departmentId: departments.cs.id,
        targetYear: 4,
      },
    }),
  ]);

  // Information Technology Courses (Years 3-4 only)
  const itCourses = await Promise.all([
    // Year 3 IT Courses
    prisma.course.upsert({
      where: { code: 'IT301' },
      update: {},
      create: {
        name: 'Network Security',
        code: 'IT301',
        description: 'Network security protocols and implementation',
        creditHours: 3,
        departmentId: departments.it.id,
        targetYear: 3,
      },
    }),
    prisma.course.upsert({
      where: { code: 'IT302' },
      update: {},
      create: {
        name: 'Cloud Computing',
        code: 'IT302',
        description: 'Cloud platforms and services',
        creditHours: 3,
        departmentId: departments.it.id,
        targetYear: 3,
      },
    }),
    // Year 4 IT Courses
    prisma.course.upsert({
      where: { code: 'IT401' },
      update: {},
      create: {
        name: 'IT Project Management',
        code: 'IT401',
        description: 'Managing IT projects and infrastructure',
        creditHours: 3,
        departmentId: departments.it.id,
        targetYear: 4,
      },
    }),
    prisma.course.upsert({
      where: { code: 'IT402' },
      update: {},
      create: {
        name: 'System Administration',
        code: 'IT402',
        description: 'Advanced Linux and Windows system administration',
        creditHours: 3,
        departmentId: departments.it.id,
        targetYear: 4,
      },
    }),
  ]);

  // Information Systems Courses (Years 3-4 only)
  const isCourses = await Promise.all([
    // Year 3 IS Courses
    prisma.course.upsert({
      where: { code: 'IS301' },
      update: {},
      create: {
        name: 'Enterprise Resource Planning',
        code: 'IS301',
        description: 'ERP systems and business processes',
        creditHours: 3,
        departmentId: departments.is.id,
        targetYear: 3,
      },
    }),
    prisma.course.upsert({
      where: { code: 'IS302' },
      update: {},
      create: {
        name: 'Data Analytics',
        code: 'IS302',
        description: 'Business intelligence and data analytics',
        creditHours: 3,
        departmentId: departments.is.id,
        targetYear: 3,
      },
    }),
    // Year 4 IS Courses
    prisma.course.upsert({
      where: { code: 'IS401' },
      update: {},
      create: {
        name: 'Information Systems Strategy',
        code: 'IS401',
        description: 'Strategic planning for information systems',
        creditHours: 3,
        departmentId: departments.is.id,
        targetYear: 4,
      },
    }),
    prisma.course.upsert({
      where: { code: 'IS402' },
      update: {},
      create: {
        name: 'Business Process Management',
        code: 'IS402',
        description: 'Analyzing and optimizing business processes',
        creditHours: 3,
        departmentId: departments.is.id,
        targetYear: 4,
      },
    }),
  ]);

  // General Education Courses (Years 1-2 only - foundational courses for all students)
  const geCourses = await Promise.all([
    // Year 1 General Courses
    prisma.course.upsert({
      where: { code: 'GE101' },
      update: {},
      create: {
        name: 'Mathematics I',
        code: 'GE101',
        description: 'Calculus and linear algebra fundamentals',
        creditHours: 3,
        departmentId: departments.ge.id,
        targetYear: 1,
      },
    }),
    prisma.course.upsert({
      where: { code: 'GE102' },
      update: {},
      create: {
        name: 'Introduction to Programming',
        code: 'GE102',
        description: 'Basic programming concepts for all computing students',
        creditHours: 3,
        departmentId: departments.ge.id,
        targetYear: 1,
      },
    }),
    prisma.course.upsert({
      where: { code: 'GE103' },
      update: {},
      create: {
        name: 'English Communication',
        code: 'GE103',
        description: 'Academic and technical English communication',
        creditHours: 2,
        departmentId: departments.ge.id,
        targetYear: 1,
      },
    }),
    prisma.course.upsert({
      where: { code: 'GE104' },
      update: {},
      create: {
        name: 'Computer Fundamentals',
        code: 'GE104',
        description: 'Basic computer concepts and digital literacy',
        creditHours: 2,
        departmentId: departments.ge.id,
        targetYear: 1,
      },
    }),
    // Year 2 General Courses
    prisma.course.upsert({
      where: { code: 'GE201' },
      update: {},
      create: {
        name: 'Mathematics II',
        code: 'GE201',
        description: 'Advanced mathematics for computer science',
        creditHours: 3,
        departmentId: departments.ge.id,
        targetYear: 2,
      },
    }),
    prisma.course.upsert({
      where: { code: 'GE202' },
      update: {},
      create: {
        name: 'Data Structures and Algorithms',
        code: 'GE202',
        description: 'Fundamental data structures and algorithms',
        creditHours: 3,
        departmentId: departments.ge.id,
        targetYear: 2,
      },
    }),
    prisma.course.upsert({
      where: { code: 'GE203' },
      update: {},
      create: {
        name: 'Statistics and Probability',
        code: 'GE203',
        description: 'Statistical analysis and probability theory',
        creditHours: 3,
        departmentId: departments.ge.id,
        targetYear: 2,
      },
    }),
    prisma.course.upsert({
      where: { code: 'GE204' },
      update: {},
      create: {
        name: 'Database Fundamentals',
        code: 'GE204',
        description: 'Introduction to database concepts and SQL',
        creditHours: 3,
        departmentId: departments.ge.id,
        targetYear: 2,
      },
    }),
  ]);

  courses.push(...csCourses, ...itCourses, ...isCourses, ...geCourses);

  // Add department information to courses for easier filtering in enrollments
  const coursesWithDepartments = courses.map(course => {
    let department;
    if (course.departmentId === departments.cs.id) department = departments.cs;
    else if (course.departmentId === departments.it.id) department = departments.it;
    else if (course.departmentId === departments.is.id) department = departments.is;
    else if (course.departmentId === departments.ge.id) department = departments.ge;
    
    return { ...course, department };
  });

  console.log(`  ✅ Created ${csCourses.length} CS courses`);
  console.log(`  ✅ Created ${itCourses.length} IT courses`);
  console.log(`  ✅ Created ${isCourses.length} IS courses`);
  console.log(`  ✅ Created ${geCourses.length} GE courses`);

  return coursesWithDepartments;
}

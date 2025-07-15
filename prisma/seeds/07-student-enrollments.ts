import { PrismaClient, EnrollmentRole } from '@prisma/client';

interface Users {
  professors: any[];
  tas: any[];
  students: any[];
}

export async function seedStudentEnrollments(
  prisma: PrismaClient, 
  courses: any[], 
  classes: any[], 
  sections: any[], 
  users: Users
) {
  const enrollments: any[] = [];
  
  console.log('  📚 Starting student enrollments...');

  for (const student of users.students) {
    console.log(`  👤 Enrolling student ${student.email} (Year ${student.currentYear})`);
    
    // Find courses that match the student's year and department
    let eligibleCourses: any[] = [];
    
    // For GE students (years 1-2): only GE courses for their year
    if (student.currentYear <= 2) {
      eligibleCourses = courses.filter(course => 
        course.targetYear === student.currentYear && 
        course.department?.code === 'GE'
      );
    }
    
    // For specialized students (years 3-4): only their department courses for their year
    if (student.currentYear >= 3) {
      eligibleCourses = courses.filter(course => 
        course.targetYear === student.currentYear && 
        course.departmentId === student.departmentId
      );
    }

    console.log(`    📖 Found ${eligibleCourses.length} eligible courses`);

    // Enroll student in each eligible course
    for (const course of eligibleCourses) {
      try {
        // Find available classes for this course
        const courseClasses = classes.filter(cls => cls.courseId === course.id);
        
        // Find available sections for this course
        const courseSections = sections.filter(sec => sec.courseId === course.id);

        if (courseClasses.length === 0 || courseSections.length === 0) {
          console.log(`    ⚠️  No classes or sections available for course ${course.code}`);
          continue;
        }

        // Randomly assign student to one class and one section
        const randomClass = courseClasses[Math.floor(Math.random() * courseClasses.length)];
        const randomSection = courseSections[Math.floor(Math.random() * courseSections.length)];

        // Check if student is already enrolled in this course
        const existingEnrollment = await prisma.courseEnrollment.findUnique({
          where: {
            courseId_userId: {
              courseId: course.id,
              userId: student.id,
            },
          },
        });

        if (existingEnrollment) {
          console.log(`    ℹ️  Student already enrolled in ${course.code}`);
          continue;
        }

        // Create enrollment
        const enrollment = await prisma.courseEnrollment.create({
          data: {
            courseId: course.id,
            userId: student.id,
            classId: randomClass.id,
            sectionId: randomSection.id,
            role: EnrollmentRole.STUDENT,
            status: 'ACTIVE',
          },
          include: {
            course: {
              select: {
                code: true,
                name: true,
              },
            },
            class: {
              select: {
                classNumber: true,
              },
            },
            section: {
              select: {
                sectionNumber: true,
              },
            },
          },
        });

        enrollments.push(enrollment);
        console.log(`    ✅ Enrolled in ${enrollment.course.code} - Class ${enrollment.class?.classNumber}, Section ${enrollment.section?.sectionNumber}`);

      } catch (error) {
        console.error(`    ❌ Error enrolling student in course ${course.code}:`, error.message);
      }
    }
  }

  // Also enroll some TAs in courses they can assist with
  console.log('\n  🎓 Enrolling TAs in courses...');
  
  for (const ta of users.tas) {
    // Find courses in the TA's department for years 3-4 (TAs typically assist with advanced courses)
    const taCourses = courses.filter(course => 
      course.departmentId === ta.departmentId && 
      course.targetYear >= 3
    );

    // Enroll TA in 1-2 courses they can assist with
    const coursesToAssist = taCourses.slice(0, Math.floor(Math.random() * 2) + 1);
    
    for (const course of coursesToAssist) {
      try {
        // Check if TA is already enrolled
        const existingEnrollment = await prisma.courseEnrollment.findUnique({
          where: {
            courseId_userId: {
              courseId: course.id,
              userId: ta.id,
            },
          },
        });

        if (existingEnrollment) {
          continue;
        }

        // TAs don't need specific class/section assignments for their enrollment
        const enrollment = await prisma.courseEnrollment.create({
          data: {
            courseId: course.id,
            userId: ta.id,
            role: EnrollmentRole.TA,
            status: 'ACTIVE',
          },
          include: {
            course: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        });

        enrollments.push(enrollment);
        console.log(`    ✅ TA ${ta.email} enrolled in ${enrollment.course.code}`);

      } catch (error) {
        console.error(`    ❌ Error enrolling TA in course ${course.code}:`, error.message);
      }
    }
  }

  // Enroll professors in their assigned courses
  console.log('\n  👨‍🏫 Enrolling professors in courses...');
  
  for (const professor of users.professors) {
    // Find courses in the professor's department
    const profCourses = courses.filter(course => 
      course.departmentId === professor.departmentId
    );

    for (const course of profCourses) {
      try {
        // Check if professor is already enrolled
        const existingEnrollment = await prisma.courseEnrollment.findUnique({
          where: {
            courseId_userId: {
              courseId: course.id,
              userId: professor.id,
            },
          },
        });

        if (existingEnrollment) {
          continue;
        }

        const enrollment = await prisma.courseEnrollment.create({
          data: {
            courseId: course.id,
            userId: professor.id,
            role: EnrollmentRole.PROFESSOR,
            status: 'ACTIVE',
          },
          include: {
            course: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        });

        enrollments.push(enrollment);
        console.log(`    ✅ Professor ${professor.email} enrolled in ${enrollment.course.code}`);

      } catch (error) {
        console.error(`    ❌ Error enrolling professor in course ${course.code}:`, error.message);
      }
    }
  }

  console.log(`\n  📊 Enrollment Summary:`);
  console.log(`    • Total enrollments created: ${enrollments.length}`);
  
  const studentEnrollments = enrollments.filter(e => e.role === 'STUDENT');
  const taEnrollments = enrollments.filter(e => e.role === 'TA');
  const professorEnrollments = enrollments.filter(e => e.role === 'PROFESSOR');
  
  console.log(`    • Student enrollments: ${studentEnrollments.length}`);
  console.log(`    • TA enrollments: ${taEnrollments.length}`);
  console.log(`    • Professor enrollments: ${professorEnrollments.length}`);

  return enrollments;
}

import { PrismaClient } from '@prisma/client';

export async function seedClasses(prisma: PrismaClient, courses: any[], professors: any[]) {
  const classes: any[] = [];

  // Create classes for each course
  for (const course of courses) {
    // Create 2 classes per course (different times/days)
    const class1 = await prisma.courseClass.create({
      data: {
        courseId: course.id,
        classNumber: 1,
        dayOfWeek: 1, // Monday
        startTime: '08:00',
        endTime: '09:30',
        duration: 90,
        location: `Hall A${Math.floor(Math.random() * 10) + 1}`,
        maxStudents: 40,
      },
    });

    const class2 = await prisma.courseClass.create({
      data: {
        courseId: course.id,
        classNumber: 2,
        dayOfWeek: 3, // Wednesday
        startTime: '10:00',
        endTime: '11:30',
        duration: 90,
        location: `Hall B${Math.floor(Math.random() * 10) + 1}`,
        maxStudents: 40,
      },
    });

    classes.push(class1, class2);

    // Assign professors to classes
    // Find professors from the same department as the course
    const availableProfessors = professors.filter(prof => prof.departmentId === course.departmentId);
    
    if (availableProfessors.length > 0) {
      // Assign first professor to class 1
      await prisma.classProfessor.create({
        data: {
          classId: class1.id,
          professorId: availableProfessors[0].id,
        },
      });

      // Assign second professor to class 2 if available, otherwise same professor
      const secondProf = availableProfessors.length > 1 ? availableProfessors[1] : availableProfessors[0];
      await prisma.classProfessor.create({
        data: {
          classId: class2.id,
          professorId: secondProf.id,
        },
      });
    }
  }

  console.log(`  ✅ Created ${classes.length} course classes`);
  console.log(`  ✅ Assigned professors to all classes`);

  return classes;
}

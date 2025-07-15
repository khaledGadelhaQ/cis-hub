import { PrismaClient } from '@prisma/client';

export async function seedSections(prisma: PrismaClient, courses: any[], tas: any[]) {
  const sections: any[] = [];

  // Create sections for each course
  for (const course of courses) {
    // Create 3 sections per course
    for (let sectionNum = 1; sectionNum <= 3; sectionNum++) {
      // Find TAs from the same department as the course
      const availableTAs = tas.filter(ta => ta.departmentId === course.departmentId);
      
      if (availableTAs.length > 0) {
        // Assign TA (can be the same TA for multiple sections)
        const assignedTA = availableTAs[sectionNum % availableTAs.length];

        const section = await prisma.courseSection.create({
          data: {
            courseId: course.id,
            taId: assignedTA.id,
            sectionNumber: sectionNum,
            dayOfWeek: 2 + sectionNum, // Tuesday, Wednesday, Thursday
            startTime: `${12 + sectionNum}:00`, // 13:00, 14:00, 15:00
            endTime: `${13 + sectionNum}:30`, // 14:30, 15:30, 16:30
            duration: 90,
            location: `Lab ${String.fromCharCode(64 + sectionNum)}${Math.floor(Math.random() * 5) + 1}`, // Lab A1, B2, C3, etc.
            maxStudents: 25,
          },
        });

        sections.push(section);
      }
    }
  }

  console.log(`  ✅ Created ${sections.length} course sections`);
  console.log(`  ✅ Assigned TAs to all sections`);

  return sections;
}

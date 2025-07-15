import { PrismaClient, DepartmentCode, DepartmentName } from '@prisma/client';

export async function seedDepartments(prisma: PrismaClient) {
  // Create Computer Science Department
  const csDept = await prisma.department.upsert({
    where: { code: DepartmentCode.CS },
    update: {},
    create: {
      name: DepartmentName.COMPUTER_SCIENCE,
      code: DepartmentCode.CS,
      description: 'Computer Science Department - Focused on programming, algorithms, and software development',
    },
  });

  // Create Information Technology Department
  const itDept = await prisma.department.upsert({
    where: { code: DepartmentCode.IT },
    update: {},
    create: {
      name: DepartmentName.INFORMATION_TECHNOLOGY,
      code: DepartmentCode.IT,
      description: 'Information Technology Department - Focused on networks, systems, and IT infrastructure',
    },
  });

  // Create Information Systems Department
  const isDept = await prisma.department.upsert({
    where: { code: DepartmentCode.IS },
    update: {},
    create: {
      name: DepartmentName.INFORMATION_SYSTEMS,
      code: DepartmentCode.IS,
      description: 'Information Systems Department - Focused on business systems and data management',
    },
  });

  // Create General Department
  const geDept = await prisma.department.upsert({
    where: { code: DepartmentCode.GE },
    update: {},
    create: {
      name: DepartmentName.GENERAL,
      code: DepartmentCode.GE,
      description: 'General Education Department - For foundational courses across all disciplines',
    },
  });

  console.log(`  ✅ Created department: ${csDept.code} - ${csDept.name}`);
  console.log(`  ✅ Created department: ${itDept.code} - ${itDept.name}`);
  console.log(`  ✅ Created department: ${isDept.code} - ${isDept.name}`);
  console.log(`  ✅ Created department: ${geDept.code} - ${geDept.name}`);

  return { cs: csDept, it: itDept, is: isDept, ge: geDept };
}

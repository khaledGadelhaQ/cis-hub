import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedAdmins(prisma: PrismaClient) {
  const hashedPassword = await bcrypt.hash('admin', 10);

  // Create first admin
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin1@std.mans.edu.eg' },
    update: {},
    create: {
      email: 'admin1@std.mans.edu.eg',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      isEmailVerified: true,
      mustChangePassword: false,
      collegeId: 'ADM001',
    },
  });

  // Create second admin
  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@std.mans.edu.eg' },
    update: {},
    create: {
      email: 'admin2@std.mans.edu.eg',
      passwordHash: hashedPassword,
      firstName: 'Academic',
      lastName: 'Administrator',
      role: 'ADMIN',
      isEmailVerified: true,
      mustChangePassword: false,
      collegeId: 'ADM002',
    },
  });

  console.log(`  ✅ Created admin: ${admin1.email}`);
  console.log(`  ✅ Created admin: ${admin2.email}`);

  return { admin1, admin2 };
}

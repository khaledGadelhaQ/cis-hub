# Database Seeding Scripts

This folder contains comprehensive database seeding scripts for the CIS-HUB API development environment.

## Overview

The seeding system is designed to populate your development database with realistic test data including:

- 🔐 **Admin Users**: 2 admin accounts
- 🏢 **Departments**: CS, IT, IS, GE departments
- 👥 **Users**: Professors, TAs, and Students
- 📚 **Courses**: Course offerings for each department
- 🏫 **Classes**: Course class schedules with professor assignments
- 📖 **Sections**: Course sections with TA assignments

## Seed Scripts Structure

```
prisma/seeds/
├── index.ts                    # Main comprehensive seeder
├── 01-admins.ts               # Admin users seeder
├── 02-departments.ts          # Departments seeder
├── 03-users.ts                # Users (professors, TAs, students) seeder
├── 04-courses.ts              # Courses seeder
├── 05-classes.ts              # Course classes seeder
├── 06-sections.ts             # Course sections seeder
├── seed-admins-only.ts        # Individual admin seeder
├── seed-departments-only.ts   # Individual departments seeder
└── README.md                  # This file
```

## Quick Start

### Run All Seeds (Comprehensive)
```bash
# Navigate to project root
cd /path/to/cis-hub-api

# Run the comprehensive seeder
npx tsx prisma/seeds/index.ts
```

### Run Individual Seeds

If you want to seed only specific data:

```bash
# Seed only admin users
npx tsx prisma/seeds/seed-admins-only.ts

# Seed only departments
npx tsx prisma/seeds/seed-departments-only.ts
```

## Seeded Data Details

### 🔐 Admin Users
- **admin1@std.mans.edu.eg** / password: `admin`
- **admin2@std.mans.edu.eg** / password: `admin`

### 🏢 Departments
- **CS** - Computer Science
- **IT** - Information Technology  
- **IS** - Information Systems
- **GE** - General Education

### 👥 Users Created

**Professors (2 per department):**
- CS: prof.ahmed.cs@mans.edu.eg, prof.sara.cs@mans.edu.eg
- IT: prof.mahmoud.it@mans.edu.eg, prof.nour.it@mans.edu.eg
- IS: prof.omar.is@mans.edu.eg, prof.mona.is@mans.edu.eg

**TAs (2-3 per department):**
- CS: ta.youssef.cs@std.mans.edu.eg, ta.aya.cs@std.mans.edu.eg, ta.karim.cs@std.mans.edu.eg
- IT: ta.mai.it@std.mans.edu.eg, ta.hassan.it@std.mans.edu.eg
- IS: ta.salma.is@std.mans.edu.eg, ta.mohamed.is@std.mans.edu.eg

**Students (Following FCIS System):**
- **Years 1-2**: All students in General (GE) department (15 students per year)
  - Pattern: `ge{year}{number}@std.mans.edu.eg`
  - Example: ge1001@std.mans.edu.eg (GE, Year 1, Student 1)
- **Years 3-4**: Students in specialized departments (5 students per year per department)
  - Pattern: `{department}{year}{number}@std.mans.edu.eg`
  - Example: cs3001@std.mans.edu.eg (CS, Year 3, Student 1)

**All users have:**
- Password: `password123`
- Email verified: `true`
- Must change password: `false`

### 📚 Courses Created

**Computer Science (Years 3-4):**
- CS301: Operating Systems (Year 3)
- CS302: Database Systems (Year 3)
- CS401: Software Engineering (Year 4)
- CS402: Artificial Intelligence (Year 4)

**Information Technology (Years 3-4):**
- IT301: Network Security (Year 3)
- IT302: Cloud Computing (Year 3)
- IT401: IT Project Management (Year 4)
- IT402: System Administration (Year 4)

**Information Systems (Years 3-4):**
- IS301: Enterprise Resource Planning (Year 3)
- IS302: Data Analytics (Year 3)
- IS401: Information Systems Strategy (Year 4)
- IS402: Business Process Management (Year 4)

**General Education (Years 1-2):**
- GE101: Mathematics I (Year 1)
- GE102: Introduction to Programming (Year 1)
- GE103: English Communication (Year 1)
- GE104: Computer Fundamentals (Year 1)
- GE201: Mathematics II (Year 2)
- GE202: Data Structures and Algorithms (Year 2)
- GE203: Statistics and Probability (Year 2)
- GE204: Database Fundamentals (Year 2)

### 🏫 Classes & Sections

**For each course:**
- **2 Classes** with different schedules and assigned professors
- **3 Sections** with different times and assigned TAs

## Prerequisites

Make sure you have:
1. Database connection configured in `.env`
2. Prisma client generated: `npx prisma generate`
3. Database migrated: `npx prisma migrate dev`

## Notes

- All seed scripts use `upsert` operations, so they're safe to run multiple times
- The scripts will not create duplicates if run again
- Users are created with realistic email patterns following your domain structure
- TAs can be assigned to multiple sections of the same course
- All generated data follows the schema constraints and relationships

## Troubleshooting

If you encounter issues:

1. **Database Connection**: Ensure your `DATABASE_URL` is correctly set in `.env`
2. **Schema Sync**: Run `npx prisma migrate dev` to ensure schema is up to date
3. **Dependencies**: Make sure bcrypt is installed: `npm install bcrypt @types/bcrypt`
4. **TypeScript**: Use `npx tsx` to run TypeScript files directly

## Customization

To modify the seeded data:
1. Edit the individual seed files (01-admins.ts, 02-departments.ts, etc.)
2. Adjust quantities, names, or other properties as needed
3. Re-run the appropriate seed script

Each seed file is modular and can be customized independently.

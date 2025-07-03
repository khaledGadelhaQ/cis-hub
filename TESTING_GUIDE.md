# Testing Guide - Academic Modules

## ✅ Changes Made

### 1. **Removed @UseGuards(RolesGuard) Decorators**
Since RolesGuard is now applied globally in the auth module, I've removed all individual `@UseGuards(RolesGuard)` decorators from:
- ✅ `DepartmentsController`
- ✅ `SemestersController` 
- ✅ `CoursesController`
- ✅ `EnrollmentsController`

**Important**: Only `@UseGuards(JwtAuthGuard)` and `@Roles()` decorators remain where needed. The global RolesGuard automatically handles role-based authorization for all endpoints with `@Roles()` decorators.

### 2. **Updated Postman Collection**
Updated and replaced the main Postman collection (`MU-Compass-API.postman_collection.json`) with comprehensive endpoints:

- **🔐 Authentication Section** - Login as Admin/Student
- **🏢 Academic - Departments** - All department CRUD operations
- **📅 Academic - Semesters** - All semester management operations
- **📚 Academic - Courses** - All course management and queries
- **📝 Academic - Enrollments** - Student enrollment and TA assignment

## 🧪 Quick Testing Steps

### Step 1: Start the Application
```bash
npm run start:dev
```

### Step 2: Import Postman Collection
Import the updated collection: `postman/collections/MU-Compass-API-Updated.postman_collection.json`

### Step 3: Test Sequence

1. **Login as Admin**
   - Use: `admin1@std.mans.edu.eg` / `admin`
   - This will auto-save the access token

2. **Get All Departments**
   - This will auto-save the first department ID

3. **Get All Semesters** 
   - This will auto-save the first semester ID

4. **Create a Course**
   - Uses the saved department and semester IDs
   - Will auto-save the new course ID

5. **Get My Courses** (Login as Student first)
   - Login as: `user1@std.mans.edu.eg` / `39042649`

6. **Enroll Student in Course** (Login as Admin again)
   - Uses saved course and user IDs

## 🎯 API Endpoints Available

### **Departments** (`/api/v1/academic/departments`)
- ✅ `GET /` - Get all departments
- ✅ `GET /:id` - Get department by ID  
- ✅ `POST /` - Create department (Admin only)
- ✅ `PATCH /:id` - Update department (Admin only)
- ✅ `DELETE /:id` - Delete department (Admin only)

### **Semesters** (`/api/v1/academic/semesters`)
- ✅ `GET /` - Get all semesters
- ✅ `GET /active` - Get active semester
- ✅ `GET /:id` - Get semester by ID
- ✅ `POST /` - Create semester (Admin only)
- ✅ `PATCH /:id` - Update semester (Admin only)
- ✅ `PATCH /:id/activate` - Activate semester (Admin only)
- ✅ `DELETE /:id` - Delete semester (Admin only)

### **Courses** (`/api/v1/academic/courses`)
- ✅ `GET /` - Get all courses (with filters)
- ✅ `GET /:id` - Get course details
- ✅ `GET /:id/sections` - Get course sections
- ✅ `GET /:id/schedule` - Get course schedule
- ✅ `GET /:id/students` - Get enrolled students (Professor/TA/Admin)
- ✅ `POST /` - Create course (Admin only)
- ✅ `PATCH /:id` - Update course (Admin only)
- ✅ `DELETE /:id` - Delete course (Admin only)

### **Enrollments** (`/api/v1/academic/enrollments`)
- ✅ `GET /my-courses` - Get current user's courses
- ✅ `POST /` - Enroll student (Admin only)
- ✅ `POST /assign-ta` - Assign TA to sections (Admin only)
- ✅ `GET /:id` - Get enrollment details (Admin only)
- ✅ `PATCH /:id/assign-section` - Assign section (Admin only)
- ✅ `DELETE /:id` - Remove enrollment (Admin only)

## 📊 Test Data Available

**Departments:**
- General Department (GEN)
- Computer Science (CS)  
- Information Technology (IT)
- Information Systems (IS)

**Users:**
- **Admins:** `admin1@std.mans.edu.eg`, `admin2@std.mans.edu.eg` (password: `admin`)
- **Students:** `user1@std.mans.edu.eg` to `user10@std.mans.edu.eg` (password: their college ID)

**Semester:**
- Fall 2025 (Active)

## 🔧 Application Status
- ✅ **Build:** Successful
- ✅ **Runtime:** No errors
- ✅ **Routes:** All 32+ academic endpoints mapped
- ✅ **Authentication:** JWT + Role-based access working
- ✅ **Database:** Seeded with test data

The academic modules are now complete and ready for testing! 🎉

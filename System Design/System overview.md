# MU Compass System Overview
## Student Communication Platform Database Design & User Experience

---

## 🎓 Academic Structure Overview

### Student Journey Through Years
- **Years 1-2**: All students study together in **General Department**
- **Years 3-4**: Students choose specialized departments:
  - **CS** (Computer Science)
  - **IT** (Information Technology) 
  - **IS** (Information Systems)

### Course Organization
Each course is specific to a **Year + Department** combination:
- Example: "Operating Systems" → 3rd Year CS students only
- Example: "Introduction to Programming" → 1st Year General students

### Class & Section Structure
**Large Groups → Smaller Groups**

1. **Course**: All students registered (e.g., 300 students)
2. **Classes**: Large lecture groups when needed (e.g., split 300 into Class 1 & Class 2)
3. **Sections**: Small practical groups (40 students each = 7-8 sections)

---

## 👥 User Roles & Responsibilities

### 🎓 Students
- Attend **class lectures** (large groups with professors)
- Attend **section practicals** (small groups with TAs)
- Participate in both course-wide and section-specific discussions

### 👨‍🏫 Professors
- Teach courses to specific year/department combinations
- Can teach multiple courses across different years
- Manage course-wide communications
- **Example**: Prof. Ahmed teaches:
  - Operating Systems → 3rd Year CS
  - Intro Programming → 1st Year General
  - AI & Machine Learning → 4th Year CS

### 👨‍🎓 Teaching Assistants (TAs)
- Handle practical sessions for multiple sections
- Can teach across different courses and years
- Manage section-specific communications
- **Example**: TA Mohamed teaches:
  - Operating Systems → 3 sections (3rd Year CS)
  - Data Structures → 2 sections (2nd Year General)

---

## 💬 Chat Group System

### Automatic Group Creation Rules

#### For Each Course → 2 Types of Groups Created:

### 1. 🎓 **Class Groups** (Course-Wide Discussion)
**Who's Included:**
- ALL students registered in the course
- ALL professors teaching the course

**Purpose:**
- Course announcements
- General Q&A
- Lecture materials sharing
- Course-wide discussions

**Admin:** Professors

---

### 2. 👨‍🎓 **Section Groups** (Practical Discussion)
**Who's Included:**
- Students from ALL sections taught by the same TA
- The TA teaching those sections

**Purpose:**
- Practical session materials
- Lab instructions
- Section-specific Q&A
- Assignment help

**Admin:** Teaching Assistant

---

## 📱 User Experience by Role

### 🎓 **Student View**
```
📚 My Courses (3rd Year - CS Department)

├── 💻 Operating Systems (CS301)
│   ├── 🎓 Class Discussion
│   │   └── Prof. Ahmed, Prof. Sara + 280 students
│   └── 👨‍🎓 My Section Group
│       └── TA Mohamed + 120 students (from 3 sections)
│
├── 🗄️ Database Systems (CS305)  
│   ├── 🎓 Class Discussion
│   │   └── Prof. Johnson + 250 students
│   └── 👨‍🎓 My Section Group
│       └── TA Ali + 80 students (from 2 sections)
│
└── 🤖 Artificial Intelligence (CS401)
    ├── 🎓 Class Discussion
    │   └── Prof. Smith + 180 students  
    └── 👨‍🎓 My Section Group
        └── TA Sarah + 90 students (from 2 sections)
```

**Student Experience:**
- Sees only courses they're enrolled in
- Gets course-wide updates from professors
- Gets practical help from their TA
- Can ask questions in appropriate groups

---

### 👨‍🏫 **Professor View**
```
👨‍🏫 My Teaching Groups

├── 💻 Operating Systems - 3rd Year CS [ADMIN]
│   └── 280 students + Prof. Sara (co-instructor)
│
├── 📖 Intro Programming - 1st Year General [ADMIN] 
│   └── 450 students + Prof. Omar (co-instructor)
│
└── 🤖 AI & Machine Learning - 4th Year CS [ADMIN]
    └── 180 students (sole instructor)
```

**Professor Experience:**
- Sees all courses they teach
- Full admin control over class discussions
- Can make announcements to entire course
- Collaborate with co-instructors
- Share lecture materials and resources

---

### 👨‍🎓 **TA View**
```
👨‍🎓 My Section Groups

├── 💻 Operating Systems Sections [ADMIN]
│   ├── 📍 Sections 1, 2, 3 (3rd Year CS)
│   └── 120 students under my supervision
│
├── 🏗️ Data Structures Sections [ADMIN]
│   ├── 📍 Sections 4, 5 (2nd Year General)  
│   └── 80 students under my supervision
│
└── 🗄️ Database Systems Sections [ADMIN]
    ├── 📍 Sections 2, 6 (3rd Year IT)
    └── 75 students under my supervision
```

**TA Experience:**
- Sees only section groups they manage
- Full admin control over their section discussions
- Can share practical materials
- Help students with assignments and lab work
- Manage multiple sections as one group

---

## 🔄 Automatic System Behavior

### When a Course is Created:
1. **System automatically creates** Class Group (for professors + all students)
2. **System calculates** how many sections needed (based on enrollment ÷ 40 students)
3. **When TAs are assigned** → System creates Section Groups

### When a Student Enrolls:
1. **Automatically added** to Class Group (as Member)
2. **Automatically assigned** to a section
3. **Automatically added** to Section Group (as Member)

### When a Professor is Assigned:
1. **Automatically added** to Class Group (as Admin)
2. **Can make announcements** to all course students

### When a TA is Assigned:
1. **Automatically becomes Admin** of their Section Group
2. **Only manages students** in their assigned sections

---

## 🗃️ Database Structure Summary

### Core Tables:
- **users** → Students, TAs, Professors, Admins
- **departments** → CS, IT, IS, General
- **courses** → Specific to Year + Department
- **course_classes** → Large lecture group splits
- **course_sections** → Small practical groups (40 students each)
- **course_enrollments** → Who's taking what course
- **chat_groups** → Automatic group creation
- **messages** → All communications

### Key Relationships:
- **Students** → Enroll in → **Courses** → Create → **Chat Groups**
- **Professors** → Teach → **Courses** → Admin of → **Class Groups**
- **TAs** → Manage → **Sections** → Admin of → **Section Groups**

---

## ✨ Benefits of This Design

### For Students:
- **Clear separation** between course-wide and practical discussions
- **No confusion** about where to ask questions
- **Automatic enrollment** in right groups

### For Professors:
- **Reach all students** in one place
- **Collaborate easily** with co-instructors
- **Manage course communications** efficiently

### For TAs:
- **One group per course** regardless of number of sections
- **Easy material sharing** to all their students
- **Efficient student support**

### For System:
- **Automatic group creation** - no manual setup
- **Scales easily** as courses and enrollment grow
- **Clear data structure** for future features

---

## 🚀 Technical Implementation Notes

### For Developers:
- Uses **PostgreSQL** with proper relationships
- **Automatic triggers** handle group creation
- **Role-based permissions** built into database
- **Optimized indexes** for performance
- **Clean separation** of concerns

### For Non-Technical Stakeholders:
- **Zero manual group management** required
- **Scales automatically** with university growth  
- **Intuitive user experience** for all roles
- **Flexible enough** to handle course changes
- **Maintains academic hierarchy** naturally
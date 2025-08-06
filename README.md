# 🎓 CIS-HUB

> **Modern University Communication Platform for FCIS @ Mansoura University**

[![NestJS](https://img.shields.io/badge/NestJS-10.0.0-red?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typ## 📋 **API Documentation**

**📖 Complete API Documentation**: [Postman Workspace](https://mu-compass-team.postman.co/workspace/MU-Compass-API~3c8f453b-6612-4a54-8bc8-047aa3a701c1/collection/37533401-25a5a4d8-0e9a-4f7c-afe7-abc2dcb81d85?action=share&creator=37533401&active-environment=37533401-ac36b80c-8e36-442e-8441-a9d5b61ec0a0)

- **127 Endpoints** fully documented with examples
- **Authentication flows** pre-configured  
- **File upload examples** included
- **WebSocket event documentation**
- **Environment configurations** for dev/staging/production

---

## 🗄️ **Database Design & ERD**

![CIS-HUB Database ERD](docs/cis-hub.png)

**📊 Interactive Database Diagram**: [View on DBDiagram](https://dbdiagram.io/d/CIS-Hub-687382eef413ba35089ae0b6)

The database follows a relational design with clear entity relationships:
- **Users** with role-based access and department associations
- **Academic structure** with departments, courses, and enrollments
- **Communication system** with posts, messages, and file attachments
- **Session management** for multi-device authentication(https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Caching-red?style=flat-square&logo=redis)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Background_Jobs-blue?style=flat-square&logo=bull)](https://bullmq.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Notifications-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-green?style=flat-square)](https://socket.io/)

**🌐 Live Application:** [https://cis-hub.netlify.app](https://cis-hub.netlify.app)

CIS-HUB is a comprehensive university communication platform providing real-time messaging, academic management, and content sharing for students and faculty.

---

## 🚀 **Core Features**

- **🔐 JWT Authentication** - Secure user authentication with refresh tokens
- **👥 Role-Based Access** - Student, TA, Professor, Admin roles
- **🏫 Academic Management** - Departments, courses, enrollments 
- **💬 Real-time Chat** - WebSocket-powered messaging with file sharing
- **📰 News & Announcements** - Targeted university-wide communication
- **📁 File Management** - Secure file uploads with validation
- **🔔 Background Jobs** - BullMQ for email notifications and processing
- **⚡ Caching Layer** - Redis for performance optimization

---

## 🛠️ **Technology Stack**

- **Backend**: NestJS, TypeScript, Node.js 20.x
- **Database**: PostgreSQL 16.x with Prisma ORM
- **Authentication**: JWT with secure session management
- **Real-time**: Socket.IO WebSockets
- **Caching**: Redis for session and data caching
- **Background Jobs**: BullMQ for async processing
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **File Storage**: Multer with cloud storage support
- **Validation**: class-validator for input validation

## 🏗️ **Technical Architecture**

### **Backend Framework**
- **NestJS 10.x** - Enterprise-grade Node.js framework
- **TypeScript** - Type-safe development with latest ES features
- **Modular Architecture** - Clean, maintainable, and scalable code structure
- **Dependency Injection** - Efficient service management and testing

### **Database & ORM**
- **PostgreSQL 16** - Robust relational database with advanced features
- **Prisma ORM** - Type-safe database access with auto-generated client
- **Database Migrations** - Version-controlled schema evolution
- **Connection Pooling** - Optimized database performance
- **Advanced Queries** - Complex filtering, sorting, and aggregations

### **Real-time Communication**
- **Socket.IO** - Reliable WebSocket implementation
- **Event-driven Architecture** - Scalable real-time messaging
- **Room-based Communication** - Efficient group messaging
- **Auto-reconnection** - Robust connection handling
- **Message Queue Integration** ready for scaling

### **Security & Validation**
- **JWT Authentication** with RS256 signing
- **bcrypt Password Hashing** with salt rounds
- **Input Validation** with class-validator
- **SQL Injection Protection** via Prisma ORM
- **CORS Configuration** for secure cross-origin requests
- **Rate Limiting** ready for production deployment

### **File Storage & Processing**
- **Multer Integration** for multipart file uploads
- **File Type Validation** with MIME type checking
- **Image Processing** capabilities with thumbnail generation
- **Flexible Storage Backend** (local filesystem, cloud-ready)
- **File Access Control** with permission validation

---

## 🛠️ **Technology Stack**

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Runtime** | Node.js | 20.x | JavaScript runtime environment |
| **Framework** | NestJS | 10.x | Backend application framework |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Database** | PostgreSQL | 16.x | Primary data store |
| **ORM** | Prisma | 5.x | Database access and migrations |
| **Authentication** | JWT | Latest | Stateless authentication |
| **Real-time** | Socket.IO | 4.x | WebSocket communication |
| **Validation** | class-validator | Latest | Input validation and sanitization |
| **File Upload** | Multer | Latest | Multipart file handling |
| **Password** | bcrypt | Latest | Secure password hashing |
| **Testing** | Jest | Latest | Unit and integration testing |
| **Documentation** | Postman | Latest | API documentation and testing |

---

## 📊 **API Endpoints Overview**

### **Authentication Routes** (`/auth`)
```
POST   /auth/login              # User authentication
POST   /auth/refresh            # Token refresh
GET    /auth/me                 # Current user info
POST   /auth/logout             # Single device logout
POST   /auth/logout-all         # All devices logout
POST   /auth/change-password    # Password update
```

### **User Management** (`/users`)
```
GET    /users                   # List users (admin)
GET    /users/:id               # Get user by ID
POST   /users                   # Create user (admin)
PUT    /users/:id               # Update user (admin)
DELETE /users/:id               # Delete user (admin)
PUT    /users/profile           # Update own profile
POST   /users/avatar            # Upload profile picture
```

### **Academic System** (`/academic`)
```
# Departments
GET    /academic/departments         # List departments
POST   /academic/departments         # Create department (admin)
GET    /academic/departments/:id     # Get department details

# Courses
GET    /academic/courses             # List courses with filters
POST   /academic/courses             # Create course
GET    /academic/courses/:id         # Course details
PUT    /academic/courses/:id         # Update course

# Enrollments
GET    /academic/courses/:id/enrollments    # Course enrollments
POST   /academic/courses/:id/enroll         # Enroll student
DELETE /academic/enrollments/:id            # Remove enrollment
```

### **Posts & News** (`/posts`)
```
GET    /posts                   # Main news feed
POST   /posts                   # Create post
GET    /posts/:id               # Get specific post
PUT    /posts/:id               # Update post (author/admin)
DELETE /posts/:id               # Delete post (author/admin)

# Specialized Feeds
GET    /posts/feeds/department  # Department-specific feed
GET    /posts/feeds/year        # Year-specific feed
GET    /posts/feeds/announcements # Announcements only
GET    /posts/feeds/assignments   # Events/assignments feed
GET    /posts/feeds/global         # University-wide feed
GET    /posts/feeds/urgent         # Urgent posts only
```

### **File Management** (`/files`)
```
POST   /files/upload            # Upload files
GET    /files                   # List files with filters
GET    /files/:id               # File metadata
GET    /files/:id/download      # Download file
PUT    /files/:id               # Update file metadata
DELETE /files/:id               # Delete file
```

### **Real-time Chat** (WebSocket Events)
```
# Connection Events
connect                    # User connects to chat
disconnect                 # User disconnects

# Messaging Events
join_room                  # Join chat room
leave_room                 # Leave chat room
send_message               # Send message to room
message_received           # Message broadcast to room
typing_start               # User started typing
typing_stop                # User stopped typing
```

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 20.x or higher
- PostgreSQL 16.x
- Redis (for caching)
- npm or yarn package manager

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/khaledGadelhaQ/mu-compass-api.git
cd mu-compass-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Database setup**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npm run seed
```

5. **Start the development server**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

### **Environment Variables**

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/cis_hub"

# JWT Configuration
JWT_ACCESS_SECRET="your-super-secret-access-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server Configuration
PORT=3000
NODE_ENV="development"

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_PATH="./uploads"

# Email Configuration (Optional - for email verification and password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@cis-hub.mans.edu.eg"

# CORS Configuration
CORS_ORIGIN="https://cis-hub.netlify.app"

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   # Max requests per window

# Cloud Storage (Optional - for production)
# AWS_ACCESS_KEY_ID="your-aws-access-key"
# AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
# AWS_REGION="us-east-1"
# AWS_S3_BUCKET="cis-hub-files"

# Redis Configuration (for caching and background jobs)
REDIS_URL="redis://localhost:6379"

# Firebase Configuration (for push notifications)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"

# BullMQ Configuration (for background job processing)
BULL_REDIS_HOST="localhost"
BULL_REDIS_PORT=6379
BULL_REDIS_PASSWORD=""

# Logging
LOG_LEVEL="debug"
```

---

## � **API Documentation**

**📖 Complete API Documentation**: [Postman Collection Link - Coming Soon]

- **127 Endpoints** fully documented with examples
- **Authentication flows** pre-configured  
- **File upload examples** included
- **WebSocket event documentation**
- **Environment configurations** for dev/staging/production

---

## 🏭 **Production Deployment**

### **Build for Production**
```bash
npm run build
npm run start:prod
```

### **Docker Support**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

---

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

##  **Support & Contact**

- **Developer**: Khaled Gadelhaq
- **Email**: khaledmogadelhaq@gmail.com
- **University**: Faculty of Computer and Information Sciences, Mansoura University
- **Live Application**: [https://cis-hub.netlify.app](https://cis-hub.netlify.app)

---

<p align="center">
  <strong>Built with ❤️ for the academic community</strong>
</p>

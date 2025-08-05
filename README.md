# 🎓 CIS-HUB API

> **Modern University Communication Platform for FCIS @ Mansoura University**

[![NestJS](https://img.shields.io/badge/NestJS-10.0.0-red?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-green?style=flat-square)](https://socket.io/)

**🌐 Live Application:** [https://cis-hub.netlify.app](https://cis-hub.netlify.app)

CIS-HUB is a comprehensive, scalable backend API built for modern university communication and academic management. It provides a robust foundation for student-faculty interaction, academic content management, real-time messaging, and university-wide announcements.

---

## 🚀 **Core Features**

### 🔐 **Authentication & Authorization**
- **JWT-based Authentication** with refresh token support
- **Role-based Access Control** (Student, TA, Professor, Admin)
- **Multi-device Session Management** with selective logout
- **Email Verification** and **Password Reset** workflows
- **Secure Session Handling** with automatic token refresh

### 👥 **User Management**
- **Comprehensive User Profiles** with avatar upload
- **Administrative User Control** with role management
- **Department-based Organization** and permissions
- **Account Activation/Deactivation** workflows
- **Bulk User Operations** for administrative efficiency

### 🏫 **Academic System**
- **Department Management** with hierarchical structure
- **Course Management** with enrollment tracking
- **Class Scheduling** and section management
- **Student-Course Enrollment** with role assignments
- **Academic Year Management** and course filtering

### 💬 **Real-time Communication**
- **WebSocket-powered Chat System** with Socket.IO
- **Private and Group Messaging** capabilities
- **File Attachments** with automatic thumbnail generation
- **Message Status Tracking** (sent, delivered, read)
- **Typing Indicators** and presence detection
- **Chat Room Management** with member roles

### 📰 **News & Announcements**
- **University-wide News Feed** with targeted distribution
- **Department-specific Announcements** and filtering
- **Year-based Content Targeting** for relevant information
- **Priority Levels** (normal, urgent) for critical updates
- **Rich Content Support** with file attachments
- **Advanced Feed Filtering** (department, year, assignments, global)

### 📁 **File Management**
- **Multi-context File Upload** (profiles, posts, chat messages)
- **Automatic Thumbnail Generation** for images
- **File Validation** and security checks
- **Cloud Storage Integration** ready
- **File Statistics** and usage tracking
- **Optimized File Serving** with proper MIME types

---

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
# Edit .env with your database credentials and JWT secret
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
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cis_hub"

# Authentication
JWT_ACCESS_SECRET="your-jwt-access-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3000
NODE_ENV="development"

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH="./uploads"

# Email (optional)
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-email"
SMTP_PASS="your-password"
```

---

## 📝 **API Documentation**

### **Postman Collection**
Import the comprehensive Postman collection for complete API testing:
- **File**: `postman/collections/CIS-HUB-API.postman_collection.json`
- **Environments**: Development, Staging, Production
- **127 Endpoints** fully documented with examples
- **Authentication flows** pre-configured
- **File upload examples** included

### **Key Endpoints Usage**

#### **Authentication Flow**
```javascript
// 1. Login
POST /auth/login
{
  "email": "student@mans.edu.eg",
  "password": "securePassword"
}

// 2. Use returned tokens for authenticated requests
Authorization: Bearer <access_token>

// 3. Refresh when needed
POST /auth/refresh
{
  "refreshToken": "<refresh_token>"
}
```

#### **Creating a Post**
```javascript
POST /posts
{
  "title": "Important Announcement",
  "content": "This is an important announcement for all students.",
  "type": "ANNOUNCEMENT",
  "scope": "DEPARTMENT",
  "priority": "HIGH"
}
```

#### **WebSocket Connection**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.emit('join_room', { roomId: 'room-id' });
socket.emit('send_message', { 
  roomId: 'room-id', 
  content: 'Hello everyone!' 
});
```

---

## 🗄️ **Database Schema**

### **Core Tables**
- **Users** - User accounts with roles and department assignments
- **Departments** - University departments with hierarchical structure
- **Courses** - Academic courses with department relationships
- **Enrollments** - Student-course relationships with roles
- **Posts** - News, announcements, and academic content
- **Files** - File storage with context associations
- **ChatRooms** - Chat room management
- **Messages** - Chat messages with file attachments
- **UserSessions** - Active session tracking

### **Key Relationships**
- Users belong to Departments
- Courses are associated with Departments
- Enrollments link Users to Courses
- Posts are scoped by Department/Year
- Files are contextualized (POST, CHAT_MESSAGE, PROFILE)
- Messages belong to ChatRooms and Users

---

## 🧪 **Testing**

### **Running Tests**
```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### **Test Structure**
- **Unit Tests** - Service and controller testing
- **Integration Tests** - Full endpoint testing
- **Database Tests** - Repository and migration testing
- **WebSocket Tests** - Real-time functionality testing

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

### **Environment Considerations**
- Use production PostgreSQL instance
- Configure proper JWT secrets
- Set up file storage (AWS S3, Google Cloud, etc.)
- Configure SMTP for email services
- Set up reverse proxy (Nginx) for production
- Configure CORS for your frontend domain

---

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Follow the existing code style and patterns
- Ensure all tests pass before submitting PR

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎯 **Project Status**

- ✅ **Core Authentication System** - Complete
- ✅ **User Management** - Complete  
- ✅ **Academic Management** - Complete
- ✅ **Real-time Chat** - Complete
- ✅ **Posts & News System** - Complete
- ✅ **File Management** - Complete
- ✅ **API Documentation** - Complete
- 🔄 **Performance Optimization** - In Progress
- 🔄 **Advanced Analytics** - Planned
- 🔄 **Mobile Push Notifications** - Planned

---

## 📞 **Support & Contact**

- **Developer**: Khaled Gadelhaq
- **Email**: khaledmogadelhaq@gmail.com
- **University**: Faculty of Computer and Information Sciences, Mansoura University
- **Live Application**: [https://cis-hub.netlify.app](https://cis-hub.netlify.app)

---

<p align="center">
  <strong>Built with ❤️ for the academic community</strong>
</p>
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

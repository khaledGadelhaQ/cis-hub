# MU Compass - Project Structure & API Endpoints

## Project Folder Structure

```
src/
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── public.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── email-verified.guard.ts
│   ├── interceptors/
│   │   ├── transform.interceptor.ts
│   │   └── logging.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── enums/
│   │   ├── user-role.enum.ts
│   │   ├── enrollment.enum.ts
│   │   ├── chat.enum.ts
│   │   ├── post.enum.ts
│   │   └── notification.enum.ts
│   └── types/
│       ├── jwt-payload.type.ts
│       └── request-with-user.type.ts
├── config/
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── email.config.ts
│   └── app.config.ts
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── database.module.ts
├── modules/
│   ├── auth/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   └── email-verification.service.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── verify-email.dto.ts
│   │   │   ├── change-password.dto.ts
│   │   │   ├── forgot-password.dto.ts
│   │   │   └── reset-password.dto.ts
│   │   ├── entities/
│   │   │   └── user-session.entity.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── controllers/
│   │   │   └── users.controller.ts
│   │   ├── services/
│   │   │   └── users.service.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── update-profile.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── users.module.ts
│   ├── academic/
│   │   ├── controllers/
│   │   │   ├── departments.controller.ts
│   │   │   ├── semesters.controller.ts
│   │   │   ├── courses.controller.ts
│   │   │   └── enrollments.controller.ts
│   │   ├── services/
│   │   │   ├── departments.service.ts
│   │   │   ├── semesters.service.ts
│   │   │   ├── courses.service.ts
│   │   │   └── enrollments.service.ts
│   │   ├── dto/
│   │   │   ├── create-department.dto.ts
│   │   │   ├── create-semester.dto.ts
│   │   │   ├── create-course.dto.ts
│   │   │   ├── enroll-student.dto.ts
│   │   │   └── assign-ta.dto.ts
│   │   ├── entities/
│   │   │   ├── department.entity.ts
│   │   │   ├── semester.entity.ts
│   │   │   ├── course.entity.ts
│   │   │   ├── course-class.entity.ts
│   │   │   ├── course-section.entity.ts
│   │   │   ├── course-enrollment.entity.ts
│   │   │   └── course-schedule.entity.ts
│   │   └── academic.module.ts
│   ├── chat/
│   │   ├── controllers/
│   │   │   ├── chat-groups.controller.ts
│   │   │   └── messages.controller.ts
│   │   ├── services/
│   │   │   ├── chat-groups.service.ts
│   │   │   └── messages.service.ts
│   │   ├── dto/
│   │   │   ├── create-group.dto.ts
│   │   │   ├── send-message.dto.ts
│   │   │   ├── add-reaction.dto.ts
│   │   │   └── update-message.dto.ts
│   │   ├── entities/
│   │   │   ├── chat-group.entity.ts
│   │   │   ├── chat-group-member.entity.ts
│   │   │   ├── message.entity.ts
│   │   │   └── message-reaction.entity.ts
│   │   ├── gateways/
│   │   │   └── chat.gateway.ts
│   │   └── chat.module.ts
│   ├── posts/
│   │   ├── controllers/
│   │   │   └── posts.controller.ts
│   │   ├── services/
│   │   │   └── posts.service.ts
│   │   ├── dto/
│   │   │   ├── create-post.dto.ts
│   │   │   ├── update-post.dto.ts
│   │   │   └── post-filter.dto.ts
│   │   ├── entities/
│   │   │   ├── post.entity.ts
│   │   │   └── post-attachment.entity.ts
│   │   └── posts.module.ts
│   ├── assignments/
│   │   ├── controllers/
│   │   │   └── assignments.controller.ts
│   │   ├── services/
│   │   │   └── assignments.service.ts
│   │   ├── dto/
│   │   │   ├── create-assignment.dto.ts
│   │   │   ├── update-assignment.dto.ts
│   │   │   └── assignment-filter.dto.ts
│   │   ├── entities/
│   │   │   └── assignment.entity.ts
│   │   └── assignments.module.ts
│   ├── files/
│   │   ├── controllers/
│   │   │   └── files.controller.ts
│   │   ├── services/
│   │   │   ├── files.service.ts
│   │   │   └── s3.service.ts
│   │   ├── dto/
│   │   │   └── upload-file.dto.ts
│   │   ├── entities/
│   │   │   └── file.entity.ts
│   │   └── files.module.ts
│   ├── notifications/
│   │   ├── controllers/
│   │   │   └── notifications.controller.ts
│   │   ├── services/
│   │   │   ├── notifications.service.ts
│   │   │   └── email.service.ts
│   │   ├── dto/
│   │   │   ├── create-notification.dto.ts
│   │   │   └── notification-settings.dto.ts
│   │   ├── entities/
│   │   │   ├── notification.entity.ts
│   │   │   └── user-notification-settings.entity.ts
│   │   └── notifications.module.ts
│   └── dashboard/
│       ├── controllers/
│       │   └── dashboard.controller.ts
│       ├── services/
│       │   └── dashboard.service.ts
│       ├── dto/
│       │   └── dashboard-stats.dto.ts
│       └── dashboard.module.ts
├── utils/
│   ├── bcrypt.util.ts
│   ├── otp.util.ts
│   └── validation.util.ts
├── app.controller.ts
├── app.service.ts
├── app.module.ts
└── main.ts
```

## API Endpoints Documentation

### 1. Authentication Module (`/api/auth`)

| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| POST | `/auth/login` | Initial login with university email + national ID | `{ email, password }` | `{ accessToken, refreshToken, requiresEmailVerification, requiresPasswordChange }` | No |
| POST | `/auth/send-verification` | Send OTP to email for verification | `{ email }` | `{ message, expiresAt }` | No |
| POST | `/auth/verify-email` | Verify email with OTP | `{ email, otp }` | `{ message, isVerified }` | No |
| POST | `/auth/change-password` | Change password after email verification | `{ currentPassword, newPassword, confirmPassword }` | `{ message }` | Yes |
| POST | `/auth/forgot-password` | Request password reset | `{ email }` | `{ message }` | No |
| POST | `/auth/reset-password` | Reset password with token | `{ token, newPassword, confirmPassword }` | `{ message }` | No |
| POST | `/auth/refresh` | Refresh access token | `{ refreshToken }` | `{ accessToken, refreshToken }` | No |
| POST | `/auth/logout` | Logout and invalidate tokens | - | `{ message }` | Yes |
| GET | `/auth/profile` | Get current user profile | - | `User` | Yes |

### 2. Users Module (`/api/users`)

| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| GET | `/users/me` | Get current user details | - | `User` | Yes |
| PUT | `/users/me` | Update current user profile | `UpdateProfileDto` | `User` | Yes |
| POST | `/users/upload-avatar` | Upload profile image | `File` | `{ profileImageUrl }` | Yes |
| GET | `/users/search` | Search users by name/email | `?query=string&role=STUDENT` | `User[]` | Yes |
| GET | `/users/:id` | Get user by ID | - | `User` | Yes |
| PUT | `/users/:id` | Update user (Admin only) | `UpdateUserDto` | `User` | Admin |
| DELETE | `/users/:id` | Deactivate user (Admin only) | - | `{ message }` | Admin |

### 3. Academic Module (`/api/academic`)

#### Departments (`/api/academic/departments`)
| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| GET | `/departments` | Get all departments | - | `Department[]` | Yes |
| POST | `/departments` | Create department (Admin only) | `CreateDepartmentDto` | `Department` | Admin |
| PUT | `/departments/:id` | Update department (Admin only) | `UpdateDepartmentDto` | `Department` | Admin |
| DELETE | `/departments/:id` | Delete department (Admin only) | - | `{ message }` | Admin |

#### Semesters (`/api/academic/semesters`)
| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| GET | `/semesters` | Get all semesters | - | `Semester[]` | Yes |
| GET | `/semesters/active` | Get active semester | - | `Semester` | Yes |
| POST | `/semesters` | Create semester (Admin only) | `CreateSemesterDto` | `Semester` | Admin |
| PUT | `/semesters/:id/activate` | Activate semester (Admin only) | - | `Semester` | Admin |

#### Courses (`/api/academic/courses`)
| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| GET | `/courses` | Get courses (filtered by user year/dept) | `?department=id&year=1` | `Course[]` | Yes |
| GET | `/courses/:id` | Get course details | - | `Course` | Yes |
| POST | `/courses` | Create course (Admin only) | `CreateCourseDto` | `Course` | Admin |
| PUT | `/courses/:id` | Update course (Admin only) | `UpdateCourseDto` | `Course` | Admin |
| GET | `/courses/:id/sections` | Get course sections | - | `CourseSection[]` | Yes |
| GET | `/courses/:id/schedule` | Get course schedule | - | `CourseSchedule[]` | Yes |
| GET | `/courses/:id/students` | Get enrolled students | - | `User[]` | Professor/TA |

#### Enrollments (`/api/academic/enrollments`)
| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| GET | `/enrollments/my-courses` | Get current user's courses | - | `CourseEnrollment[]` | Yes |
| POST | `/enrollments` | Enroll student in course (Admin only) | `EnrollStudentDto` | `CourseEnrollment` | Admin |
| PUT | `/enrollments/:id/assign-section` | Assign student to section | `{ sectionId }` | `CourseEnrollment` | Admin |
| POST | `/enrollments/assign-ta` | Assign TA to sections | `AssignTaDto` | `{ message }` | Admin |
| DELETE | `/enrollments/:id` | Remove enrollment | - | `{ message }` | Admin |

### 4. Chat Module (`/api/chat`)

#### Chat Groups (`/api/chat/groups`)
| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| GET | `/groups` | Get user's chat groups | - | `ChatGroup[]` | Yes |
| GET | `/groups/:id` | Get group details | - | `ChatGroup` | Yes |
| GET | `/groups/:id/members` | Get group members | - | `User[]` | Yes |
| POST | `/groups` | Create general group (Admin only) | `CreateGroupDto` | `ChatGroup` | Admin |
| PUT | `/groups/:id` | Update group (Admin only) | `UpdateGroupDto` | `ChatGroup` | Admin |

#### Messages (`/api/chat/messages`)
| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| GET | `/messages/:groupId` | Get group messages | `?page=1&limit=50` | `Message[]` | Yes |
| POST | `/messages` | Send message | `SendMessageDto` | `Message` | Yes |
| PUT | `/messages/:id` | Edit message | `UpdateMessageDto` | `Message` | Yes |
| DELETE | `/messages/:id` | Delete message | - | `{ message }` | Yes |
| POST | `/messages/:id/reactions` | Add reaction to message | `AddReactionDto` | `MessageReaction` | Yes |
| DELETE | `/messages/:id/reactions` | Remove reaction | `{ reaction }` | `{ message }` | Yes |
| PUT | `/groups/:id/read` | Mark messages as read | - | `{ message }` | Yes |

### 5. Posts Module (`/api/posts`)

| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| GET | `/posts` | Get posts feed | `?type=ANNOUNCEMENT&department=id&year=1` | `Post[]` | Yes |
| GET | `/posts/:id` | Get post details | - | `Post` | Yes |
| POST | `/posts` | Create post (Professor/Admin only) | `CreatePostDto` | `Post` | Professor/Admin |
| PUT | `/posts/:id` | Update post | `UpdatePostDto` | `Post` | Author/Admin |
| DELETE | `/posts/:id` | Delete post | - | `{ message }` | Author/Admin |
| PUT | `/posts/:id/pin` | Pin/Unpin post (Admin only) | `{ isPinned }` | `Post` | Admin |

### 6. Assignments Module (`/api/assignments`)

| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| GET | `/assignments` | Get assignments | `?courseId=id&type=HOMEWORK` | `Assignment[]` | Yes |
| GET | `/assignments/:id` | Get assignment details | - | `Assignment` | Yes |
| POST | `/assignments` | Create assignment (Professor only) | `CreateAssignmentDto` | `Assignment` | Professor |
| PUT | `/assignments/:id` | Update assignment | `UpdateAssignmentDto` | `Assignment` | Professor |
| DELETE | `/assignments/:id` | Delete assignment | - | `{ message }` | Professor |
| GET | `/assignments/upcoming` | Get upcoming assignments | `?days=7` | `Assignment[]` | Yes |

### 7. Files Module (`/api/files`)

| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| POST | `/files/upload` | Upload file | `File + UploadFileDto` | `File` | Yes |
| GET | `/files/:id` | Get file details | - | `File` | Yes |
| GET | `/files/:id/download` | Download file | - | `FileStream` | Yes |
| DELETE | `/files/:id` | Delete file | - | `{ message }` | Yes |
| GET | `/files/my-files` | Get user's uploaded files | `?context=CHAT` | `File[]` | Yes |

### 8. Notifications Module (`/api/notifications`)

| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| GET | `/notifications` | Get user notifications | `?isRead=false&page=1` | `Notification[]` | Yes |
| PUT | `/notifications/:id/read` | Mark notification as read | - | `Notification` | Yes |
| PUT | `/notifications/read-all` | Mark all as read | - | `{ message }` | Yes |
| DELETE | `/notifications/:id` | Delete notification | - | `{ message }` | Yes |
| GET | `/notifications/settings` | Get notification settings | - | `UserNotificationSettings[]` | Yes |
| PUT | `/notifications/settings` | Update notification settings | `NotificationSettingsDto` | `UserNotificationSettings[]` | Yes |

### 9. Dashboard Module (`/api/dashboard`)

| Method | Endpoint | Description | Request Body | Response | Auth Required |
|--------|----------|-------------|--------------|----------|---------------|
| GET | `/dashboard/stats` | Get dashboard statistics | - | `DashboardStats` | Yes |
| GET | `/dashboard/recent-activity` | Get recent user activity | - | `Activity[]` | Yes |
| GET | `/dashboard/upcoming-events` | Get upcoming assignments/events | - | `Event[]` | Yes |

## WebSocket Events (Chat Gateway)

### Client to Server Events
- `join-group`: Join a chat group room
- `leave-group`: Leave a chat group room
- `send-message`: Send a message
- `typing-start`: User started typing
- `typing-stop`: User stopped typing
- `message-read`: Mark message as read

### Server to Client Events
- `new-message`: New message received
- `message-updated`: Message was edited
- `message-deleted`: Message was deleted
- `user-typing`: Another user is typing
- `user-joined`: User joined the group
- `user-left`: User left the group
- `group-updated`: Group information updated

## Authentication Flow

1. **Initial Login**: User logs in with university email + national ID
2. **Email Verification**: System sends OTP to email, user verifies
3. **Password Change**: After verification, user must change password
4. **Normal Operations**: User can access all features
5. **Forgot Password**: Reset via email with secure token

## Role-Based Access Control

- **STUDENT**: Can access their courses, chat groups, view posts/assignments
- **TA**: Student permissions + manage their assigned sections
- **PROFESSOR**: TA permissions + create posts/assignments for their courses
- **ADMIN**: Full system access, user management, course management
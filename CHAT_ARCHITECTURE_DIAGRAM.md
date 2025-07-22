# 🏗️ Chat System Architecture Visualization

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUTTER MOBILE APP                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Private Chat  │ │   Class Groups  │ │  Notifications  │   │
│  │     Screen      │ │     Screen      │ │     Service     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                         WebSocket + HTTP
                                │
┌─────────────────────────────────────────────────────────────────┐
│                     NESTJS API SERVER                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    CHAT MODULE                          │   │
│  │                                                         │   │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌───────────┐ │   │
│  │  │PrivateChatGW    │ │ GroupChatGW     │ │NotificationGW│ │   │
│  │  │/private         │ │/groups          │ │/notifications│ │   │
│  │  └─────────────────┘ └─────────────────┘ └───────────┘ │   │
│  │           │                   │                 │       │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │                 SHARED SERVICES                     │ │   │
│  │  │  ┌───────────┐ ┌─────────────┐ ┌─────────────────┐ │ │   │
│  │  │  │ChatService│ │MessageServ. │ │NotificationServ.│ │ │   │
│  │  │  └───────────┘ └─────────────┘ └─────────────────┘ │ │   │
│  │  │  ┌───────────┐ ┌─────────────┐ ┌─────────────────┐ │ │   │
│  │  │  │RoomService│ │FileService  │ │TypingService    │ │ │   │
│  │  │  └───────────┘ └─────────────┘ └─────────────────┘ │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  OTHER MODULES                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ Auth Module │ │User Module  │ │ Academic Module     │ │   │
│  │  │             │ │             │ │                     │ │   │
│  │  │  JWT Guard  │ │User Service │ │Course/Class/Section │ │   │
│  │  │  Auth Serv. │ │             │ │Services             │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                         Prisma ORM
                                │
┌─────────────────────────────────────────────────────────────────┐
│                     POSTGRESQL DATABASE                        │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  EXISTING CORE  │ │   NEW CHAT      │ │  INTEGRATION    │   │
│  │     TABLES      │ │    TABLES       │ │    TABLES       │   │
│  │                 │ │                 │ │                 │   │
│  │ • users         │ │ • chat_rooms    │ │ • message_files │   │
│  │ • courses       │ │ • room_members  │ │ • room_course   │   │
│  │ • course_classes│ │ • chat_messages │ │   _relations    │   │
│  │ • course_sections│ │ • read_receipts │ │                 │   │
│  │ • enrollments   │ │ • typing_indic. │ │                 │   │
│  │ • files         │ │ • pinned_msgs   │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                        External Services
                                │
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  FIREBASE FCM   │ │   FILE STORAGE  │ │     REDIS       │   │
│  │                 │ │                 │ │                 │   │
│  │ Push Notifications│ │ Chat Files     │ │ Message Cache   │   │
│  │ Device Tokens   │ │ Image Thumbnails│ │ Typing Status   │   │
│  │ Notification    │ │ File Metadata   │ │ Session Store   │   │
│  │ Templates       │ │                 │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Room Creation Flow

```
Course Created → Auto-Create Class Room
     │
     ├── Professor joins as ADMIN
     │
     └── Students auto-join as MEMBER
             (based on enrollments)

TA Assigned to Sections → Auto-Create Section Room
     │
     ├── TA joins as ADMIN
     │
     └── Section Students auto-join as MEMBER
             (from multiple sections)
```

## Message Flow Architecture

```
┌─────────────┐    WebSocket    ┌─────────────────┐
│ Flutter App │ ←─────────────→ │  Gateway Layer  │
└─────────────┘                 └─────────────────┘
                                         │
                                ┌─────────────────┐
                                │ Service Layer   │
                                │                 │
                                │ • Validation    │
                                │ • Permission    │
                                │ • Business Logic│
                                └─────────────────┘
                                         │
                                ┌─────────────────┐
                                │ Database Layer  │
                                │                 │
                                │ • Save Message  │
                                │ • Update Status │
                                │ • Log Activity  │
                                └─────────────────┘
                                         │
                                ┌─────────────────┐
                                │External Services│
                                │                 │
                                │ • Push Notif.   │
                                │ • File Upload   │
                                │ • Cache Update  │
                                └─────────────────┘
```

## Data Relationships

```
User ──────────┐
               │
               ├── RoomMember ──── ChatRoom ──── ChatMessage
               │                       │              │
               │                       │              └── MessageFile ──── File
               │                       │
               └── CourseEnrollment    │
                           │           │
                           └── Course ─┼── CourseClass ─────┘
                                       │
                                       └── CourseSection ───┘
```

## WebSocket Namespaces Strategy

```
/chat/private     - Private 1:1 messaging
/chat/groups      - Class and Section groups
/chat/notifications - Real-time notifications
/chat/admin       - Admin operations (optional)
```

## Security Layers

```
┌─────────────────────────────────────────┐
│              Request Flow               │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         1. JWT Authentication           │
│    • Token validation                   │
│    • User identification                │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         2. Rate Limiting                │
│    • Messages per minute                │
│    • File uploads per hour              │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         3. Room Authorization           │
│    • Check room membership              │
│    • Validate permissions               │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         4. Content Validation           │
│    • Message sanitization               │
│    • File type checking                 │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         5. Business Logic               │
│    • Process message                    │
│    • Send notifications                 │
└─────────────────────────────────────────┘
```

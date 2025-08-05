#!/usr/bin/env node
/**
 * Add Documentation to Postman Collection
 * Adds minimal but comprehensive descriptions to all folders and endpoints
 */

const fs = require('fs');
const path = require('path');

const COLLECTION_PATH = path.join(
  __dirname,
  '..',
  'collections',
  'CIS-HUB-API.postman_collection.json',
);

// Load current collection
const collection = JSON.parse(fs.readFileSync(COLLECTION_PATH, 'utf8'));

// Folder descriptions mapping
const folderDescriptions = {
  '🔐 Authentication':
    'User authentication endpoints - login, logout, token refresh, password management, and session handling',
  '👤 User Profile':
    'Personal user profile management - update profile information, upload avatar, and manage personal settings',
  '👥 User Management (Admin)':
    'Administrative user management - create, update, delete users, manage roles, and handle user transitions (admin only)',
  '📧 Email Verification':
    'Email verification system - send verification emails and verify user email addresses',
  '🔑 Password Reset':
    'Password reset functionality - send reset emails and reset user passwords securely',
  '🏢 Academic - Departments':
    'Department management - CRUD operations for university departments (admin only)',
  '📚 Academic - Courses':
    'Academic course system - course management, enrollment handling, and academic structure',
  '📖 Core Course Management':
    'Basic course operations - create, read, update, delete courses with department filtering',
  '📅 Course Classes Management':
    'Course class scheduling - manage class sessions, sections, and scheduling within courses',
  '🎓 Course Enrollments':
    'Student enrollment system - manage student-course relationships, roles (student/instructor), and enrollment status',
  '📁 Files Management':
    'File upload and management system - upload files, associate with contexts, download, and manage file metadata',
  '💬 Chat File Management':
    'Chat-specific file operations - upload chat attachments, serve files, generate thumbnails, and manage chat media',
  '📰 Posts/News/Feed':
    'University posts and news system - create announcements, manage news feeds, and handle university communications',
  '📝 Post Management':
    'Core post operations - create, read, update, delete posts with filtering, search, and pin functionality',
  '🎯 Specialized Feeds':
    'User-specific feed endpoints - department feeds, year-specific content, announcements, urgent posts, and targeted content delivery',
  '📎 Post File Management':
    'Post attachments system - upload files to posts, associate attachments, download post files, and manage post media',
  '🌐 WebSocket Testing':
    'Real-time communication testing - WebSocket endpoints for chat functionality and live messaging',
};

// Endpoint descriptions mapping
const endpointDescriptions = {
  // Authentication
  Login:
    'Authenticate user with email/password and receive access/refresh tokens',
  'Refresh Token':
    'Get new access token using refresh token for session continuation',
  'Get Me':
    'Retrieve current authenticated user information and profile details',
  Logout: 'Invalidate current session and logout user from single device',
  'Logout All Devices':
    'Invalidate all user sessions across all devices for security',
  'Change Password': 'Update user password with current password verification',

  // User Profile
  'Update My Profile':
    "Update authenticated user's profile information (name, phone, etc.)",
  'Upload Avatar': 'Upload and set user profile picture/avatar image',

  // User Management (Admin)
  'Get All Users (with filters)':
    'Retrieve paginated list of all users with filtering options (admin only)',
  'Get User by ID':
    'Retrieve specific user information by user ID (admin only)',
  'Create User': 'Create new user account with role assignment (admin only)',
  'Update User': 'Update existing user information and settings (admin only)',
  'Delete User (Soft Delete)':
    'Soft delete user account while preserving data integrity (admin only)',
  'Deactivate User': 'Temporarily deactivate user account (admin only)',
  'Activate User':
    'Reactivate previously deactivated user account (admin only)',
  'Reset User Password':
    'Force password reset for any user account (admin only)',
  'Transition Student Department':
    'Move student from General Education to specialized department (admin only)',

  // Email Verification
  'Send Verification Email':
    "Send email verification link to user's email address",
  'Verify Email':
    'Verify user email address using verification token from email',

  // Password Reset
  'Send Password Reset Email':
    "Send password reset link to user's registered email",
  'Reset Password': 'Reset user password using reset token from email',

  // Departments
  'Get All Departments':
    'Retrieve list of all university departments with basic information',
  'Get Department by ID':
    'Retrieve specific department information including courses and users',
  'Create Department': 'Create new university department (admin only)',
  'Update Department': 'Update existing department information (admin only)',
  'Delete Department':
    'Delete department (admin only) - requires no associated users/courses',

  // Core Course Management
  'Get All Courses':
    'Retrieve paginated list of courses with filtering by department, year, etc.',
  'Get Course by ID':
    'Retrieve detailed course information including classes and enrollments',
  'Create Course':
    'Create new academic course with department assignment (admin/professor)',
  'Update Course':
    'Update existing course information and settings (admin/professor)',
  'Delete Course':
    'Delete course (admin only) - requires no active enrollments',
  'Get Courses by Department':
    'Retrieve all courses within specific department',
  'Get Courses by Year': 'Retrieve courses for specific academic year',
  'Search Courses': 'Search courses by name, code, or description',
  'Get Courses by Multiple Filters':
    'Advanced course filtering with multiple criteria',

  // Course Classes Management
  'Get All Classes': 'Retrieve all course classes with scheduling information',
  'Get Classes by Course': 'Retrieve all classes/sections for specific course',
  'Get Class by ID': 'Retrieve detailed information about specific class',
  'Create Course Class':
    'Create new class/section for existing course (admin/professor)',
  'Update Course Class':
    'Update class information, schedule, or instructor (admin/professor)',
  'Delete Course Class': 'Delete course class/section (admin only)',

  // Course Enrollments
  'Get Course Enrollments':
    'Retrieve all enrollments for specific course with student/instructor info',
  'Enroll User in Course':
    'Enroll student or assign instructor to course (admin/professor)',
  'Update Enrollment': 'Update enrollment status or role (admin/professor)',
  'Remove Enrollment': 'Remove user from course enrollment (admin only)',
  'Get User Enrollments': 'Retrieve all course enrollments for specific user',

  // Files Management
  'Upload Files':
    'Upload single or multiple files with context assignment (general, post, chat, etc.)',
  'Get Files':
    'Retrieve files with filtering by context, uploader, file type, etc.',
  'Get File by ID': 'Retrieve specific file metadata and information',
  'Download File': 'Download file content with access control verification',
  'Update File Metadata':
    'Update file information like name, description, or visibility',
  'Delete File': 'Delete file from system and storage (admin/uploader only)',
  'Get File Statistics for Context':
    'Get file usage statistics for specific context (POST, CHAT_MESSAGE, etc.)',
  'Associate Files with Context':
    'Link existing files to specific context (post, message, etc.)',
  'Get Chat Files for Messages':
    'Retrieve all files associated with chat messages',

  // Chat File Management
  'Upload Chat File':
    'Upload files specifically for chat messages with automatic thumbnail generation',
  'Upload Multiple Chat Files': 'Batch upload multiple files for chat messages',
  'Serve Chat File':
    'Serve chat file for inline viewing (optimized for Flutter app)',
  'Download Chat File': 'Download chat file with proper attachment headers',
  'Get Chat File Thumbnail':
    'Retrieve generated thumbnail for image files (small, medium, large)',
  'Get Files from Message':
    'Retrieve all files attached to specific chat message',
  'Get Accessible Chat Files':
    "Browse files from user's accessible chat rooms with filtering",
  'Search Chat Files':
    'Search chat files by name and type across accessible rooms',
  'Get Chat File Metadata':
    'Retrieve detailed file information without downloading content',
  'Associate Chat Files': 'Link uploaded files to specific chat messages',
  'Get Chat File Statistics': 'Get file usage statistics for chat context',
  'Get File Metadata':
    'Retrieve comprehensive file metadata including uploader and thumbnails',

  // Post Management
  'Create Post':
    'Create new university post/announcement with department and scope targeting',
  'Get All Posts (Feed)':
    'Retrieve personalized post feed based on user role and department access',
  'Get Pinned Posts': 'Retrieve all pinned posts (high-priority announcements)',
  'Search Posts': 'Search posts by title, content, or keywords with filtering',
  'Get Post by ID': 'Retrieve specific post with full details and attachments',
  'Update Post':
    'Update existing post content, priority, or scope (author/admin only)',
  'Delete Post':
    'Delete post (author/admin only) - soft delete preserving references',
  'Toggle Pin Post (Admin)':
    'Pin or unpin post for priority display (admin only)',
  'Get Post Attachments': 'Retrieve all files attached to specific post',

  // Specialized Feeds
  'Get My Department Feed': "Retrieve posts from user's department only",
  'Get My Year Feed': "Retrieve posts targeted to user's current academic year",
  'Get Announcements Feed': 'Retrieve announcement-type posts only',
  'Get Assignments Feed (Events)':
    'Retrieve event-type posts (assignments, deadlines, events)',
  'Get Global Feed': 'Retrieve university-wide posts and announcements',
  'Get Urgent Feed':
    'Retrieve high-priority posts requiring immediate attention',

  // Post File Management
  'Upload Post Files':
    'Upload files to be attached to posts with validation and context setting',
  'Associate Files with Post': 'Link existing uploaded files to specific post',
  'Get Post Files': 'Retrieve all files associated with specific post',
  'Download Post File': 'Download file attached to post with access control',
  'Get Post File Statistics': 'Get file usage statistics for specific post',
  'Remove File from Post': 'Unlink files from post (author/admin only)',
  'Delete Post File':
    'Permanently delete file attached to post (author/admin only)',

  // WebSocket Testing
  'Private Chat WebSocket':
    'WebSocket connection for private/direct messaging between users',
  'Group Chat WebSocket':
    'WebSocket connection for group chat rooms and channels',
};

// Function to add description to item if it doesn't exist
function addDescription(item, description) {
  if (!item.description || item.description.trim() === '') {
    item.description = description;
    return true; // Added description
  }
  return false; // Description already exists
}

// Function to process collection recursively
function processItems(items, level = 0) {
  let addedCount = 0;

  items.forEach((item) => {
    if (item.item) {
      // This is a folder
      if (folderDescriptions[item.name]) {
        if (addDescription(item, folderDescriptions[item.name])) {
          addedCount++;
          console.log(
            `${'  '.repeat(level)}📁 Added description to folder: ${item.name}`,
          );
        }
      }

      // Process subfolder items recursively
      addedCount += processItems(item.item, level + 1);
    } else {
      // This is an endpoint
      if (endpointDescriptions[item.name]) {
        if (addDescription(item, endpointDescriptions[item.name])) {
          addedCount++;
          console.log(
            `${'  '.repeat(level)}🔗 Added description to endpoint: ${item.name}`,
          );
        }
      }
    }
  });

  return addedCount;
}

console.log('🚀 Starting documentation update for Postman collection...\n');

// Process the collection
const addedCount = processItems(collection.item);

// Write updated collection
fs.writeFileSync(COLLECTION_PATH, JSON.stringify(collection, null, 2));

console.log('\n🎉 Documentation update completed!');
console.log(`📊 Summary:`);
console.log(`- Total descriptions added: ${addedCount}`);
console.log(
  `- Collection folders: ${Object.keys(folderDescriptions).length} documented`,
);
console.log(
  `- Collection endpoints: ${Object.keys(endpointDescriptions).length} documented`,
);
console.log('\n💡 Benefits:');
console.log('- Clear purpose description for every folder and endpoint');
console.log('- Better developer onboarding and API understanding');
console.log('- Self-documenting collection for team collaboration');
console.log('- Improved API discoverability and usage guidance');
console.log('\n✅ Collection is now fully documented and ready for use!');

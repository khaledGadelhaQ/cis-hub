-- CIS-HUB API Performance Indexes
-- Based on actual query patterns from services analysis

-- =============================================
-- 1. USER PERFORMANCE INDEXES (Priority 1 - Critical)
-- =============================================
-- Authentication by email (used in every login)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_email" ON "users"("email");

-- User sessions (used in every authenticated request)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_user_active" ON "user_sessions"("user_id", "is_active");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_refresh_token" ON "user_sessions"("refresh_token");

-- Authorization checks: department + role filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_department_role" ON "users"("department_id", "role");

-- Account status checks (used in middleware)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_active_verified" ON "users"("is_active", "is_email_verified");

-- =============================================
-- 2. POSTS PERFORMANCE INDEXES (Priority 2 - High Volume)  
-- =============================================
-- Critical: Posts feed filtering (most frequent query in PostsService)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_posts_department_published" ON "posts"("department_id", "published_at") WHERE "published_at" IS NOT NULL;

-- Posts visibility and priority filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_posts_scope_priority_created" ON "posts"("scope", "priority", "created_at");

-- Author's posts lookup (used in user profiles)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_posts_author_created" ON "posts"("author_id", "created_at");

-- Post type filtering with time ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_posts_type_created" ON "posts"("post_type", "created_at");

-- =============================================
-- 3. CHAT PERFORMANCE INDEXES (Priority 2 - Real-time Critical)
-- =============================================
-- Most critical: Message history by room (used in every chat load)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_messages_room_sent" ON "chat_messages"("room_id", "sent_at");

-- User's message history
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_messages_sender_sent" ON "chat_messages"("sender_id", "sent_at");

-- Message status and cleanup (for auto-deletion feature)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_messages_deleted_sent" ON "chat_messages"("is_deleted", "sent_at");

-- Room membership lookups (used in permission checks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_room_members_user_room" ON "room_members"("user_id", "room_id");

-- Room type and course filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_rooms_type_course" ON "chat_rooms"("type", "course_class_id");

-- =============================================
-- 4. FILES PERFORMANCE INDEXES (Priority 3)
-- =============================================
-- File context lookups (most frequent in FilesService)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_files_context" ON "files"("upload_context", "context_id");

-- User's uploaded files
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_files_uploader_date" ON "files"("uploaded_by", "uploaded_at");

-- Public file access checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_files_public_context" ON "files"("is_public", "upload_context");

-- Message file attachments lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_files_message" ON "message_files"("message_id");

-- =============================================
-- 5. NOTIFICATIONS PERFORMANCE INDEXES (Priority 3)
-- =============================================
-- User notification feed (most frequent query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_user_status_date" ON "notifications"("user_id", "status", "created_at");

-- Notification retry processing (background job)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_retry" ON "notifications"("status", "next_retry") WHERE "status" = 'RETRY';

-- Device token management
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_device_tokens_user_active" ON "device_tokens"("user_id", "is_active");

-- =============================================
-- 6. ACADEMIC STRUCTURE INDEXES (Priority 4)
-- =============================================
-- Course enrollment queries (frequently used in ChatAutomationService)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_course_enrollments_user_course_status" ON "course_enrollments"("user_id", "course_id", "status");

-- Class member queries for chat room creation
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_course_enrollments_class_role" ON "course_enrollments"("class_id", "role", "status");

-- Section-based enrollment (for section chat rooms)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_course_enrollments_section_status" ON "course_enrollments"("section_id", "status");

-- Professor assignments to classes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_class_professors_class_user" ON "class_professors"("class_id", "user_id");

-- Course structure navigation
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_course_sections_course_class" ON "course_sections"("course_id", "class_id");

-- =============================================
-- 7. ADDITIONAL INDEXES (Priority 4)
-- =============================================
-- Department lookups by code
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_departments_code" ON "departments"("code");

-- Session cleanup (background job)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_sessions_expires_at" ON "user_sessions"("expires_at");
-- CreateIndex
CREATE INDEX "chat_messages_room_id_sent_at_idx" ON "chat_messages"("room_id", "sent_at" DESC);

-- CreateIndex
CREATE INDEX "chat_messages_sender_id_sent_at_idx" ON "chat_messages"("sender_id", "sent_at" DESC);

-- CreateIndex
CREATE INDEX "chat_messages_reply_to_id_idx" ON "chat_messages"("reply_to_id");

-- CreateIndex
CREATE INDEX "chat_messages_message_type_sent_at_idx" ON "chat_messages"("message_type", "sent_at" DESC);

-- CreateIndex
CREATE INDEX "course_enrollments_user_id_status_idx" ON "course_enrollments"("user_id", "status");

-- CreateIndex
CREATE INDEX "course_enrollments_course_id_role_idx" ON "course_enrollments"("course_id", "role");

-- CreateIndex
CREATE INDEX "course_enrollments_class_id_idx" ON "course_enrollments"("class_id");

-- CreateIndex
CREATE INDEX "course_enrollments_section_id_idx" ON "course_enrollments"("section_id");

-- CreateIndex
CREATE INDEX "files_uploaded_by_uploaded_at_idx" ON "files"("uploaded_by", "uploaded_at" DESC);

-- CreateIndex
CREATE INDEX "files_upload_context_context_id_idx" ON "files"("upload_context", "context_id");

-- CreateIndex
CREATE INDEX "files_mime_type_idx" ON "files"("mime_type");

-- CreateIndex
CREATE INDEX "posts_department_id_published_at_idx" ON "posts"("department_id", "published_at" DESC);

-- CreateIndex
CREATE INDEX "posts_author_id_created_at_idx" ON "posts"("author_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "posts_scope_priority_created_at_idx" ON "posts"("scope", "priority", "created_at" DESC);

-- CreateIndex
CREATE INDEX "posts_post_type_created_at_idx" ON "posts"("post_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_sessions_user_id_is_active_idx" ON "user_sessions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "user_sessions_refresh_token_idx" ON "user_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_department_id_role_idx" ON "users"("department_id", "role");

-- CreateIndex
CREATE INDEX "users_is_active_is_email_verified_idx" ON "users"("is_active", "is_email_verified");

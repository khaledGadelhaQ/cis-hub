/*
  Warnings:

  - The values [CHAT] on the enum `UploadContext` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `max_students_per_section` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `semester_id` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `is_general` on the `departments` table. All the data in the column will be lost.
  - You are about to drop the column `course_id` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the `assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_group_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `course_schedules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message_reactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `post_attachments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `semesters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_notification_settings` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `day_of_week` to the `course_classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `course_classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `course_classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `course_classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `professor_id` to the `course_classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `course_classes` table without a default value. This is not possible if the table is not empty.
  - Made the column `max_students` on table `course_classes` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `day_of_week` to the `course_sections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `course_sections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `course_sections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `course_sections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `course_sections` table without a default value. This is not possible if the table is not empty.
  - Made the column `ta_id` on table `course_sections` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `name` on the `departments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `code` on the `departments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updated_at` to the `posts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DepartmentCode" AS ENUM ('CS', 'IS', 'IT', 'GE');

-- CreateEnum
CREATE TYPE "DepartmentName" AS ENUM ('COMPUTER_SCIENCE', 'INFORMATION_SYSTEMS', 'INFORMATION_TECHNOLOGY', 'GENERAL');

-- CreateEnum
CREATE TYPE "PostScope" AS ENUM ('DEPARTMENT', 'YEAR', 'GLOBAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PostType" ADD VALUE 'URGENT';
ALTER TYPE "PostType" ADD VALUE 'GENERAL';

-- AlterEnum
BEGIN;
CREATE TYPE "UploadContext_new" AS ENUM ('CHAT_MESSAGE', 'POST', 'ASSIGNMENT', 'PROFILE', 'GENERAL');
ALTER TABLE "files" ALTER COLUMN "upload_context" TYPE "UploadContext_new" USING ("upload_context"::text::"UploadContext_new");
ALTER TYPE "UploadContext" RENAME TO "UploadContext_old";
ALTER TYPE "UploadContext_new" RENAME TO "UploadContext";
DROP TYPE "UploadContext_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_course_id_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_created_by_fkey";

-- DropForeignKey
ALTER TABLE "chat_group_members" DROP CONSTRAINT "chat_group_members_group_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_group_members" DROP CONSTRAINT "chat_group_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_groups" DROP CONSTRAINT "chat_groups_class_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_groups" DROP CONSTRAINT "chat_groups_course_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_groups" DROP CONSTRAINT "chat_groups_created_by_fkey";

-- DropForeignKey
ALTER TABLE "chat_groups" DROP CONSTRAINT "chat_groups_ta_id_fkey";

-- DropForeignKey
ALTER TABLE "course_schedules" DROP CONSTRAINT "course_schedules_class_id_fkey";

-- DropForeignKey
ALTER TABLE "course_schedules" DROP CONSTRAINT "course_schedules_course_id_fkey";

-- DropForeignKey
ALTER TABLE "course_schedules" DROP CONSTRAINT "course_schedules_instructor_id_fkey";

-- DropForeignKey
ALTER TABLE "course_schedules" DROP CONSTRAINT "course_schedules_section_id_fkey";

-- DropForeignKey
ALTER TABLE "course_sections" DROP CONSTRAINT "course_sections_ta_id_fkey";

-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_semester_id_fkey";

-- DropForeignKey
ALTER TABLE "message_reactions" DROP CONSTRAINT "message_reactions_message_id_fkey";

-- DropForeignKey
ALTER TABLE "message_reactions" DROP CONSTRAINT "message_reactions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_group_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_reply_to_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_recipient_id_fkey";

-- DropForeignKey
ALTER TABLE "post_attachments" DROP CONSTRAINT "post_attachments_post_id_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_course_id_fkey";

-- DropForeignKey
ALTER TABLE "user_notification_settings" DROP CONSTRAINT "user_notification_settings_user_id_fkey";

-- AlterTable
ALTER TABLE "course_classes" ADD COLUMN     "day_of_week" INTEGER NOT NULL,
ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "end_time" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "professor_id" TEXT NOT NULL,
ADD COLUMN     "start_time" TEXT NOT NULL,
ALTER COLUMN "max_students" SET NOT NULL,
ALTER COLUMN "max_students" SET DEFAULT 40;

-- AlterTable
ALTER TABLE "course_sections" ADD COLUMN     "day_of_week" INTEGER NOT NULL,
ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "end_time" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "start_time" TEXT NOT NULL,
ALTER COLUMN "ta_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "max_students_per_section",
DROP COLUMN "semester_id";

-- AlterTable
ALTER TABLE "departments" DROP COLUMN "is_general",
DROP COLUMN "name",
ADD COLUMN     "name" "DepartmentName" NOT NULL,
DROP COLUMN "code",
ADD COLUMN     "code" "DepartmentCode" NOT NULL;

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "course_id",
DROP COLUMN "expires_at",
ADD COLUMN     "scope" "PostScope" NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "assignments";

-- DropTable
DROP TABLE "chat_group_members";

-- DropTable
DROP TABLE "chat_groups";

-- DropTable
DROP TABLE "course_schedules";

-- DropTable
DROP TABLE "message_reactions";

-- DropTable
DROP TABLE "messages";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "post_attachments";

-- DropTable
DROP TABLE "semesters";

-- DropTable
DROP TABLE "user_notification_settings";

-- DropEnum
DROP TYPE "AssignmentType";

-- DropEnum
DROP TYPE "ChatGroupType";

-- DropEnum
DROP TYPE "GroupMemberRole";

-- DropEnum
DROP TYPE "MessageType";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "ScheduleType";

-- CreateTable
CREATE TABLE "course_professors" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "professor_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_professors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_professors_course_id_professor_id_key" ON "course_professors"("course_id", "professor_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- AddForeignKey
ALTER TABLE "course_professors" ADD CONSTRAINT "course_professors_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_professors" ADD CONSTRAINT "course_professors_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_classes" ADD CONSTRAINT "course_classes_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_ta_id_fkey" FOREIGN KEY ("ta_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

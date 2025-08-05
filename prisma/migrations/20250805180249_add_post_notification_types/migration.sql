-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'POST_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'POST_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE 'POST_PINNED';
ALTER TYPE "NotificationType" ADD VALUE 'POST_FILE_UPLOADED';
ALTER TYPE "NotificationType" ADD VALUE 'POST_URGENT';
ALTER TYPE "NotificationType" ADD VALUE 'POST_DEADLINE_REMINDER';

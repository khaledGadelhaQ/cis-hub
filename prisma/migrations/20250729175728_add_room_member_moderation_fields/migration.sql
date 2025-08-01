-- AlterTable
ALTER TABLE "room_members" ADD COLUMN     "blocked_at" TIMESTAMP(3),
ADD COLUMN     "blocked_by" TEXT,
ADD COLUMN     "is_blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_message_at" TIMESTAMP(3),
ADD COLUMN     "muted_at" TIMESTAMP(3),
ADD COLUMN     "muted_by" TEXT;

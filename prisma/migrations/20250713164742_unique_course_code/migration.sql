/*
  Warnings:

  - You are about to drop the column `professor_id` on the `course_classes` table. All the data in the column will be lost.
  - You are about to drop the `course_professors` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `courses` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "course_classes" DROP CONSTRAINT "course_classes_professor_id_fkey";

-- DropForeignKey
ALTER TABLE "course_professors" DROP CONSTRAINT "course_professors_course_id_fkey";

-- DropForeignKey
ALTER TABLE "course_professors" DROP CONSTRAINT "course_professors_professor_id_fkey";

-- AlterTable
ALTER TABLE "course_classes" DROP COLUMN "professor_id";

-- AlterTable
ALTER TABLE "courses" ALTER COLUMN "credit_hours" DROP NOT NULL;

-- DropTable
DROP TABLE "course_professors";

-- CreateTable
CREATE TABLE "class_professors" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "professor_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_professors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "class_professors_class_id_professor_id_key" ON "class_professors"("class_id", "professor_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- AddForeignKey
ALTER TABLE "class_professors" ADD CONSTRAINT "class_professors_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "course_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_professors" ADD CONSTRAINT "class_professors_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

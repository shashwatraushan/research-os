/*
  Warnings:

  - A unique constraint covering the columns `[fileId]` on the table `Dataset` will be added. If there are existing duplicate values, this will fail.
  - Made the column `startDate` on table `Experiment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Artifact" ADD COLUMN     "datasetId" TEXT,
ADD COLUMN     "experimentLogId" TEXT;

-- AlterTable
ALTER TABLE "Dataset" ADD COLUMN     "folder" TEXT DEFAULT 'Unsorted';

-- AlterTable
ALTER TABLE "Experiment" ADD COLUMN     "folder" TEXT DEFAULT 'Unsorted',
ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "startDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ExperimentLog" ADD COLUMN     "fileName" TEXT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "canEditData" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canEditExps" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canEditLit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageTeam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "Paper" ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "folder" TEXT DEFAULT 'Unsorted',
ADD COLUMN     "userNotes" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sendReminder" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_fileId_key" ON "Dataset"("fileId");

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_experimentLogId_fkey" FOREIGN KEY ("experimentLogId") REFERENCES "ExperimentLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

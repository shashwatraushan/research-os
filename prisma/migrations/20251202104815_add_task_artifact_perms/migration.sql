-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "canEditArtifacts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canEditTasks" BOOLEAN NOT NULL DEFAULT false;

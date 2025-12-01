-- AlterTable
ALTER TABLE "Experiment" ADD COLUMN     "conclusion" TEXT,
ADD COLUMN     "metric" TEXT;

-- AlterTable
ALTER TABLE "ExperimentLog" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "link" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'note';

CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

ALTER TABLE "AccidentMedia"
ADD COLUMN "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE';

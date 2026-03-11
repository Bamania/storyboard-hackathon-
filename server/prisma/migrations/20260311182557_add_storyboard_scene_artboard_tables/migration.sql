/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BoardStatus" AS ENUM ('DRAFT', 'DEBATING', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ArtboardStatus" AS ENUM ('PENDING', 'PARAMS_READY', 'GENERATING', 'DONE', 'FAILED');

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Storyboard" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "status" "BoardStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Storyboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CastMember" (
    "id" SERIAL NOT NULL,
    "storyboardId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,

    CONSTRAINT "CastMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" SERIAL NOT NULL,
    "storyboardId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "characters" TEXT[],
    "location" TEXT NOT NULL,
    "timeOfDay" TEXT NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artboard" (
    "id" SERIAL NOT NULL,
    "sceneId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "ArtboardStatus" NOT NULL DEFAULT 'PENDING',
    "shotDescription" TEXT,
    "imageUrl" TEXT,
    "directorParams" JSONB,
    "cinematographerParams" JSONB,
    "productionDesignerParams" JSONB,
    "editorParams" JSONB,
    "generationDurationMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scene_storyboardId_position_idx" ON "Scene"("storyboardId", "position");

-- CreateIndex
CREATE INDEX "Artboard_sceneId_position_idx" ON "Artboard"("sceneId", "position");

-- AddForeignKey
ALTER TABLE "CastMember" ADD CONSTRAINT "CastMember_storyboardId_fkey" FOREIGN KEY ("storyboardId") REFERENCES "Storyboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_storyboardId_fkey" FOREIGN KEY ("storyboardId") REFERENCES "Storyboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artboard" ADD CONSTRAINT "Artboard_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

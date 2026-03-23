/*
  Warnings:

  - You are about to drop the column `description` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `documents` table. All the data in the column will be lost.
  - Added the required column `autoRenamePattern` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `internalCode` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `documents` DROP COLUMN `description`,
    DROP COLUMN `title`,
    DROP COLUMN `uploadedAt`,
    DROP COLUMN `url`,
    ADD COLUMN `autoRenamePattern` VARCHAR(191) NOT NULL,
    ADD COLUMN `category` VARCHAR(191) NOT NULL,
    ADD COLUMN `fileType` VARCHAR(191) NOT NULL,
    ADD COLUMN `internalCode` VARCHAR(191) NOT NULL,
    ADD COLUMN `label` VARCHAR(191) NOT NULL,
    ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `translationNeeded` ENUM('yes', 'no') NOT NULL DEFAULT 'no';

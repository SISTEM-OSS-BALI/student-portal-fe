/*
  Warnings:

  - You are about to drop the `documents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `documents`;

-- CreateTable
CREATE TABLE `documents-management` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `internalCode` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `translationNeeded` ENUM('yes', 'no') NOT NULL DEFAULT 'no',
    `is_required` BOOLEAN NOT NULL DEFAULT false,
    `autoRenamePattern` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

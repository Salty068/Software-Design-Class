-- CreateTable
CREATE TABLE `assignments` (
    `id` VARCHAR(191) NOT NULL,
    `volunteerId` VARCHAR(100) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `createdAtMs` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),

    INDEX `assignments_volunteerId_idx`(`volunteerId`),
    INDEX `assignments_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notices` (
    `id` VARCHAR(191) NOT NULL,
    `volunteerId` VARCHAR(100) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `body` TEXT NULL,
    `type` ENUM('info', 'success', 'warn', 'error') NOT NULL DEFAULT 'info',
    `createdAtMs` BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),

    INDEX `notices_volunteerId_idx`(`volunteerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_volunteerId_fkey` FOREIGN KEY (`volunteerId`) REFERENCES `user_profiles`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notices` ADD CONSTRAINT `notices_volunteerId_fkey` FOREIGN KEY (`volunteerId`) REFERENCES `user_profiles`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

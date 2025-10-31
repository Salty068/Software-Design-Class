-- CreateTable
CREATE TABLE `user_credentials` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_credentials_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(100) NOT NULL,
    `fullName` VARCHAR(50) NOT NULL,
    `address1` VARCHAR(100) NOT NULL,
    `address2` VARCHAR(100) NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` CHAR(2) NOT NULL,
    `zipCode` VARCHAR(10) NOT NULL,
    `skills` JSON NOT NULL,
    `preferences` VARCHAR(500) NULL,
    `availability` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `states` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stateCode` CHAR(2) NOT NULL,
    `stateName` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `states_stateCode_key`(`stateCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_details` (
    `id` VARCHAR(191) NOT NULL,
    `eventName` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `location` VARCHAR(200) NOT NULL,
    `requiredSkills` JSON NOT NULL,
    `urgency` VARCHAR(20) NOT NULL,
    `eventDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `volunteer_history` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(100) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `participationStatus` VARCHAR(50) NOT NULL,
    `hoursVolunteered` DOUBLE NULL,
    `feedback` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user_credentials`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `volunteer_history` ADD CONSTRAINT `volunteer_history_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user_profiles`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `volunteer_history` ADD CONSTRAINT `volunteer_history_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

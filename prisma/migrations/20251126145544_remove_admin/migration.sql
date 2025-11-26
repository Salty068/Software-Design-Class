/*
  Warnings:

  - The values [Admin] on the enum `user_profiles_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `user_profiles` MODIFY `role` ENUM('Volunteer', 'Organizer') NOT NULL DEFAULT 'Volunteer';

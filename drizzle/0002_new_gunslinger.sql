ALTER TABLE `boxes` ADD `normalPrice` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `boxes` ADD `discountedPrice` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `boxes` ADD `pickupTimeStart` varchar(5);--> statement-breakpoint
ALTER TABLE `boxes` ADD `pickupTimeEnd` varchar(5);--> statement-breakpoint
ALTER TABLE `reservations` ADD `quantity` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `boxes` DROP COLUMN `price`;
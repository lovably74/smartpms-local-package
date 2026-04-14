CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wbsItemId` int NOT NULL,
	`uploaderId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(100),
	`fileSize` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issue_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`uploaderId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(100),
	`fileSize` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `issue_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issue_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `issue_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`wbsItemId` int,
	`title` varchar(300) NOT NULL,
	`description` text,
	`type` enum('risk','defect','request','question','other') NOT NULL DEFAULT 'other',
	`priority` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`reporterId` int NOT NULL,
	`assigneeId` int,
	`dueDate` date,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('issue_created','issue_comment','issue_status_changed','issue_assigned','wbs_updated') NOT NULL,
	`title` varchar(300) NOT NULL,
	`content` text,
	`relatedIssueId` int,
	`relatedWbsId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`emailSent` boolean NOT NULL DEFAULT false,
	`smsSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`status` enum('active','completed','paused') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `wbs_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`wbsCode` varchar(50) NOT NULL,
	`level` enum('major','middle','minor','activity','task') NOT NULL,
	`parentId` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`name` varchar(300) NOT NULL,
	`category` varchar(50),
	`assigneeId` int,
	`managerId` int,
	`planStart` date,
	`planEnd` date,
	`actualStart` date,
	`actualEnd` date,
	`progress` float NOT NULL DEFAULT 0,
	`predecessorCode` varchar(50),
	`successorCode` varchar(50),
	`status` enum('not_started','in_progress','completed','delayed','on_hold') NOT NULL DEFAULT 'not_started',
	`workType` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wbs_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);
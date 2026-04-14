mysqldump: [Warning] Using a password on the command line interface can be insecure.
-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: gateway05.us-east-1.prod.aws.tidbcloud.com    Database: 4FU6dMJVeQsGJmPe9gzfzF
-- ------------------------------------------------------
-- Server version	8.0.11-TiDB-v7.5.6-serverless

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` text NOT NULL,
  `created_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=239620;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
INSERT INTO `__drizzle_migrations` VALUES (1,'814a08e40d7fc2bcfd458759d18319198ca8ae394f2fa15617a78678e9c9c93b',1775093130898),(2,'2345754e84e09502f6a7f6647e1df5a162ad69c3e04b01e66790f9411e14003e',1775093276849);
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `wbsItemId` int NOT NULL,
  `uploaderId` int NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `fileKey` varchar(500) NOT NULL,
  `fileUrl` text NOT NULL,
  `mimeType` varchar(100) DEFAULT NULL,
  `fileSize` bigint DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachments`
--

LOCK TABLES `attachments` WRITE;
/*!40000 ALTER TABLE `attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `issue_attachments`
--

DROP TABLE IF EXISTS `issue_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `issue_attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `issueId` int NOT NULL,
  `uploaderId` int NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `fileKey` varchar(500) NOT NULL,
  `fileUrl` text NOT NULL,
  `mimeType` varchar(100) DEFAULT NULL,
  `fileSize` bigint DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issue_attachments`
--

LOCK TABLES `issue_attachments` WRITE;
/*!40000 ALTER TABLE `issue_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `issue_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `issue_comments`
--

DROP TABLE IF EXISTS `issue_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `issue_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `issueId` int NOT NULL,
  `authorId` int NOT NULL,
  `content` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issue_comments`
--

LOCK TABLES `issue_comments` WRITE;
/*!40000 ALTER TABLE `issue_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `issue_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `issues`
--

DROP TABLE IF EXISTS `issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `issues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `projectId` int NOT NULL,
  `wbsItemId` int DEFAULT NULL,
  `title` varchar(300) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('risk','defect','request','question','other') NOT NULL DEFAULT 'other',
  `priority` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
  `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `reporterId` int NOT NULL,
  `assigneeId` int DEFAULT NULL,
  `dueDate` date DEFAULT NULL,
  `resolvedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=60001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issues`
--

LOCK TABLES `issues` WRITE;
/*!40000 ALTER TABLE `issues` DISABLE KEYS */;
INSERT INTO `issues` VALUES (1,1,125,'가설울타리 설치 지연','자재 납품 지연으로 인한 가설울타리 설치 일정 지연','risk','high','open',1,2,NULL,NULL,'2026-04-02 01:36:25','2026-04-02 01:36:25'),(2,1,126,'지하 배수 불량','집중호우로 인한 지하 배수 불량 발생','defect','critical','in_progress',2,3,NULL,NULL,'2026-04-02 01:36:25','2026-04-02 01:36:25'),(3,1,127,'도면 변경 요청','발주처 요청에 의한 평면 도면 변경','request','medium','open',3,4,NULL,NULL,'2026-04-02 01:36:25','2026-04-02 01:36:25'),(4,1,128,'안전 난간 설치 누락','3층 개구부 안전 난간 미설치 확인','defect','high','resolved',4,5,NULL,NULL,'2026-04-02 01:36:26','2026-04-02 01:36:26'),(5,1,129,'콘크리트 타설 품질 검사','지하 2층 콘크리트 타설 후 품질 검사 필요','question','medium','closed',5,6,NULL,NULL,'2026-04-02 01:36:26','2026-04-02 01:36:26'),(30001,1,127,'완료','금일완료처리','other','medium','open',30001,1,'2026-04-03',NULL,'2026-04-03 07:44:20','2026-04-03 07:44:20');
/*!40000 ALTER TABLE `issues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `type` enum('issue_created','issue_comment','issue_status_changed','issue_assigned','wbs_updated') NOT NULL,
  `title` varchar(300) NOT NULL,
  `content` text DEFAULT NULL,
  `relatedIssueId` int DEFAULT NULL,
  `relatedWbsId` int DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `emailSent` tinyint(1) NOT NULL DEFAULT '0',
  `smsSent` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,'issue_created','새 이슈 배정: 완료','DaeYoung Lee님이 이슈를 등록하고 귀하를 담당자로 지정했습니다.\n이슈: 완료',30001,127,0,0,0,'2026-04-03 07:44:20');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','completed','paused') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `projects_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'PDC-2025','판교 데이터센터 신축','판교 데이터센터 신축 공사 프로젝트','active','2026-04-02 01:34:53','2026-04-02 01:34:53'),(2,'ILC-2025','인천 물류센터 증축','인천 물류센터 증축 공사 프로젝트','active','2026-04-02 01:34:53','2026-04-02 01:34:53'),(3,'SOF-2024','서울 오피스 리모델링','서울 오피스 리모델링 프로젝트','active','2026-04-02 01:34:53','2026-04-02 01:34:53');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openId` varchar(64) NOT NULL,
  `name` text DEFAULT NULL,
  `email` varchar(320) DEFAULT NULL,
  `loginMethod` varchar(64) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `users_openId_unique` (`openId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=270001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'demo-kim','김현장','kim@smartpms.com',NULL,'admin','2026-04-02 01:36:22','2026-04-02 01:36:22','2026-04-02 01:36:22',NULL),(2,'demo-lee','이관리','lee@smartpms.com',NULL,'user','2026-04-02 01:36:23','2026-04-02 01:36:23','2026-04-02 01:36:23',NULL),(3,'demo-park','박공무','park@smartpms.com',NULL,'user','2026-04-02 01:36:23','2026-04-02 01:36:23','2026-04-02 01:36:23',NULL),(4,'demo-choi','최시공','choi@smartpms.com',NULL,'user','2026-04-02 01:36:23','2026-04-02 01:36:23','2026-04-02 01:36:23',NULL),(5,'demo-jung','정안전','jung@smartpms.com',NULL,'user','2026-04-02 01:36:23','2026-04-02 01:36:23','2026-04-02 01:36:23',NULL),(6,'demo-han','한설비','han@smartpms.com',NULL,'user','2026-04-02 01:36:23','2026-04-02 01:36:23','2026-04-02 01:36:23',NULL),(7,'demo-oh','오구조','oh@smartpms.com',NULL,'user','2026-04-02 01:36:24','2026-04-02 01:36:24','2026-04-02 01:36:24',NULL),(30001,'9pt4rZpkxjCMp8ZULD5CTW','DaeYoung Lee','lovably74@gmail.com','google','admin','2026-04-02 01:53:00','2026-04-06 00:58:30','2026-04-06 00:58:31',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wbs_items`
--

DROP TABLE IF EXISTS `wbs_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wbs_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `projectId` int NOT NULL,
  `wbsCode` varchar(50) NOT NULL,
  `level` enum('major','middle','minor','activity','task') NOT NULL,
  `parentId` int DEFAULT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `name` varchar(300) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `assigneeId` int DEFAULT NULL,
  `managerId` int DEFAULT NULL,
  `planStart` date DEFAULT NULL,
  `planEnd` date DEFAULT NULL,
  `actualStart` date DEFAULT NULL,
  `actualEnd` date DEFAULT NULL,
  `progress` float NOT NULL DEFAULT '0',
  `predecessorCode` varchar(50) DEFAULT NULL,
  `successorCode` varchar(50) DEFAULT NULL,
  `status` enum('not_started','in_progress','completed','delayed','on_hold') NOT NULL DEFAULT 'not_started',
  `workType` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wbs_items`
--

LOCK TABLES `wbs_items` WRITE;
/*!40000 ALTER TABLE `wbs_items` DISABLE KEYS */;
INSERT INTO `wbs_items` VALUES (1,1,'M-착공준비','major',NULL,1,'착공준비','공통',3,NULL,'2026-01-02','2026-01-11',NULL,NULL,82.84,NULL,NULL,'in_progress',NULL,NULL,'2026-04-02 01:35:29','2026-04-03 07:26:09'),(2,1,'M-가설공사','major',NULL,2,'가설공사','공통',4,NULL,'2026-01-12','2026-03-02',NULL,NULL,6.25,NULL,NULL,'in_progress',NULL,NULL,'2026-04-02 01:35:29','2026-04-03 09:20:23'),(3,1,'M-부지조성','major',NULL,3,'부지조성','공통',NULL,NULL,'2026-03-01','2026-05-20',NULL,NULL,2.22,NULL,NULL,'in_progress',NULL,NULL,'2026-04-02 01:35:30','2026-04-03 07:23:20'),(4,1,'M-기초공사','major',NULL,4,'기초공사','공통',NULL,NULL,'2026-05-21','2026-07-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:30','2026-04-03 07:23:20'),(5,1,'M-골조공사','major',NULL,5,'골조공사','공통',NULL,NULL,'2026-07-21','2027-11-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:30','2026-04-03 07:23:20'),(6,1,'M-방수공사','major',NULL,6,'방수공사','공통',NULL,NULL,'2027-09-01','2027-11-10',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:30','2026-04-03 07:23:20'),(7,1,'M-조적공사','major',NULL,7,'조적공사','공통',NULL,NULL,'2027-10-01','2028-01-15',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:31','2026-04-03 07:23:20'),(8,1,'M-미장공사','major',NULL,8,'미장공사','공통',NULL,NULL,'2027-12-01','2028-03-10',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:31','2026-04-03 07:23:20'),(9,1,'M-내장공사','major',NULL,9,'내장공사','공통',NULL,NULL,'2028-01-01','2028-04-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:31','2026-04-03 07:23:20'),(10,1,'M-도장공사','major',NULL,10,'도장공사','공통',NULL,NULL,'2028-04-01','2028-06-15',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:31','2026-04-03 07:23:20'),(11,1,'M-창호공사','major',NULL,11,'창호공사','공통',NULL,NULL,'2027-12-01','2028-03-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:31','2026-04-03 07:23:20'),(12,1,'M-건축외장','major',NULL,12,'건축외장','공통',NULL,NULL,'2028-01-01','2028-04-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:32','2026-04-03 07:23:20'),(13,1,'M-기계설비','major',NULL,13,'기계설비','공통',NULL,NULL,'2027-01-01','2028-05-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:32','2026-04-03 07:23:20'),(14,1,'M-전기공사','major',NULL,14,'전기공사','공통',NULL,NULL,'2027-01-01','2028-05-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:32','2026-04-03 07:23:20'),(15,1,'M-소방공사','major',NULL,15,'소방공사','공통',NULL,NULL,'2027-01-01','2028-03-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:32','2026-04-03 07:23:20'),(16,1,'M-정보통신','major',NULL,16,'정보통신','공통',NULL,NULL,'2028-01-01','2028-06-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:33','2026-04-03 07:23:20'),(17,1,'M-승강기공사','major',NULL,17,'승강기공사','공통',NULL,NULL,'2027-12-01','2028-05-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:33','2026-04-03 07:23:20'),(18,1,'M-외부토목','major',NULL,18,'외부토목','공통',NULL,NULL,'2028-05-01','2028-07-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:33','2026-04-03 07:23:20'),(19,1,'M-조경공사','major',NULL,19,'조경공사','공통',NULL,NULL,'2028-07-01','2028-10-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:33','2026-04-03 07:23:20'),(20,1,'M-준공단계','major',NULL,20,'준공단계','공통',NULL,NULL,'2028-10-01','2029-01-01',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:33','2026-04-03 07:23:20'),(21,1,'MM-착공준비-현장개설','middle',1,1,'현장개설','공통',2,NULL,'2026-01-02','2026-01-11',NULL,NULL,82.84,NULL,NULL,'in_progress',NULL,NULL,'2026-04-02 01:35:34','2026-04-03 07:26:09'),(22,1,'MM-가설공사-가설울타리','middle',2,2,'가설울타리','공통',1,NULL,'2026-01-12','2026-01-22',NULL,NULL,25,NULL,NULL,'in_progress',NULL,NULL,'2026-04-02 01:35:34','2026-04-03 09:20:23'),(23,1,'MM-가설공사-가설전기','middle',2,2,'가설전기','공통',6,NULL,'2026-01-23','2026-01-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:34','2026-04-03 07:24:02'),(24,1,'MM-가설공사-가설급배수','middle',2,2,'가설급배수','공통',2,NULL,'2026-02-01','2026-02-12',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:35','2026-04-03 07:24:26'),(25,1,'MM-가설공사-현장사무소','middle',2,2,'현장사무소','공통',1,NULL,'2026-02-13','2026-03-02',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:35','2026-04-03 07:24:43'),(26,1,'MM-부지조성-벌개제근','middle',3,3,'벌개제근','공통',NULL,NULL,'2026-03-01','2026-03-15',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:35','2026-04-03 07:23:20'),(27,1,'MM-부지조성-절성토','middle',3,3,'절성토','공통',NULL,NULL,'2026-03-16','2026-04-10',NULL,NULL,6.67,NULL,NULL,'in_progress',NULL,NULL,'2026-04-02 01:35:35','2026-04-03 07:23:20'),(28,1,'MM-부지조성-흙막이','middle',3,3,'흙막이','공통',NULL,NULL,'2026-04-11','2026-05-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:35','2026-04-03 07:23:20'),(29,1,'MM-기초공사-말뚝공사','middle',4,4,'말뚝공사','공통',NULL,NULL,'2026-05-21','2026-06-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:36','2026-04-03 07:23:20'),(30,1,'MM-기초공사-기초슬라브','middle',4,4,'기초슬라브','공통',NULL,NULL,'2026-06-21','2026-07-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:36','2026-04-03 07:23:20'),(31,1,'MM-골조공사-지하층골조','middle',5,5,'지하층골조','공통',NULL,NULL,'2026-07-21','2026-10-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:36','2026-04-03 07:23:20'),(32,1,'MM-골조공사-지상층골조','middle',5,5,'지상층골조','공통',NULL,NULL,'2026-11-01','2027-11-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:36','2026-04-03 07:23:20'),(33,1,'MM-방수공사-지하방수','middle',6,6,'지하방수','공통',NULL,NULL,'2027-09-01','2027-10-05',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:37','2026-04-03 07:23:20'),(34,1,'MM-방수공사-옥상방수','middle',6,6,'옥상방수','공통',NULL,NULL,'2027-10-06','2027-11-10',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:37','2026-04-03 07:23:20'),(35,1,'MM-조적공사-내벽조적','middle',7,7,'내벽조적','공통',NULL,NULL,'2027-10-01','2028-01-15',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:37','2026-04-03 07:23:20'),(36,1,'MM-미장공사-내부미장','middle',8,8,'내부미장','공통',NULL,NULL,'2027-12-01','2028-03-10',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:37','2026-04-03 07:23:20'),(37,1,'MM-내장공사-천장공사','middle',9,9,'천장공사','공통',NULL,NULL,'2028-01-01','2028-03-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:37','2026-04-03 07:23:20'),(38,1,'MM-내장공사-바닥공사','middle',9,9,'바닥공사','공통',NULL,NULL,'2028-02-01','2028-04-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:38','2026-04-03 07:23:20'),(39,1,'MM-도장공사-내부도장','middle',10,10,'내부도장','공통',NULL,NULL,'2028-04-01','2028-06-15',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:38','2026-04-03 07:23:20'),(40,1,'MM-창호공사-외부창호','middle',11,11,'외부창호','공통',NULL,NULL,'2027-12-01','2028-03-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:38','2026-04-03 07:23:20'),(41,1,'MM-건축외장-외벽마감','middle',12,12,'외벽마감','공통',NULL,NULL,'2028-01-01','2028-04-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:38','2026-04-03 07:23:20'),(42,1,'MM-기계설비-급배수설비','middle',13,13,'급배수설비','공통',NULL,NULL,'2027-01-01','2027-09-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:39','2026-04-03 07:23:20'),(43,1,'MM-기계설비-난방설비','middle',13,13,'난방설비','공통',NULL,NULL,'2028-01-01','2028-05-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:39','2026-04-03 07:23:20'),(44,1,'MM-전기공사-수변전설비','middle',14,14,'수변전설비','공통',NULL,NULL,'2027-01-01','2027-09-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:39','2026-04-03 07:23:20'),(45,1,'MM-전기공사-세대전기','middle',14,14,'세대전기','공통',NULL,NULL,'2027-10-01','2028-05-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:39','2026-04-03 07:23:20'),(46,1,'MM-소방공사-소화설비','middle',15,15,'소화설비','공통',NULL,NULL,'2027-01-01','2028-03-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:39','2026-04-03 07:23:20'),(47,1,'MM-정보통신-통신설비','middle',16,16,'통신설비','공통',NULL,NULL,'2028-01-01','2028-06-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:40','2026-04-03 07:23:20'),(48,1,'MM-승강기공사-엘리베이터','middle',17,17,'엘리베이터','공통',NULL,NULL,'2027-12-01','2028-05-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:40','2026-04-03 07:23:20'),(49,1,'MM-외부토목-단지포장','middle',18,18,'단지포장','공통',NULL,NULL,'2028-05-01','2028-07-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:40','2026-04-03 07:23:20'),(50,1,'MM-조경공사-식재공사','middle',19,19,'식재공사','공통',NULL,NULL,'2028-07-01','2028-10-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:40','2026-04-03 07:23:20'),(51,1,'MM-준공단계-준공검사','middle',20,20,'준공검사','공통',NULL,NULL,'2028-10-01','2028-12-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:41','2026-04-03 07:23:20'),(52,1,'MM-준공단계-운영이관','middle',20,20,'운영이관','공통',NULL,NULL,'2028-12-21','2029-01-01',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:41','2026-04-03 07:23:20'),(53,1,'MN-착공준비-현장개설-현장조사','minor',21,21,'현장조사','공통',1,NULL,'2026-01-02','2026-01-07',NULL,NULL,65.67,NULL,NULL,'in_progress',NULL,NULL,'2026-04-02 01:35:41','2026-04-03 07:23:19'),(54,1,'MN-착공준비-현장개설-인허가연계','minor',21,21,'인허가연계','공통',3,NULL,'2026-01-08','2026-01-11',NULL,NULL,100,NULL,NULL,'completed',NULL,NULL,'2026-04-02 01:35:41','2026-04-03 07:26:09'),(55,1,'MN-가설공사-가설울타리-외곽가설','minor',22,22,'외곽가설','공통',1,NULL,'2026-01-12','2026-01-16',NULL,NULL,50,NULL,NULL,'in_progress',NULL,NULL,'2026-04-02 01:35:42','2026-04-03 09:20:23'),(56,1,'MN-가설공사-가설울타리-출입통제','minor',22,22,'출입통제','공통',NULL,NULL,'2026-01-17','2026-01-22',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:42','2026-04-03 07:23:19'),(57,1,'MN-가설공사-가설전기-임시수전','minor',23,23,'임시수전','공통',6,NULL,'2026-01-23','2026-01-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:42','2026-04-03 07:24:10'),(58,1,'MN-가설공사-가설급배수-임시급수','minor',24,24,'임시급수','공통',2,NULL,'2026-02-01','2026-02-06',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:42','2026-04-03 07:24:30'),(59,1,'MN-가설공사-가설급배수-임시배수','minor',24,24,'임시배수','공통',NULL,NULL,'2026-02-07','2026-02-12',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:43','2026-04-03 07:23:19'),(60,1,'MN-가설공사-현장사무소-사무동','minor',25,25,'사무동','공통',1,NULL,'2026-02-13','2026-02-21',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:43','2026-04-03 07:24:49'),(61,1,'MN-가설공사-현장사무소-근로자시설','minor',25,25,'근로자시설','공통',4,NULL,'2026-02-22','2026-03-02',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:43','2026-04-03 07:25:05'),(62,1,'MN-부지조성-벌개제근-지장물제거','minor',26,26,'지장물제거','공통',NULL,NULL,'2026-03-01','2026-03-15',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:43','2026-04-03 07:23:19'),(63,1,'MN-부지조성-절성토-토공','minor',27,27,'토공','공통',NULL,NULL,'2026-03-16','2026-04-10',NULL,NULL,6.67,NULL,NULL,'in_progress',NULL,NULL,'2026-04-02 01:35:44','2026-04-03 07:23:19'),(64,1,'MN-부지조성-흙막이-CIP/SCW','minor',28,28,'CIP/SCW','공통',NULL,NULL,'2026-04-11','2026-05-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:44','2026-04-03 07:23:19'),(65,1,'MN-기초공사-말뚝공사-PHC파일','minor',29,29,'PHC파일','공통',NULL,NULL,'2026-05-21','2026-06-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:44','2026-04-03 07:23:19'),(66,1,'MN-기초공사-기초슬라브-매트기초','minor',30,30,'매트기초','공통',NULL,NULL,'2026-06-21','2026-07-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:44','2026-04-03 07:23:19'),(67,1,'MN-골조공사-지하층골조-지하구조체','minor',31,31,'지하구조체','공통',NULL,NULL,'2026-07-21','2026-10-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:44','2026-04-03 07:23:19'),(68,1,'MN-골조공사-지상층골조-지상구조체','minor',32,32,'지상구조체','공통',NULL,NULL,'2026-11-01','2027-11-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:45','2026-04-03 07:23:19'),(69,1,'MN-방수공사-지하방수-외벽방수','minor',33,33,'외벽방수','공통',NULL,NULL,'2027-09-01','2027-10-05',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:45','2026-04-03 07:23:19'),(70,1,'MN-방수공사-옥상방수-지붕방수','minor',34,34,'지붕방수','공통',NULL,NULL,'2027-10-06','2027-11-10',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:45','2026-04-03 07:23:19'),(71,1,'MN-조적공사-내벽조적-블록조적','minor',35,35,'블록조적','공통',NULL,NULL,'2027-10-01','2028-01-15',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:45','2026-04-03 07:23:19'),(72,1,'MN-미장공사-내부미장-벽체미장','minor',36,36,'벽체미장','공통',NULL,NULL,'2027-12-01','2028-03-10',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:46','2026-04-03 07:23:19'),(73,1,'MN-내장공사-천장공사-경량철골천장','minor',37,37,'경량철골천장','공통',NULL,NULL,'2028-01-01','2028-03-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:46','2026-04-03 07:23:19'),(74,1,'MN-내장공사-바닥공사-온돌바닥','minor',38,38,'온돌바닥','공통',NULL,NULL,'2028-02-01','2028-04-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:46','2026-04-03 07:23:19'),(75,1,'MN-도장공사-내부도장-벽체도장','minor',39,39,'벽체도장','공통',NULL,NULL,'2028-04-01','2028-06-15',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:46','2026-04-03 07:23:19'),(76,1,'MN-창호공사-외부창호-알루미늄창호','minor',40,40,'알루미늄창호','공통',NULL,NULL,'2027-12-01','2028-03-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:46','2026-04-03 07:23:19'),(77,1,'MN-건축외장-외벽마감-드라이비트','minor',41,41,'드라이비트','공통',NULL,NULL,'2028-01-01','2028-04-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:47','2026-04-03 07:23:19'),(78,1,'MN-기계설비-급배수설비-급수배관','minor',42,42,'급수배관','공통',NULL,NULL,'2027-01-01','2027-09-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:47','2026-04-03 07:23:19'),(79,1,'MN-기계설비-난방설비-세대난방','minor',43,43,'세대난방','공통',NULL,NULL,'2028-01-01','2028-05-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:47','2026-04-03 07:23:19'),(80,1,'MN-전기공사-수변전설비-변압기','minor',44,44,'변압기','공통',NULL,NULL,'2027-01-01','2027-09-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:47','2026-04-03 07:23:19'),(81,1,'MN-전기공사-세대전기-세대배선','minor',45,45,'세대배선','공통',NULL,NULL,'2027-10-01','2028-05-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:48','2026-04-03 07:23:19'),(82,1,'MN-소방공사-소화설비-스프링클러','minor',46,46,'스프링클러','공통',NULL,NULL,'2027-01-01','2028-03-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:48','2026-04-03 07:23:19'),(83,1,'MN-정보통신-통신설비-통신배관','minor',47,47,'통신배관','공통',NULL,NULL,'2028-01-01','2028-06-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:48','2026-04-03 07:23:19'),(84,1,'MN-승강기공사-엘리베이터-승강기설치','minor',48,48,'승강기설치','공통',NULL,NULL,'2027-12-01','2028-05-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:48','2026-04-03 07:23:19'),(85,1,'MN-외부토목-단지포장-아스팔트포장','minor',49,49,'아스팔트포장','공통',NULL,NULL,'2028-05-01','2028-07-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:48','2026-04-03 07:23:19'),(86,1,'MN-조경공사-식재공사-교목식재','minor',50,50,'교목식재','공통',NULL,NULL,'2028-07-01','2028-10-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:49','2026-04-03 07:23:19'),(87,1,'MN-준공단계-준공검사-사용검사','minor',51,51,'사용검사','공통',NULL,NULL,'2028-10-01','2028-12-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:49','2026-04-03 07:23:19'),(88,1,'MN-준공단계-운영이관-관리이관','minor',52,52,'관리이관','공통',NULL,NULL,'2028-12-21','2029-01-01',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:49','2026-04-03 07:23:19'),(89,1,'A-착공준비-현장개설-현장조사-착공 전 현황조사','activity',53,53,'착공 전 현황조사','공통',1,NULL,'2026-01-02','2026-01-07',NULL,NULL,65.67,NULL,NULL,'in_progress',NULL,NULL,'2026-04-02 01:35:50','2026-04-03 07:23:19'),(90,1,'A-착공준비-현장개설-인허가연계-착공신고','activity',54,54,'착공신고','공통',3,NULL,'2026-01-08','2026-01-11',NULL,NULL,100,NULL,NULL,'completed',NULL,NULL,'2026-04-02 01:35:50','2026-04-03 07:26:08'),(91,1,'A-가설공사-가설울타리-외곽가설-현장 경계구획','activity',55,55,'현장 경계구획','공통',1,NULL,'2026-01-12','2026-01-16',NULL,NULL,50,NULL,NULL,'in_progress',NULL,NULL,'2026-04-02 01:35:50','2026-04-03 09:20:23'),(92,1,'A-가설공사-가설울타리-출입통제-출입구 조성','activity',56,56,'출입구 조성','공통',NULL,NULL,'2026-01-17','2026-01-22',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:50','2026-04-03 07:23:19'),(93,1,'A-가설공사-가설전기-임시수전-가설전기 구축','activity',57,57,'가설전기 구축','공통',6,NULL,'2026-01-23','2026-01-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:50','2026-04-03 07:24:17'),(94,1,'A-가설공사-가설급배수-임시급수-현장 용수공급','activity',58,58,'현장 용수공급','공통',2,NULL,'2026-02-01','2026-02-06',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:51','2026-04-03 07:24:36'),(95,1,'A-가설공사-가설급배수-임시배수-현장 배수체계','activity',59,59,'현장 배수체계','공통',NULL,NULL,'2026-02-07','2026-02-12',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:51','2026-04-03 07:23:19'),(96,1,'A-가설공사-현장사무소-사무동-현장 운영시설','activity',60,60,'현장 운영시설','공통',1,NULL,'2026-02-13','2026-02-21',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:51','2026-04-03 07:24:54'),(97,1,'A-가설공사-현장사무소-근로자시설-복지시설 구축','activity',61,61,'복지시설 구축','공통',4,NULL,'2026-02-22','2026-03-02',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:51','2026-04-03 07:25:08'),(98,1,'A-부지조성-벌개제근-지장물제거-부지정리','activity',62,62,'부지정리','공통',NULL,NULL,'2026-03-01','2026-03-15',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:52','2026-04-03 07:23:19'),(99,1,'A-부지조성-절성토-토공-대지정지','activity',63,63,'대지정지','공통',NULL,NULL,'2026-03-16','2026-04-10',NULL,NULL,6.67,NULL,NULL,'in_progress',NULL,NULL,'2026-04-02 01:35:52','2026-04-03 07:23:19'),(100,1,'A-부지조성-흙막이-CIP/SCW-굴착 준비','activity',64,64,'굴착 준비','공통',NULL,NULL,'2026-04-11','2026-05-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:52','2026-04-03 07:23:19'),(101,1,'A-기초공사-말뚝공사-PHC파일-파일 시공','activity',65,65,'파일 시공','공통',NULL,NULL,'2026-05-21','2026-06-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:52','2026-04-03 07:23:19'),(102,1,'A-기초공사-기초슬라브-매트기초-기초타설','activity',66,66,'기초타설','공통',NULL,NULL,'2026-06-21','2026-07-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:52','2026-04-03 07:23:19'),(103,1,'A-골조공사-지하층골조-지하구조체-지하층 시공','activity',67,67,'지하층 시공','공통',NULL,NULL,'2026-07-21','2026-10-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:53','2026-04-03 07:23:19'),(104,1,'A-골조공사-지상층골조-지상구조체-지상층 시공','activity',68,68,'지상층 시공','공통',NULL,NULL,'2026-11-01','2027-11-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:53','2026-04-03 07:23:19'),(105,1,'A-방수공사-지하방수-외벽방수-지하 방수 시공','activity',69,69,'지하 방수 시공','공통',NULL,NULL,'2027-09-01','2027-10-05',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:53','2026-04-03 07:23:19'),(106,1,'A-방수공사-옥상방수-지붕방수-옥상 방수 시공','activity',70,70,'옥상 방수 시공','공통',NULL,NULL,'2027-10-06','2027-11-10',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:53','2026-04-03 07:23:19'),(107,1,'A-조적공사-내벽조적-블록조적-내벽 시공','activity',71,71,'내벽 시공','공통',NULL,NULL,'2027-10-01','2028-01-15',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:54','2026-04-03 07:23:19'),(108,1,'A-미장공사-내부미장-벽체미장-내부 미장 시공','activity',72,72,'내부 미장 시공','공통',NULL,NULL,'2027-12-01','2028-03-10',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:54','2026-04-03 07:23:19'),(109,1,'A-내장공사-천장공사-경량철골천장-천장 시공','activity',73,73,'천장 시공','공통',NULL,NULL,'2028-01-01','2028-03-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:54','2026-04-03 07:23:19'),(110,1,'A-내장공사-바닥공사-온돌바닥-바닥 시공','activity',74,74,'바닥 시공','공통',NULL,NULL,'2028-02-01','2028-04-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:54','2026-04-03 07:23:19'),(111,1,'A-도장공사-내부도장-벽체도장-내부 도장','activity',75,75,'내부 도장','공통',NULL,NULL,'2028-04-01','2028-06-15',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:55','2026-04-03 07:23:19'),(112,1,'A-창호공사-외부창호-알루미늄창호-창호 설치','activity',76,76,'창호 설치','공통',NULL,NULL,'2027-12-01','2028-03-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:55','2026-04-03 07:23:19'),(113,1,'A-건축외장-외벽마감-드라이비트-외벽 마감 시공','activity',77,77,'외벽 마감 시공','공통',NULL,NULL,'2028-01-01','2028-04-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:55','2026-04-03 07:23:19'),(114,1,'A-기계설비-급배수설비-급수배관-급수 배관 시공','activity',78,78,'급수 배관 시공','공통',NULL,NULL,'2027-01-01','2027-09-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:55','2026-04-03 07:23:19'),(115,1,'A-기계설비-난방설비-세대난방-세대 난방 구축','activity',79,79,'세대 난방 구축','공통',NULL,NULL,'2028-01-01','2028-05-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:55','2026-04-03 07:23:19'),(116,1,'A-전기공사-수변전설비-변압기-수변전 설비 설치','activity',80,80,'수변전 설비 설치','공통',NULL,NULL,'2027-01-01','2027-09-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:56','2026-04-03 07:23:19'),(117,1,'A-전기공사-세대전기-세대배선-세대 전기 배선','activity',81,81,'세대 전기 배선','공통',NULL,NULL,'2027-10-01','2028-05-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:56','2026-04-03 07:23:19'),(118,1,'A-소방공사-소화설비-스프링클러-스프링클러 시공','activity',82,82,'스프링클러 시공','공통',NULL,NULL,'2027-01-01','2028-03-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:56','2026-04-03 07:23:19'),(119,1,'A-정보통신-통신설비-통신배관-통신 배관 시공','activity',83,83,'통신 배관 시공','공통',NULL,NULL,'2028-01-01','2028-06-30',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:56','2026-04-03 07:23:19'),(120,1,'A-승강기공사-엘리베이터-승강기설치-승강기 설치','activity',84,84,'승강기 설치','공통',NULL,NULL,'2027-12-01','2028-05-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:57','2026-04-03 07:23:19'),(121,1,'A-외부토목-단지포장-아스팔트포장-단지 포장 시공','activity',85,85,'단지 포장 시공','공통',NULL,NULL,'2028-05-01','2028-07-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:57','2026-04-03 07:23:19'),(122,1,'A-조경공사-식재공사-교목식재-수목 식재','activity',86,86,'수목 식재','공통',NULL,NULL,'2028-07-01','2028-10-31',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:57','2026-04-03 07:23:19'),(123,1,'A-준공단계-준공검사-사용검사-입주자 점검 대응','activity',87,87,'입주자 점검 대응','공통',NULL,NULL,'2028-10-01','2028-12-20',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:57','2026-04-03 07:23:19'),(124,1,'A-준공단계-운영이관-관리이관-운영 이관','activity',88,88,'운영 이관','공통',NULL,NULL,'2028-12-21','2029-01-01',NULL,NULL,0,NULL,NULL,'not_started',NULL,NULL,'2026-04-02 01:35:57','2026-04-03 07:23:19'),(125,1,'A-01-01-01-001-01','task',89,89,'경계측량 실시','공통',1,NULL,'2026-01-02','2026-01-03','2026-04-03',NULL,53,NULL,'A-01-01-01-001-02','in_progress',NULL,NULL,'2026-04-02 01:35:58','2026-04-03 07:23:19'),(126,1,'A-01-01-01-001-02','task',89,89,'인접건물 현황조사','공통',1,NULL,'2026-01-04','2026-01-05','2026-04-03',NULL,44,'A-01-01-01-001-01','A-01-01-01-001-03','in_progress',NULL,NULL,'2026-04-02 01:35:58','2026-04-03 07:18:42'),(127,1,'A-01-01-01-001-03','task',89,89,'도로 및 지장물 조사','공통',1,NULL,'2026-01-06','2026-01-07','2026-04-02',NULL,100,'A-01-01-01-001-02','A-01-01-02-001-01','completed',NULL,NULL,'2026-04-02 01:35:58','2026-04-03 07:19:14'),(128,1,'A-01-01-02-001-01','task',90,90,'착공신고 서류 제출','공통',3,NULL,'2026-01-08','2026-01-09','2026-04-03',NULL,100,'A-01-01-01-001-03','A-01-01-02-001-02','completed',NULL,NULL,'2026-04-02 01:35:59','2026-04-03 07:26:03'),(129,1,'A-01-01-02-001-02','task',90,90,'관계기관 협의 완료','공통',3,NULL,'2026-01-10','2026-01-11','2026-04-03',NULL,100,'A-01-01-02-001-01','A-02-01-01-001-01','completed',NULL,NULL,'2026-04-02 01:35:59','2026-04-03 07:26:08'),(130,1,'A-02-01-01-001-01','task',91,91,'가설휀스 설치','공통',NULL,NULL,'2026-01-12','2026-01-14','2026-04-02',NULL,100,'A-01-01-02-001-02','A-02-01-01-001-02','completed',NULL,NULL,'2026-04-02 01:35:59','2026-04-03 09:20:22'),(131,1,'A-02-01-01-001-02','task',91,91,'현장 안내표지 설치','공통',NULL,NULL,'2026-01-15','2026-01-16',NULL,NULL,0,'A-02-01-01-001-01','A-02-01-02-001-01','not_started',NULL,NULL,'2026-04-02 01:35:59','2026-04-02 05:25:44'),(132,1,'A-02-01-02-001-01','task',92,92,'공사차량 출입문 설치','공통',NULL,NULL,'2026-01-17','2026-01-18',NULL,NULL,0,'A-02-01-01-001-02','A-02-01-02-001-02','not_started',NULL,NULL,'2026-04-02 01:35:59','2026-04-02 05:25:44'),(133,1,'A-02-01-02-001-02','task',92,92,'경비실 설치','공통',NULL,NULL,'2026-01-19','2026-01-20',NULL,NULL,0,'A-02-01-02-001-01','A-02-01-02-001-03','not_started',NULL,NULL,'2026-04-02 01:36:00','2026-04-02 05:25:44'),(134,1,'A-02-01-02-001-03','task',92,92,'출입 통제 시스템 설치','공통',NULL,NULL,'2026-01-21','2026-01-22',NULL,NULL,0,'A-02-01-02-001-02','A-02-02-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:00','2026-04-02 05:25:44'),(135,1,'A-02-02-01-001-01','task',93,93,'한전 인입 협의','공통',NULL,NULL,'2026-01-23','2026-01-25',NULL,NULL,0,'A-02-01-02-001-03','A-02-02-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:00','2026-04-02 05:25:45'),(136,1,'A-02-02-01-001-02','task',93,93,'분전반 설치','공통',NULL,NULL,'2026-01-26','2026-01-28',NULL,NULL,0,'A-02-02-01-001-01','A-02-02-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:00','2026-04-02 05:25:45'),(137,1,'A-02-02-01-001-03','task',93,93,'임시 배선 설치','공통',NULL,NULL,'2026-01-29','2026-01-31',NULL,NULL,0,'A-02-02-01-001-02','A-02-03-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:01','2026-04-02 05:25:45'),(138,1,'A-02-03-01-001-01','task',94,94,'상수도 인입','공통',NULL,NULL,'2026-02-01','2026-02-03',NULL,NULL,0,'A-02-02-01-001-03','A-02-03-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:01','2026-04-02 05:25:45'),(139,1,'A-02-03-01-001-02','task',94,94,'임시배관 설치','공통',NULL,NULL,'2026-02-04','2026-02-06',NULL,NULL,0,'A-02-03-01-001-01','A-02-03-02-001-01','not_started',NULL,NULL,'2026-04-02 01:36:01','2026-04-02 05:25:45'),(140,1,'A-02-03-02-001-01','task',95,95,'배수로 설치','공통',NULL,NULL,'2026-02-07','2026-02-09',NULL,NULL,0,'A-02-03-01-001-02','A-02-03-02-001-02','not_started',NULL,NULL,'2026-04-02 01:36:01','2026-04-02 05:25:46'),(141,1,'A-02-03-02-001-02','task',95,95,'집수정 설치','공통',NULL,NULL,'2026-02-10','2026-02-12',NULL,NULL,0,'A-02-03-02-001-01','A-02-04-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:01','2026-04-02 05:25:46'),(142,1,'A-02-04-01-001-01','task',96,96,'사무실 설치','공통',NULL,NULL,'2026-02-13','2026-02-15',NULL,NULL,0,'A-02-03-02-001-02','A-02-04-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:02','2026-04-02 05:25:46'),(143,1,'A-02-04-01-001-02','task',96,96,'회의실 설치','공통',NULL,NULL,'2026-02-16','2026-02-18',NULL,NULL,0,'A-02-04-01-001-01','A-02-04-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:02','2026-04-02 05:25:46'),(144,1,'A-02-04-01-001-03','task',96,96,'자재창고 설치','공통',NULL,NULL,'2026-02-19','2026-02-21',NULL,NULL,0,'A-02-04-01-001-02','A-02-04-02-001-01','not_started',NULL,NULL,'2026-04-02 01:36:02','2026-04-02 05:25:46'),(145,1,'A-02-04-02-001-01','task',97,97,'휴게실 설치','공통',NULL,NULL,'2026-02-22','2026-02-24',NULL,NULL,0,'A-02-04-01-001-03','A-02-04-02-001-02','not_started',NULL,NULL,'2026-04-02 01:36:02','2026-04-02 05:25:47'),(146,1,'A-02-04-02-001-02','task',97,97,'화장실 설치','공통',NULL,NULL,'2026-02-25','2026-02-27',NULL,NULL,0,'A-02-04-02-001-01','A-02-04-02-001-03','not_started',NULL,NULL,'2026-04-02 01:36:03','2026-04-02 05:25:47'),(147,1,'A-02-04-02-001-03','task',97,97,'탈의실 설치','공통',NULL,NULL,'2026-02-28','2026-03-02',NULL,NULL,0,'A-02-04-02-001-02','A-02-05-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:03','2026-04-02 05:25:47'),(148,1,'A-03-01-01-001-01','task',98,98,'수목 제거','공통',NULL,NULL,'2026-03-01','2026-03-05',NULL,NULL,0,'A-02-04-02-001-03','A-03-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:03','2026-04-02 05:25:47'),(149,1,'A-03-01-01-001-02','task',98,98,'폐기물 반출','공통',NULL,NULL,'2026-03-06','2026-03-10',NULL,NULL,0,'A-03-01-01-001-01','A-03-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:03','2026-04-02 05:25:48'),(150,1,'A-03-01-01-001-03','task',98,98,'지하 매설물 이설','공통',NULL,NULL,'2026-03-11','2026-03-15',NULL,NULL,0,'A-03-01-01-001-02','A-03-02-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:03','2026-04-02 05:25:48'),(151,1,'A-03-02-01-001-01','task',99,99,'절토 시행','공통',NULL,NULL,'2026-03-16','2026-03-25',NULL,NULL,0,'A-03-01-01-001-03','A-03-02-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:04','2026-04-02 05:25:48'),(152,1,'A-03-02-01-001-02','task',99,99,'성토 시행','공통',NULL,NULL,'2026-03-26','2026-04-05','2026-04-02',NULL,20,'A-03-02-01-001-01','A-03-02-01-001-03','in_progress',NULL,NULL,'2026-04-02 01:36:04','2026-04-02 06:20:41'),(153,1,'A-03-02-01-001-03','task',99,99,'다짐 완료','공통',NULL,NULL,'2026-04-06','2026-04-10',NULL,NULL,0,'A-03-02-01-001-02','A-03-03-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:04','2026-04-02 05:25:48'),(154,1,'A-03-03-01-001-01','task',100,100,'천공 위치 먹매김','공통',NULL,NULL,'2026-04-11','2026-04-15',NULL,NULL,0,'A-03-02-01-001-03','A-03-03-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:04','2026-04-02 05:25:49'),(155,1,'A-03-03-01-001-02','task',100,100,'천공 작업','공통',NULL,NULL,'2026-04-16','2026-04-30',NULL,NULL,0,'A-03-03-01-001-01','A-03-03-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:05','2026-04-02 05:25:49'),(156,1,'A-03-03-01-001-03','task',100,100,'CIP 타설','공통',NULL,NULL,'2026-05-01','2026-05-15',NULL,NULL,0,'A-03-03-01-001-02','A-03-03-01-001-04','not_started',NULL,NULL,'2026-04-02 01:36:05','2026-04-02 05:25:49'),(157,1,'A-03-03-01-001-04','task',100,100,'두부정리','공통',NULL,NULL,'2026-05-16','2026-05-20',NULL,NULL,0,'A-03-03-01-001-03','A-03-03-02-001-01','not_started',NULL,NULL,'2026-04-02 01:36:05','2026-04-02 05:25:49'),(158,1,'A-04-01-01-001-01','task',101,101,'파일 반입 및 검수','공통',NULL,NULL,'2026-05-21','2026-05-25',NULL,NULL,0,'A-03-03-01-001-04','A-04-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:05','2026-04-02 05:25:50'),(159,1,'A-04-01-01-001-02','task',101,101,'파일 항타','공통',NULL,NULL,'2026-05-26','2026-06-15',NULL,NULL,0,'A-04-01-01-001-01','A-04-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:06','2026-04-02 05:25:50'),(160,1,'A-04-01-01-001-03','task',101,101,'두부정리','공통',NULL,NULL,'2026-06-16','2026-06-20',NULL,NULL,0,'A-04-01-01-001-02','A-04-02-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:06','2026-04-02 05:25:50'),(161,1,'A-04-02-01-001-01','task',102,102,'버림콘크리트 타설','공통',NULL,NULL,'2026-06-21','2026-06-25',NULL,NULL,0,'A-04-01-01-001-03','A-04-02-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:06','2026-04-02 05:25:50'),(162,1,'A-04-02-01-001-02','task',102,102,'기초 철근 배근','공통',NULL,NULL,'2026-06-26','2026-07-10',NULL,NULL,0,'A-04-02-01-001-01','A-04-02-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:06','2026-04-02 05:25:50'),(163,1,'A-04-02-01-001-03','task',102,102,'매트 기초 콘크리트 타설','공통',NULL,NULL,'2026-07-11','2026-07-20',NULL,NULL,0,'A-04-02-01-001-02','A-05-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:06','2026-04-02 05:25:51'),(164,1,'A-05-01-01-001-01','task',103,103,'지하 3층 거푸집 설치','공통',NULL,NULL,'2026-07-21','2026-08-05',NULL,NULL,0,'A-04-02-01-001-03','A-05-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:07','2026-04-02 05:25:51'),(165,1,'A-05-01-01-001-02','task',103,103,'지하 3층 철근 배근','공통',NULL,NULL,'2026-08-06','2026-08-20',NULL,NULL,0,'A-05-01-01-001-01','A-05-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:07','2026-04-02 05:25:51'),(166,1,'A-05-01-01-001-03','task',103,103,'지하 3층 콘크리트 타설','공통',NULL,NULL,'2026-08-21','2026-08-31',NULL,NULL,0,'A-05-01-01-001-02','A-05-01-01-001-04','not_started',NULL,NULL,'2026-04-02 01:36:07','2026-04-02 05:25:51'),(167,1,'A-05-01-01-001-04','task',103,103,'지하 2층 시공','공통',NULL,NULL,'2026-09-01','2026-09-30',NULL,NULL,0,'A-05-01-01-001-03','A-05-01-01-001-05','not_started',NULL,NULL,'2026-04-02 01:36:07','2026-04-02 05:25:52'),(168,1,'A-05-01-01-001-05','task',103,103,'지하 1층 시공','공통',NULL,NULL,'2026-10-01','2026-10-31',NULL,NULL,0,'A-05-01-01-001-04','A-05-02-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:08','2026-04-02 05:25:52'),(169,1,'A-05-02-01-001-01','task',104,104,'1층 골조 시공','공통',NULL,NULL,'2026-11-01','2026-11-30',NULL,NULL,0,'A-05-01-01-001-05','A-05-02-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:08','2026-04-02 05:25:52'),(170,1,'A-05-02-01-001-02','task',104,104,'2~5층 골조 시공','공통',NULL,NULL,'2026-12-01','2027-02-28',NULL,NULL,0,'A-05-02-01-001-01','A-05-02-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:08','2026-04-02 05:25:52'),(171,1,'A-05-02-01-001-03','task',104,104,'6~10층 골조 시공','공통',NULL,NULL,'2027-03-01','2027-05-31',NULL,NULL,0,'A-05-02-01-001-02','A-05-02-01-001-04','not_started',NULL,NULL,'2026-04-02 01:36:08','2026-04-02 05:25:52'),(172,1,'A-05-02-01-001-04','task',104,104,'11~15층 골조 시공','공통',NULL,NULL,'2027-06-01','2027-08-31',NULL,NULL,0,'A-05-02-01-001-03','A-05-02-01-001-05','not_started',NULL,NULL,'2026-04-02 01:36:08','2026-04-02 05:25:53'),(173,1,'A-05-02-01-001-05','task',104,104,'16~20층 골조 시공 (최상층)','공통',NULL,NULL,'2027-09-01','2027-11-30',NULL,NULL,0,'A-05-02-01-001-04','A-06-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:09','2026-04-02 05:25:53'),(174,1,'A-06-01-01-001-01','task',105,105,'방수 바탕면 처리','공통',NULL,NULL,'2027-09-01','2027-09-10',NULL,NULL,0,'A-05-02-01-001-05','A-06-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:09','2026-04-02 05:25:53'),(175,1,'A-06-01-01-001-02','task',105,105,'도막방수 시공','공통',NULL,NULL,'2027-09-11','2027-09-25',NULL,NULL,0,'A-06-01-01-001-01','A-06-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:09','2026-04-02 05:25:53'),(176,1,'A-06-01-01-001-03','task',105,105,'보호층 설치','공통',NULL,NULL,'2027-09-26','2027-10-05',NULL,NULL,0,'A-06-01-01-001-02','A-06-02-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:09','2026-04-02 05:25:53'),(177,1,'A-06-02-01-001-01','task',106,106,'옥상 바탕면 정리','공통',NULL,NULL,'2027-10-06','2027-10-15',NULL,NULL,0,'A-06-01-01-001-03','A-06-02-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:10','2026-04-02 05:25:54'),(178,1,'A-06-02-01-001-02','task',106,106,'시트방수 시공','공통',NULL,NULL,'2027-10-16','2027-10-31',NULL,NULL,0,'A-06-02-01-001-01','A-06-02-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:10','2026-04-02 05:25:54'),(179,1,'A-06-02-01-001-03','task',106,106,'방수 마감 및 검사','공통',NULL,NULL,'2027-11-01','2027-11-10',NULL,NULL,0,'A-06-02-01-001-02','A-07-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:10','2026-04-02 05:25:54'),(180,1,'A-07-01-01-001-01','task',107,107,'블록 반입 및 검수','공통',NULL,NULL,'2027-10-01','2027-10-10',NULL,NULL,0,'A-06-02-01-001-03','A-07-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:10','2026-04-02 05:25:54'),(181,1,'A-07-01-01-001-02','task',107,107,'블록 쌓기 시공','공통',NULL,NULL,'2027-10-11','2027-12-31',NULL,NULL,0,'A-07-01-01-001-01','A-07-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:10','2026-04-02 05:25:55'),(182,1,'A-07-01-01-001-03','task',107,107,'줄눈 마감','공통',NULL,NULL,'2028-01-01','2028-01-15',NULL,NULL,0,'A-07-01-01-001-02','A-08-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:11','2026-04-02 05:25:55'),(183,1,'A-08-01-01-001-01','task',108,108,'바탕면 처리','공통',NULL,NULL,'2027-12-01','2027-12-15',NULL,NULL,0,'A-07-01-01-001-03','A-08-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:11','2026-04-02 05:25:55'),(184,1,'A-08-01-01-001-02','task',108,108,'시멘트 모르타르 미장','공통',NULL,NULL,'2027-12-16','2028-02-28',NULL,NULL,0,'A-08-01-01-001-01','A-08-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:11','2026-04-02 05:25:55'),(185,1,'A-08-01-01-001-03','task',108,108,'미장 양생 및 검사','공통',NULL,NULL,'2028-03-01','2028-03-10',NULL,NULL,0,'A-08-01-01-001-02','A-09-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:11','2026-04-02 05:25:55'),(186,1,'A-09-01-01-001-01','task',109,109,'경량철골 설치','공통',NULL,NULL,'2028-01-01','2028-01-31',NULL,NULL,0,'A-08-01-01-001-03','A-09-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:12','2026-04-02 05:25:56'),(187,1,'A-09-01-01-001-02','task',109,109,'석고보드 설치','공통',NULL,NULL,'2028-02-01','2028-02-29',NULL,NULL,0,'A-09-01-01-001-01','A-09-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:12','2026-04-02 05:25:56'),(188,1,'A-09-01-01-001-03','task',109,109,'천장 마감재 시공','공통',NULL,NULL,'2028-03-01','2028-03-31',NULL,NULL,0,'A-09-01-01-001-02','A-09-02-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:12','2026-04-02 05:25:56'),(189,1,'A-09-02-01-001-01','task',110,110,'단열재 설치','공통',NULL,NULL,'2028-02-01','2028-02-29',NULL,NULL,0,'A-09-01-01-001-03','A-09-02-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:12','2026-04-02 05:25:56'),(190,1,'A-09-02-01-001-02','task',110,110,'난방배관 설치','공통',NULL,NULL,'2028-03-01','2028-03-31',NULL,NULL,0,'A-09-02-01-001-01','A-09-02-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:12','2026-04-02 05:25:57'),(191,1,'A-09-02-01-001-03','task',110,110,'마감 모르타르 타설','공통',NULL,NULL,'2028-04-01','2028-04-30',NULL,NULL,0,'A-09-02-01-001-02','A-10-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:13','2026-04-02 05:25:57'),(192,1,'A-10-01-01-001-01','task',111,111,'퍼티 작업','공통',NULL,NULL,'2028-04-01','2028-04-15',NULL,NULL,0,'A-09-02-01-001-03','A-10-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:13','2026-04-02 05:25:57'),(193,1,'A-10-01-01-001-02','task',111,111,'초벌 도장','공통',NULL,NULL,'2028-04-16','2028-05-15',NULL,NULL,0,'A-10-01-01-001-01','A-10-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:13','2026-04-02 05:25:57'),(194,1,'A-10-01-01-001-03','task',111,111,'재벌 도장 및 마감','공통',NULL,NULL,'2028-05-16','2028-06-15',NULL,NULL,0,'A-10-01-01-001-02','A-11-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:13','2026-04-02 05:25:57'),(195,1,'A-11-01-01-001-01','task',112,112,'창호 반입 및 검수','공통',NULL,NULL,'2027-12-01','2027-12-15',NULL,NULL,0,'A-10-01-01-001-03','A-11-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:14','2026-04-02 05:25:58'),(196,1,'A-11-01-01-001-02','task',112,112,'창호 설치 시공','공통',NULL,NULL,'2027-12-16','2028-02-29',NULL,NULL,0,'A-11-01-01-001-01','A-11-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:14','2026-04-02 05:25:58'),(197,1,'A-11-01-01-001-03','task',112,112,'창호 코킹 및 마감','공통',NULL,NULL,'2028-03-01','2028-03-31',NULL,NULL,0,'A-11-01-01-001-02','A-12-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:14','2026-04-02 05:25:58'),(198,1,'A-12-01-01-001-01','task',113,113,'단열재 부착','공통',NULL,NULL,'2028-01-01','2028-01-31',NULL,NULL,0,'A-11-01-01-001-03','A-12-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:14','2026-04-02 05:25:58'),(199,1,'A-12-01-01-001-02','task',113,113,'메쉬 부착 및 기초도포','공통',NULL,NULL,'2028-02-01','2028-02-29',NULL,NULL,0,'A-12-01-01-001-01','A-12-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:14','2026-04-02 05:25:59'),(200,1,'A-12-01-01-001-03','task',113,113,'마감재 도포','공통',NULL,NULL,'2028-03-01','2028-04-30',NULL,NULL,0,'A-12-01-01-001-02','A-13-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:15','2026-04-02 05:25:59'),(201,1,'A-13-01-01-001-01','task',114,114,'급수 주배관 설치','공통',NULL,NULL,'2027-01-01','2027-03-31',NULL,NULL,0,'A-05-01-01-001-05','A-13-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:15','2026-04-02 05:25:59'),(202,1,'A-13-01-01-001-02','task',114,114,'세대 급수 분기','공통',NULL,NULL,'2027-04-01','2027-06-30',NULL,NULL,0,'A-13-01-01-001-01','A-13-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:15','2026-04-02 05:25:59'),(203,1,'A-13-01-01-001-03','task',114,114,'급수 기구 설치','공통',NULL,NULL,'2027-07-01','2027-09-30',NULL,NULL,0,'A-13-01-01-001-02','A-13-02-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:15','2026-04-02 05:25:59'),(204,1,'A-13-02-01-001-01','task',115,115,'보일러 설치','공통',NULL,NULL,'2028-01-01','2028-02-29',NULL,NULL,0,'A-13-01-01-001-03','A-13-02-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:16','2026-04-02 05:26:00'),(205,1,'A-13-02-01-001-02','task',115,115,'난방 배관 연결','공통',NULL,NULL,'2028-03-01','2028-04-30',NULL,NULL,0,'A-13-02-01-001-01','A-13-02-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:16','2026-04-02 05:26:00'),(206,1,'A-13-02-01-001-03','task',115,115,'시운전 및 검사','공통',NULL,NULL,'2028-05-01','2028-05-31',NULL,NULL,0,'A-13-02-01-001-02','A-14-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:16','2026-04-02 05:26:00'),(207,1,'A-14-01-01-001-01','task',116,116,'수변전실 구축','공통',NULL,NULL,'2027-01-01','2027-03-31',NULL,NULL,0,'A-05-01-01-001-05','A-14-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:16','2026-04-02 05:26:00'),(208,1,'A-14-01-01-001-02','task',116,116,'변압기 설치','공통',NULL,NULL,'2027-04-01','2027-06-30',NULL,NULL,0,'A-14-01-01-001-01','A-14-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:17','2026-04-02 05:26:00'),(209,1,'A-14-01-01-001-03','task',116,116,'배전반 설치 및 결선','공통',NULL,NULL,'2027-07-01','2027-09-30',NULL,NULL,0,'A-14-01-01-001-02','A-14-02-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:17','2026-04-02 05:26:01'),(210,1,'A-14-02-01-001-01','task',117,117,'전선관 설치','공통',NULL,NULL,'2027-10-01','2027-12-31',NULL,NULL,0,'A-14-01-01-001-03','A-14-02-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:17','2026-04-02 05:26:01'),(211,1,'A-14-02-01-001-02','task',117,117,'전선 입선','공통',NULL,NULL,'2028-01-01','2028-03-31',NULL,NULL,0,'A-14-02-01-001-01','A-14-02-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:17','2026-04-02 05:26:01'),(212,1,'A-14-02-01-001-03','task',117,117,'콘센트 및 스위치 설치','공통',NULL,NULL,'2028-04-01','2028-05-31',NULL,NULL,0,'A-14-02-01-001-02','A-15-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:17','2026-04-02 05:26:01'),(213,1,'A-15-01-01-001-01','task',118,118,'주배관 설치','공통',NULL,NULL,'2027-01-01','2027-06-30',NULL,NULL,0,'A-05-01-01-001-05','A-15-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:18','2026-04-02 05:26:02'),(214,1,'A-15-01-01-001-02','task',118,118,'헤드 설치','공통',NULL,NULL,'2027-07-01','2027-12-31',NULL,NULL,0,'A-15-01-01-001-01','A-15-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:18','2026-04-02 05:26:02'),(215,1,'A-15-01-01-001-03','task',118,118,'수압 시험 및 검사','공통',NULL,NULL,'2028-01-01','2028-03-31',NULL,NULL,0,'A-15-01-01-001-02','A-16-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:18','2026-04-02 05:26:02'),(216,1,'A-16-01-01-001-01','task',119,119,'통신 배관 설치','공통',NULL,NULL,'2028-01-01','2028-03-31',NULL,NULL,0,'A-14-02-01-001-03','A-16-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:18','2026-04-02 05:26:02'),(217,1,'A-16-01-01-001-02','task',119,119,'통신 케이블 입선','공통',NULL,NULL,'2028-04-01','2028-05-31',NULL,NULL,0,'A-16-01-01-001-01','A-16-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:19','2026-04-02 05:26:02'),(218,1,'A-16-01-01-001-03','task',119,119,'단자함 및 기기 설치','공통',NULL,NULL,'2028-06-01','2028-06-30',NULL,NULL,0,'A-16-01-01-001-02','A-17-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:19','2026-04-02 05:26:03'),(219,1,'A-17-01-01-001-01','task',120,120,'승강로 검사','공통',NULL,NULL,'2027-12-01','2027-12-31',NULL,NULL,0,'A-05-02-01-001-05','A-17-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:19','2026-04-02 05:26:03'),(220,1,'A-17-01-01-001-02','task',120,120,'승강기 기기 반입','공통',NULL,NULL,'2028-01-01','2028-02-29',NULL,NULL,0,'A-17-01-01-001-01','A-17-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:19','2026-04-02 05:26:03'),(221,1,'A-17-01-01-001-03','task',120,120,'승강기 설치 및 시운전','공통',NULL,NULL,'2028-03-01','2028-05-31',NULL,NULL,0,'A-17-01-01-001-02','A-18-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:19','2026-04-02 05:26:03'),(222,1,'A-18-01-01-001-01','task',121,121,'노반 정지','공통',NULL,NULL,'2028-05-01','2028-05-31',NULL,NULL,0,'A-12-01-01-001-03','A-18-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:20','2026-04-02 05:26:04'),(223,1,'A-18-01-01-001-02','task',121,121,'기층 포장','공통',NULL,NULL,'2028-06-01','2028-06-30',NULL,NULL,0,'A-18-01-01-001-01','A-18-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:20','2026-04-02 05:26:04'),(224,1,'A-18-01-01-001-03','task',121,121,'표층 포장','공통',NULL,NULL,'2028-07-01','2028-07-31',NULL,NULL,0,'A-18-01-01-001-02','A-19-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:20','2026-04-02 05:26:04'),(225,1,'A-19-01-01-001-01','task',122,122,'교목 반입 및 식재','공통',NULL,NULL,'2028-07-01','2028-08-31',NULL,NULL,0,'A-18-01-01-001-03','A-19-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:20','2026-04-02 05:26:04'),(226,1,'A-19-01-01-001-02','task',122,122,'관목 및 지피식물 식재','공통',NULL,NULL,'2028-09-01','2028-09-30',NULL,NULL,0,'A-19-01-01-001-01','A-19-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:21','2026-04-02 05:26:04'),(227,1,'A-19-01-01-001-03','task',122,122,'잔디 식재 및 마감','공통',NULL,NULL,'2028-10-01','2028-10-31',NULL,NULL,0,'A-19-01-01-001-02','A-20-01-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:21','2026-04-02 05:26:05'),(228,1,'A-20-01-01-001-01','task',123,123,'세대 사전점검 실시','공통',NULL,NULL,'2028-10-01','2028-10-31',NULL,NULL,0,'A-19-01-01-001-03','A-20-01-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:21','2026-04-02 05:26:05'),(229,1,'A-20-01-01-001-02','task',123,123,'하자 보수 완료','공통',NULL,NULL,'2028-11-01','2028-11-30',NULL,NULL,0,'A-20-01-01-001-01','A-20-01-01-001-03','not_started',NULL,NULL,'2026-04-02 01:36:21','2026-04-02 05:26:05'),(230,1,'A-20-01-01-001-03','task',123,123,'사용검사 신청 및 완료','공통',NULL,NULL,'2028-12-01','2028-12-20',NULL,NULL,0,'A-20-01-01-001-02','A-20-02-01-001-01','not_started',NULL,NULL,'2026-04-02 01:36:21','2026-04-02 05:26:05'),(231,1,'A-20-02-01-001-01','task',124,124,'관리사무소 인수인계','공통',NULL,NULL,'2028-12-21','2028-12-25',NULL,NULL,0,'A-20-01-01-001-03','A-20-02-01-001-02','not_started',NULL,NULL,'2026-04-02 01:36:22','2026-04-02 05:26:06'),(232,1,'A-20-02-01-001-02','task',124,124,'입주 개시','공통',NULL,NULL,'2028-12-26','2029-01-01',NULL,NULL,0,'A-20-02-01-001-01',NULL,'not_started',NULL,NULL,'2026-04-02 01:36:22','2026-04-02 05:26:06');
/*!40000 ALTER TABLE `wbs_items` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-05 20:58:37

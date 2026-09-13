-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: farmlink
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `buyers`
--

DROP TABLE IF EXISTS `buyers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buyers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `crop` varchar(50) NOT NULL,
  `max_quantity` int NOT NULL,
  `price_per_kg` decimal(6,2) NOT NULL,
  `location` varchar(100) NOT NULL,
  `contact` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buyers`
--

LOCK TABLES `buyers` WRITE;
/*!40000 ALTER TABLE `buyers` DISABLE KEYS */;
INSERT INTO `buyers` VALUES (1,'FreshMart Retail','Tomato',600,24.50,'Bangalore','+91 98765 43210'),(2,'ABC Agro Traders','Tomato',1200,22.00,'Mysore','+91 98765 43211'),(3,'GreenLeaf Organics','Tomato',300,28.00,'Bangalore','+91 98765 43212'),(4,'Apex Food Processing','Potato',2000,18.00,'Bangalore','+91 98765 43213'),(5,'Daily Needs Market','Onion',800,32.00,'Hassan','+91 98765 43214'),(6,'FreshMart Retail','Tomato',600,24.50,'Bangalore','+91 98765 43210'),(7,'ABC Agro Traders','Tomato',1200,22.00,'Mysore','+91 98765 43211'),(8,'GreenLeaf Organics','Tomato',300,28.00,'Bangalore','+91 98765 43212'),(9,'Apex Food Processing','Potato',2000,18.00,'Bangalore','+91 98765 43213'),(10,'Daily Needs Market','Onion',800,32.00,'Hassan','+91 98765 43214'),(11,'FreshMart Retail','Tomato',600,24.50,'Bangalore','+91 98765 43210'),(12,'ABC Agro Traders','Tomato',1200,22.00,'Mysore','+91 98765 43211'),(13,'GreenLeaf Organics','Tomato',300,28.00,'Bangalore','+91 98765 43212'),(14,'Apex Food Processing','Potato',2000,18.00,'Bangalore','+91 98765 43213'),(15,'Daily Needs Market','Onion',800,32.00,'Hassan','+91 98765 43214'),(16,'FreshMart Retail','Tomato',600,24.50,'Bangalore','+91 98765 43210'),(17,'ABC Agro Traders','Tomato',1200,22.00,'Mysore','+91 98765 43211'),(18,'GreenLeaf Organics','Tomato',300,28.00,'Bangalore','+91 98765 43212'),(19,'Apex Food Processing','Potato',2000,18.00,'Bangalore','+91 98765 43213'),(20,'Daily Needs Market','Onion',800,32.00,'Hassan','+91 98765 43214');
/*!40000 ALTER TABLE `buyers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-13  8:22:08

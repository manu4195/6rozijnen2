-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 18, 2025 at 12:22 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `seddata`
--
CREATE DATABASE IF NOT EXISTS `seddata`;
USE `seddata`;

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `gebruiker_id` int(255) NOT NULL,
  `rechten` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dashboard`
--

CREATE TABLE `dashboard` (
  `id` int(11) NOT NULL,
  `gebruiker_id` int(255) NOT NULL,
  `dash_config` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gebruiker`
--

CREATE TABLE `gebruiker` (
  `id` int(11) NOT NULL,
  `naam` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `wachtwoord` varchar(255) CHARACTER SET hebrew COLLATE hebrew_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Inserting default admin user
--

INSERT INTO `gebruiker` (`id`, `naam`, `email`, `wachtwoord`) VALUES
(1, 'Admin', 'admin@example.com', 'admin123');

INSERT INTO `admin` (`id`, `gebruiker_id`, `rechten`) VALUES
(1, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `grafiek`
--

CREATE TABLE `grafiek` (
  `id` int(11) NOT NULL,
  `module_id` int(255) NOT NULL,
  `grafiek_type` varchar(255) NOT NULL,
  `config` int(255) NOT NULL,
  `x-as` int(255) NOT NULL,
  `y-as` int(255) NOT NULL,
  `grafiek_grootte` int(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `module`
--

CREATE TABLE `module` (
  `id` int(11) NOT NULL,
  `titel` varchar(255) NOT NULL,
  `module_type` varchar(255) NOT NULL COMMENT 'dit geeft aan welke soort data wordt meegegeven aan grafiek',
  `positie` varchar(255) NOT NULL,
  `grootte` int(255) NOT NULL,
  `databron` varchar(255) NOT NULL COMMENT 'dit is de link naar de csv-file',
  `module_config` varchar(255) NOT NULL,
  `drempelwaarde` int(255) NOT NULL COMMENT 'dit is voor notificatie code'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Insert default modules
--

INSERT INTO `module` (`id`, `titel`, `module_type`, `positie`, `grootte`, `databron`, `module_config`, `drempelwaarde`) VALUES
(1, 'Zonne-energie Productie', 'stats', '1', 1, '', '', 0),
(2, 'Stroomverbruik', 'stats', '2', 1, '', '', 0),
(3, 'Batterij Status', 'stats', '3', 1, '', '', 0),
(4, 'Kosten Besparing', 'stats', '4', 1, '', '', 0),
(5, 'Energie Productie', 'chart', '5', 2, '', '', 0),
(6, 'Verbruik vs Productie', 'chart', '6', 2, '', '', 0),
(7, 'Meldingen & Waarschuwingen', 'notification', '7', 2, '', '', 0),
(8, 'Weer Voorspelling', 'weather', '8', 2, '', '', 0),
(9, 'Apparaten Status', 'device', '9', 3, '', '', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gebruiker_id` (`gebruiker_id`);

--
-- Indexes for table `dashboard`
--
ALTER TABLE `dashboard`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gebruiker_id` (`gebruiker_id`);

--
-- Indexes for table `gebruiker`
--
ALTER TABLE `gebruiker`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `grafiek`
--
ALTER TABLE `grafiek`
  ADD PRIMARY KEY (`id`),
  ADD KEY `module_id` (`module_id`);

--
-- Indexes for table `module`
--
ALTER TABLE `module`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `dashboard`
--
ALTER TABLE `dashboard`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gebruiker`
--
ALTER TABLE `gebruiker`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `grafiek`
--
ALTER TABLE `grafiek`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `module`
--
ALTER TABLE `module`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin`
--
ALTER TABLE `admin`
  ADD CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`gebruiker_id`) REFERENCES `gebruiker` (`id`);

--
-- Constraints for table `dashboard`
--
ALTER TABLE `dashboard`
  ADD CONSTRAINT `dashboard_ibfk_1` FOREIGN KEY (`gebruiker_id`) REFERENCES `gebruiker` (`id`);

--
-- Constraints for table `grafiek`
--
ALTER TABLE `grafiek`
  ADD CONSTRAINT `grafiek_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `module` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

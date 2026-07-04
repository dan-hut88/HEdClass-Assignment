-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 13, 2026 at 10:37 AM
-- Server version: 5.7.24
-- PHP Version: 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hedclass`
--

CREATE DATABASE IF NOT EXISTS `hedclass`;
USE `hedclass`;

-- --------------------------------------------------------

--
-- Table structure for table `classifications`
--

CREATE TABLE `classifications` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `degree_id` int(11) NOT NULL,
  `yr2_average` decimal(5,2) NOT NULL,
  `yr3_average` decimal(5,2) NOT NULL,
  `final_average` decimal(5,2) NOT NULL,
  `proposed_result` enum('First Class Honours (1st)','Upper Second Class (2:1)','Lower Second Class (2:2)','Third Class Honours','Fail') NOT NULL,
  `final_result` enum('First Class Honours (1st)','Upper Second Class (2:1)','Lower Second Class (2:2)','Third Class Honours','Fail','Pending') NOT NULL DEFAULT 'Pending',
  `is_overridden` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('pending_review','overridden','approved') NOT NULL DEFAULT 'pending_review',
  `rationale` text NOT NULL,
  `classified_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `classifications`
--

INSERT INTO `classifications` (`id`, `student_id`, `degree_id`, `yr2_average`, `yr3_average`, `final_average`, `proposed_result`, `final_result`, `is_overridden`, `status`, `rationale`, `classified_by`) VALUES
(81, 1, 1, '74.00', '76.00', '75.40', 'First Class Honours (1st)', 'Pending', 0, 'pending_review', '', 2),
(82, 2, 1, '60.17', '65.67', '64.02', 'Upper Second Class (2:1)', 'Pending', 0, 'pending_review', '', 2),
(83, 3, 1, '69.17', '70.67', '70.22', 'First Class Honours (1st)', 'Pending', 0, 'pending_review', '', 2),
(84, 4, 1, '48.33', '55.00', '53.00', 'Lower Second Class (2:2)', 'Pending', 0, 'pending_review', '', 2),
(85, 5, 1, '42.50', '42.83', '42.73', 'Third Class Honours', 'Pending', 0, 'pending_review', '', 2);

-- --------------------------------------------------------

--
-- Table structure for table `degree`
--

CREATE TABLE `degree` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `weighting_yr2` decimal(5,2) NOT NULL DEFAULT '30.00',
  `weighting_yr3` decimal(5,2) NOT NULL DEFAULT '70.00',
  `credits_per_year` int(11) NOT NULL DEFAULT '120'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `degree`
--

INSERT INTO `degree` (`id`, `name`, `weighting_yr2`, `weighting_yr3`, `credits_per_year`) VALUES
(1, 'BSc Computer Science', '30.00', '70.00', 120),
(2, 'BSc Software Engineering', '30.00', '70.00', 120),
(3, 'BA Fine Art', '30.00', '70.00', 120);

-- --------------------------------------------------------

--
-- Table structure for table `degree_modules`
--

CREATE TABLE `degree_modules` (
  `id` int(11) NOT NULL,
  `degree_id` int(11) NOT NULL,
  `module_name` varchar(150) NOT NULL,
  `year` enum('1','2','3') NOT NULL,
  `credits` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `degree_modules`
--

INSERT INTO `degree_modules` (`id`, `degree_id`, `module_name`, `year`, `credits`) VALUES
(1, 1, 'Programming Fundamentals', '1', 20),
(2, 1, 'Web Technologies', '1', 20),
(3, 1, 'Databases', '1', 20),
(4, 1, 'Maths for Computing', '1', 20),
(5, 1, 'Systems Architecture', '1', 20),
(6, 1, 'Professional Skills', '1', 20),
(7, 1, 'Algorithms & Data Structures', '2', 20),
(8, 1, 'Artificial Intelligence', '2', 20),
(9, 1, 'Computer Networks', '2', 20),
(10, 1, 'Operating Systems', '2', 20),
(11, 1, 'Cybersecurity Fundamentals', '2', 20),
(12, 1, 'Human-Computer Interaction', '2', 20),
(13, 1, 'Dissertation', '3', 40),
(14, 1, 'Machine Learning', '3', 20),
(15, 1, 'Cloud Computing', '3', 20),
(16, 1, 'Advanced Databases', '3', 20),
(17, 1, 'Distributed Systems', '3', 20),
(18, 2, 'Introduction to Programming', '1', 20),
(19, 2, 'Software Principles', '1', 20),
(20, 2, 'Logic & Discrete Maths', '1', 20),
(21, 2, 'Version Control & Tooling', '1', 20),
(22, 2, 'Computing Systems', '1', 20),
(23, 2, 'Team Project I', '1', 20),
(24, 2, 'Software Design Patterns', '2', 20),
(25, 2, 'Agile Development', '2', 20),
(26, 2, 'Requirements Engineering', '2', 20),
(27, 2, 'Software Testing & QA', '2', 20),
(28, 2, 'DevOps & CI/CD', '2', 20),
(29, 2, 'Database Systems', '2', 20),
(30, 2, 'Dissertation', '3', 40),
(31, 2, 'Software Architecture', '3', 20),
(32, 2, 'Mobile Application Development', '3', 20),
(33, 2, 'Enterprise Systems Integration', '3', 20),
(34, 2, 'Project Management', '3', 20),
(35, 3, 'Drawing Fundamentals', '1', 20),
(36, 3, 'Colour Theory', '1', 20),
(37, 3, 'Art History', '1', 20),
(38, 3, 'Studio Practice', '1', 20),
(39, 3, 'Critical Studies', '1', 20),
(40, 3, 'Digital Media', '1', 20),
(41, 3, 'Advanced Drawing', '2', 20),
(42, 3, 'Sculpture', '2', 20),
(43, 3, 'Contemporary Art Practices', '2', 20),
(44, 3, 'Studio Project', '2', 20),
(45, 3, 'Art Theory', '2', 20),
(46, 3, 'Exhibition Studies', '2', 20),
(47, 3, 'Dissertation', '3', 20),
(48, 3, 'Final Major Project', '3', 20),
(49, 3, 'Professional Practice', '3', 20),
(50, 3, 'Graduate Exhibition', '3', 20),
(51, 3, 'Art & Society', '3', 20),
(52, 3, 'Studio Critique', '3', 20);

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `student_number` varchar(20) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `degree_id` int(11) NOT NULL,
  `entry_year` year(4) NOT NULL,
  `academic_year` varchar(10) NOT NULL,
  `created_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `student_number`, `first_name`, `last_name`, `degree_id`, `entry_year`, `academic_year`, `created_by`) VALUES
(1, '40100001', 'Alice', 'Thompson', 1, 2022, '2024/25', 2),
(2, '40100002', 'Ben', 'Wallace', 1, 2022, '2024/25', 2),
(3, '40100003', 'Chloe', 'Martin', 1, 2022, '2024/25', 2),
(4, '40100004', 'David', 'OBrien', 1, 2022, '2024/25', 2),
(5, '40100005', 'Emma', 'Hughes', 1, 2022, '2024/25', 2),
(6, '40100006', 'Finn', 'Doyle', 1, 2022, '2024/25', 3),
(7, '40100007', 'Grace', 'Park', 1, 2022, '2024/25', 3),
(8, '40100008', 'Harry', 'Ellis', 1, 2022, '2024/25', 3),
(9, '40100009', 'Isla', 'McNeil', 1, 2022, '2024/25', 3),
(10, '40100010', 'Jack', 'Brennan', 1, 2022, '2024/25', 3),
(11, '40200001', 'Katie', 'Flynn', 2, 2022, '2024/25', 3),
(12, '40200002', 'Liam', 'Byrne', 2, 2022, '2024/25', 3),
(13, '40200003', 'Megan', 'Carroll', 2, 2022, '2024/25', 3),
(14, '40200004', 'Noah', 'Gallagher', 2, 2022, '2024/25', 3),
(15, '40200005', 'Olivia', 'Quinn', 2, 2022, '2024/25', 3),
(16, '40300001', 'Patrick', 'Sheridan', 3, 2022, '2024/25', 4),
(17, '40300002', 'Rachel', 'Ward', 3, 2022, '2024/25', 4),
(18, '40300003', 'Sean', 'Mullan', 3, 2022, '2024/25', 4),
(19, '40300004', 'Tara', 'Connell', 3, 2022, '2024/25', 4),
(20, '40300005', 'Ultan', 'Doherty', 3, 2022, '2024/25', 4);

-- --------------------------------------------------------

--
-- Table structure for table `student_marks`
--

CREATE TABLE `student_marks` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `degree_module_id` int(11) NOT NULL,
  `mark` decimal(5,2) NOT NULL,
  `is_resit` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `student_marks`
--

INSERT INTO `student_marks` (`id`, `student_id`, `degree_module_id`, `mark`, `is_resit`) VALUES
(1, 1, 7, '75.00', 0),
(2, 1, 8, '78.00', 0),
(3, 1, 9, '72.00', 0),
(4, 1, 10, '74.00', 0),
(5, 1, 11, '76.00', 0),
(6, 1, 12, '69.00', 0),
(7, 1, 13, '80.00', 0),
(8, 1, 14, '77.00', 0),
(9, 1, 15, '73.00', 0),
(10, 1, 16, '75.00', 0),
(11, 1, 17, '71.00', 0),
(12, 2, 7, '65.00', 0),
(13, 2, 8, '42.00', 1),
(14, 2, 9, '63.00', 0),
(15, 2, 10, '67.00', 0),
(16, 2, 11, '64.00', 0),
(17, 2, 12, '62.00', 0),
(18, 2, 13, '68.00', 0),
(19, 2, 14, '64.00', 0),
(20, 2, 15, '66.00', 0),
(21, 2, 16, '65.00', 0),
(22, 2, 17, '63.00', 0),
(23, 3, 7, '70.00', 0),
(24, 3, 8, '68.00', 0),
(25, 3, 9, '69.00', 0),
(26, 3, 10, '71.00', 0),
(27, 3, 11, '67.00', 0),
(28, 3, 12, '70.00', 0),
(29, 3, 13, '72.00', 0),
(30, 3, 14, '70.00', 0),
(31, 3, 15, '69.00', 0),
(32, 3, 16, '71.00', 0),
(33, 3, 17, '70.00', 0),
(34, 4, 7, '52.00', 0),
(35, 4, 8, '55.00', 0),
(36, 4, 9, '50.00', 0),
(37, 4, 10, '53.00', 0),
(38, 4, 11, '41.00', 1),
(39, 4, 12, '40.00', 1),
(40, 4, 13, '55.00', 0),
(41, 4, 14, '57.00', 0),
(42, 4, 15, '54.00', 0),
(43, 4, 16, '56.00', 0),
(44, 4, 17, '53.00', 0),
(45, 5, 7, '42.00', 0),
(46, 5, 8, '45.00', 0),
(47, 5, 9, '40.00', 0),
(48, 5, 10, '43.00', 0),
(49, 5, 11, '41.00', 0),
(50, 5, 12, '44.00', 0),
(51, 5, 13, '44.00', 0),
(52, 5, 14, '42.00', 1),
(53, 5, 15, '45.00', 0),
(54, 5, 16, '43.00', 0),
(55, 5, 17, '41.00', 0),
(56, 6, 7, '63.00', 0),
(57, 6, 8, '61.00', 0),
(58, 6, 9, '65.00', 0),
(59, 6, 10, '62.00', 0),
(60, 6, 11, '64.00', 0),
(61, 6, 12, '60.00', 0),
(62, 6, 13, '67.00', 0),
(63, 6, 14, '64.00', 0),
(64, 6, 15, '63.00', 0),
(65, 6, 16, '65.00', 0),
(66, 6, 17, '62.00', 0),
(67, 7, 7, '77.00', 0),
(68, 7, 8, '80.00', 0),
(69, 7, 9, '74.00', 0),
(70, 7, 10, '78.00', 0),
(71, 7, 11, '75.00', 0),
(72, 7, 12, '76.00', 0),
(73, 7, 13, '82.00', 0),
(74, 7, 14, '79.00', 0),
(75, 7, 15, '77.00', 0),
(76, 7, 16, '80.00', 0),
(77, 7, 17, '76.00', 0),
(78, 8, 7, '55.00', 0),
(79, 8, 8, '58.00', 0),
(80, 8, 9, '42.00', 1),
(81, 8, 10, '57.00', 0),
(82, 8, 11, '53.00', 0),
(83, 8, 12, '56.00', 0),
(84, 8, 13, '57.00', 0),
(85, 8, 14, '55.00', 0),
(86, 8, 15, '58.00', 0),
(87, 8, 16, '56.00', 0),
(88, 8, 17, '54.00', 0),
(89, 9, 7, '59.00', 0),
(90, 9, 8, '58.00', 0),
(91, 9, 9, '61.00', 0),
(92, 9, 10, '57.00', 0),
(93, 9, 11, '60.00', 0),
(94, 9, 12, '59.00', 0),
(95, 9, 13, '61.00', 0),
(96, 9, 14, '59.00', 0),
(97, 9, 15, '60.00', 0),
(98, 9, 16, '61.00', 0),
(99, 9, 17, '59.00', 0),
(100, 10, 7, '42.00', 0),
(101, 10, 8, '44.00', 0),
(102, 10, 9, '40.00', 1),
(103, 10, 10, '46.00', 0),
(104, 10, 11, '43.00', 0),
(105, 10, 12, '41.00', 1),
(106, 10, 13, '46.00', 0),
(107, 10, 14, '44.00', 0),
(108, 10, 15, '47.00', 0),
(109, 10, 16, '45.00', 0),
(110, 10, 17, '43.00', 0),
(111, 11, 24, '76.00', 0),
(112, 11, 25, '74.00', 0),
(113, 11, 26, '78.00', 0),
(114, 11, 27, '72.00', 0),
(115, 11, 28, '75.00', 0),
(116, 11, 29, '73.00', 0),
(117, 11, 30, '79.00', 0),
(118, 11, 31, '76.00', 0),
(119, 11, 32, '74.00', 0),
(120, 11, 33, '77.00', 0),
(121, 11, 34, '75.00', 0),
(122, 12, 24, '64.00', 0),
(123, 12, 25, '62.00', 0),
(124, 12, 26, '65.00', 0),
(125, 12, 27, '61.00', 0),
(126, 12, 28, '63.00', 0),
(127, 12, 29, '62.00', 0),
(128, 12, 30, '66.00', 0),
(129, 12, 31, '40.00', 1),
(130, 12, 32, '65.00', 0),
(131, 12, 33, '64.00', 0),
(132, 12, 34, '63.00', 0),
(133, 13, 24, '53.00', 0),
(134, 13, 25, '55.00', 0),
(135, 13, 26, '52.00', 0),
(136, 13, 27, '57.00', 0),
(137, 13, 28, '54.00', 0),
(138, 13, 29, '53.00', 0),
(139, 13, 30, '56.00', 0),
(140, 13, 31, '54.00', 0),
(141, 13, 32, '55.00', 0),
(142, 13, 33, '53.00', 0),
(143, 13, 34, '57.00', 0),
(144, 14, 24, '63.00', 0),
(145, 14, 25, '61.00', 0),
(146, 14, 26, '64.00', 0),
(147, 14, 27, '40.00', 1),
(148, 14, 28, '41.00', 1),
(149, 14, 29, '62.00', 0),
(150, 14, 30, '65.00', 0),
(151, 14, 31, '63.00', 0),
(152, 14, 32, '61.00', 0),
(153, 14, 33, '64.00', 0),
(154, 14, 34, '62.00', 0),
(155, 15, 24, '38.00', 1),
(156, 15, 25, '35.00', 0),
(157, 15, 26, '37.00', 0),
(158, 15, 27, '34.00', 0),
(159, 15, 28, '36.00', 0),
(160, 15, 29, '33.00', 0),
(161, 15, 30, '36.00', 0),
(162, 15, 31, '32.00', 0),
(163, 15, 32, '35.00', 0),
(164, 15, 33, '34.00', 0),
(165, 15, 34, '33.00', 0),
(166, 16, 41, '64.00', 0),
(167, 16, 42, '62.00', 0),
(168, 16, 43, '65.00', 0),
(169, 16, 44, '61.00', 0),
(170, 16, 45, '63.00', 0),
(171, 16, 46, '62.00', 0),
(172, 16, 47, '66.00', 0),
(173, 16, 48, '64.00', 0),
(174, 16, 49, '63.00', 0),
(175, 16, 50, '65.00', 0),
(176, 16, 51, '62.00', 0),
(177, 16, 52, '64.00', 0),
(178, 17, 41, '74.00', 0),
(179, 17, 42, '72.00', 0),
(180, 17, 43, '76.00', 0),
(181, 17, 44, '71.00', 0),
(182, 17, 45, '73.00', 0),
(183, 17, 46, '75.00', 0),
(184, 17, 47, '78.00', 0),
(185, 17, 48, '76.00', 0),
(186, 17, 49, '74.00', 0),
(187, 17, 50, '79.00', 0),
(188, 17, 51, '75.00', 0),
(189, 17, 52, '77.00', 0),
(190, 18, 41, '43.00', 0),
(191, 18, 42, '40.00', 1),
(192, 18, 43, '45.00', 0),
(193, 18, 44, '42.00', 0),
(194, 18, 45, '44.00', 0),
(195, 18, 46, '43.00', 0),
(196, 18, 47, '46.00', 0),
(197, 18, 48, '44.00', 0),
(198, 18, 49, '43.00', 0),
(199, 18, 50, '47.00', 0),
(200, 18, 51, '45.00', 0),
(201, 18, 52, '44.00', 0),
(202, 19, 41, '55.00', 0),
(203, 19, 42, '57.00', 0),
(204, 19, 43, '41.00', 1),
(205, 19, 44, '56.00', 0),
(206, 19, 45, '40.00', 1),
(207, 19, 46, '58.00', 0),
(208, 19, 47, '60.00', 0),
(209, 19, 48, '59.00', 0),
(210, 19, 49, '61.00', 0),
(211, 19, 50, '60.00', 0),
(212, 19, 51, '59.00', 0),
(213, 19, 52, '61.00', 0),
(214, 20, 41, '62.00', 0),
(215, 20, 42, '64.00', 0),
(216, 20, 43, '61.00', 0),
(217, 20, 44, '63.00', 0),
(218, 20, 45, '60.00', 0),
(219, 20, 46, '65.00', 0),
(220, 20, 47, '42.00', 1),
(221, 20, 48, '66.00', 0),
(222, 20, 49, '63.00', 0),
(223, 20, 50, '65.00', 0),
(224, 20, 51, '62.00', 0),
(225, 20, 52, '64.00', 0),
(226, 1, 1, '74.00', 0),
(227, 1, 2, '73.00', 0),
(228, 1, 3, '74.00', 0),
(229, 1, 4, '76.00', 0),
(230, 1, 5, '74.00', 0),
(231, 1, 6, '70.00', 0),
(232, 2, 1, '66.00', 0),
(233, 2, 2, '65.00', 0),
(234, 2, 3, '65.00', 0),
(235, 2, 4, '64.00', 0),
(236, 2, 5, '40.00', 1),
(237, 2, 6, '64.00', 0),
(238, 3, 1, '70.00', 0),
(239, 3, 2, '71.00', 0),
(240, 3, 3, '69.00', 0),
(241, 3, 4, '70.00', 0),
(242, 3, 5, '68.00', 0),
(243, 3, 6, '69.00', 0),
(244, 4, 1, '40.00', 1),
(245, 4, 2, '49.00', 0),
(246, 4, 3, '48.00', 0),
(247, 4, 4, '54.00', 0),
(248, 4, 5, '54.00', 0),
(249, 4, 6, '60.00', 0),
(250, 5, 1, '40.00', 1),
(251, 5, 2, '43.00', 0),
(252, 5, 3, '45.00', 0),
(253, 5, 4, '41.00', 0),
(254, 5, 5, '44.00', 0),
(255, 5, 6, '40.00', 0),
(256, 6, 1, '58.00', 0),
(257, 6, 2, '62.00', 0),
(258, 6, 3, '61.00', 0),
(259, 6, 4, '65.00', 0),
(260, 6, 5, '64.00', 0),
(261, 6, 6, '61.00', 0),
(262, 7, 1, '79.00', 0),
(263, 7, 2, '75.00', 0),
(264, 7, 3, '77.00', 0),
(265, 7, 4, '76.00', 0),
(266, 7, 5, '77.00', 0),
(267, 7, 6, '79.00', 0),
(268, 8, 1, '40.00', 1),
(269, 8, 2, '52.00', 0),
(270, 8, 3, '53.00', 0),
(271, 8, 4, '57.00', 0),
(272, 8, 5, '56.00', 0),
(273, 8, 6, '54.00', 0),
(274, 9, 1, '58.00', 0),
(275, 9, 2, '60.00', 0),
(276, 9, 3, '59.00', 0),
(277, 9, 4, '58.00', 0),
(278, 9, 5, '60.00', 0),
(279, 9, 6, '60.00', 0),
(280, 10, 1, '43.00', 0),
(281, 10, 2, '42.00', 0),
(282, 10, 3, '39.00', 0),
(283, 10, 4, '47.00', 0),
(284, 10, 5, '40.00', 1),
(285, 10, 6, '41.00', 0),
(286, 11, 18, '73.00', 0),
(287, 11, 19, '71.00', 0),
(288, 11, 20, '75.00', 0),
(289, 11, 21, '74.00', 0),
(290, 11, 22, '77.00', 0),
(291, 11, 23, '75.00', 0),
(292, 12, 18, '67.00', 0),
(293, 12, 19, '65.00', 0),
(294, 12, 20, '40.00', 1),
(295, 12, 21, '62.00', 0),
(296, 12, 22, '64.00', 0),
(297, 12, 23, '65.00', 0),
(298, 13, 18, '56.00', 0),
(299, 13, 19, '52.00', 0),
(300, 13, 20, '55.00', 0),
(301, 13, 21, '55.00', 0),
(302, 13, 22, '54.00', 0),
(303, 13, 23, '52.00', 0),
(304, 14, 18, '58.00', 0),
(305, 14, 19, '60.00', 0),
(306, 14, 20, '61.00', 0),
(307, 14, 21, '63.00', 0),
(308, 14, 22, '64.00', 0),
(309, 14, 23, '40.00', 1),
(310, 15, 18, '35.00', 1),
(311, 15, 19, '31.00', 0),
(312, 15, 20, '36.00', 0),
(313, 15, 21, '36.00', 0),
(314, 15, 22, '34.00', 0),
(315, 15, 23, '33.00', 0),
(316, 16, 35, '61.00', 0),
(317, 16, 36, '65.00', 0),
(318, 16, 37, '62.00', 0),
(319, 16, 38, '63.00', 0),
(320, 16, 39, '58.00', 0),
(321, 16, 40, '61.00', 0),
(322, 17, 35, '74.00', 0),
(323, 17, 36, '73.00', 0),
(324, 17, 37, '76.00', 0),
(325, 17, 38, '72.00', 0),
(326, 17, 39, '74.00', 0),
(327, 17, 40, '72.00', 0),
(328, 18, 35, '41.00', 0),
(329, 18, 36, '44.00', 0),
(330, 18, 37, '40.00', 1),
(331, 18, 38, '42.00', 0),
(332, 18, 39, '43.00', 0),
(333, 18, 40, '45.00', 0),
(334, 19, 35, '54.00', 0),
(335, 19, 36, '40.00', 1),
(336, 19, 37, '51.00', 0),
(337, 19, 38, '51.00', 0),
(338, 19, 39, '53.00', 0),
(339, 19, 40, '56.00', 0),
(340, 20, 35, '63.00', 0),
(341, 20, 36, '61.00', 0),
(342, 20, 37, '40.00', 1),
(343, 20, 38, '61.00', 0),
(344, 20, 39, '65.00', 0),
(345, 20, 40, '63.00', 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(250) NOT NULL,
  `role` enum('registry services officer','classifications officer') NOT NULL DEFAULT 'classifications officer'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`) VALUES
(1, 'Registry Admin', 'admin@hedclass.com', '$2b$10$4w9BBLU.aiQA1eWZ/spd2ucbP4dbt.U6HILX19qbA0Vgvf3YBzREO', 'registry services officer'),
(2, 'James Murphy', 'j.murphy@hedclass.com', '$2a$10$WrCUsTe0fd2M64nEgow0.e2hHHzO7VsKc/q4E3.KN/8PtwfBETsmC', 'classifications officer'),
(3, 'Lisa Chen', 'l.chen@hedclass.com', '$2a$10$6FvTqCxA/j6oCEmKlvvfuuu1n7fWhnGYI4FNK/bfQtQedhek7WC5G', 'classifications officer'),
(4, 'Alan Clarke', 'a.clarke@hedclass.com', '$2a$10$Q0EL6CU4.l2j5ed.UotRVuJiXlne6UQLkXSzptUN1YKuiB81D26tm', 'classifications officer');

-- --------------------------------------------------------

--
-- Table structure for table `user_degree`
--

CREATE TABLE `user_degree` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `degree_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `user_degree`
--

INSERT INTO `user_degree` (`id`, `user_id`, `degree_id`) VALUES
(1, 2, 1),
(2, 3, 1),
(3, 3, 2),
(4, 4, 3);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `classifications`
--
ALTER TABLE `classifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student` (`student_id`),
  ADD KEY `classified_by` (`classified_by`),
  ADD KEY `classifications_ibfk_3` (`degree_id`);

--
-- Indexes for table `degree`
--
ALTER TABLE `degree`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `degree_modules`
--
ALTER TABLE `degree_modules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `degree_id` (`degree_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `degree_id` (`degree_id`);

--
-- Indexes for table `student_marks`
--
ALTER TABLE `student_marks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `degree_module_id` (`degree_module_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_degree`
--
ALTER TABLE `user_degree`
  ADD PRIMARY KEY (`id`),
  ADD KEY `degree_id` (`degree_id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `classifications`
--
ALTER TABLE `classifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT for table `degree`
--
ALTER TABLE `degree`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `degree_modules`
--
ALTER TABLE `degree_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `student_marks`
--
ALTER TABLE `student_marks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=346;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_degree`
--
ALTER TABLE `user_degree`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `classifications`
--
ALTER TABLE `classifications`
  ADD CONSTRAINT `classifications_ibfk_1` FOREIGN KEY (`classified_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `classifications_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `classifications_ibfk_3` FOREIGN KEY (`degree_id`) REFERENCES `degree` (`id`);

--
-- Constraints for table `degree_modules`
--
ALTER TABLE `degree_modules`
  ADD CONSTRAINT `degree_modules_ibfk_1` FOREIGN KEY (`degree_id`) REFERENCES `degree` (`id`);

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `students_ibfk_2` FOREIGN KEY (`degree_id`) REFERENCES `degree` (`id`);

--
-- Constraints for table `student_marks`
--
ALTER TABLE `student_marks`
  ADD CONSTRAINT `student_marks_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `student_marks_ibfk_2` FOREIGN KEY (`degree_module_id`) REFERENCES `degree_modules` (`id`);

--
-- Constraints for table `user_degree`
--
ALTER TABLE `user_degree`
  ADD CONSTRAINT `user_degree_ibfk_1` FOREIGN KEY (`degree_id`) REFERENCES `degree` (`id`),
  ADD CONSTRAINT `user_degree_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

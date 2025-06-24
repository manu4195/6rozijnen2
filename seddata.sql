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

-- Drop tables if they exist
DROP TABLE IF EXISTS user_widgets;
DROP TABLE IF EXISTS widgets;
DROP TABLE IF EXISTS users;

-- Create Users table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    plan_type VARCHAR(20) DEFAULT 'Basic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Create Widgets table (predefined widget templates)
CREATE TABLE widgets (
    widget_id INT PRIMARY KEY AUTO_INCREMENT,
    widget_name VARCHAR(50) NOT NULL,
    widget_type VARCHAR(30) NOT NULL,
    description TEXT,
    default_title VARCHAR(100),
    default_icon VARCHAR(50),
    default_icon_color VARCHAR(20),
    default_column_span INT DEFAULT 1,
    default_row_span INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create User_Widgets table (individual widget instances on user dashboards)
CREATE TABLE user_widgets (
    user_widget_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    widget_id INT NOT NULL,
    title VARCHAR(100),
    icon VARCHAR(50),
    icon_color VARCHAR(20),
    column_span INT DEFAULT 1,
    row_span INT DEFAULT 1,
    grid_position_x INT NOT NULL,
    grid_position_y INT NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    widget_data JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (widget_id) REFERENCES widgets(widget_id) ON DELETE CASCADE
);

-- Insert sample users
INSERT INTO users (username, password, email, full_name, plan_type) VALUES
('alex_morgan', '$2y$10$SomeHashedPasswordHere', 'alex@example.com', 'Alex Morgan', 'Premium'),
('demo_user', '$2y$10$AnotherHashedPasswordHere', 'demo@example.com', 'Demo User', 'Basic');

-- Insert predefined widget types
INSERT INTO widgets (widget_name, widget_type, description, default_title, default_icon, default_icon_color, default_column_span, default_row_span) VALUES
('solar_production', 'stat-card', 'Shows solar energy production statistics', 'Zonne-energie Productie', 'fa-sun', 'green', 1, 1),
('power_consumption', 'stat-card', 'Shows power consumption statistics', 'Stroomverbruik', 'fa-bolt', 'red', 1, 1),
('battery_status', 'stat-card', 'Shows battery status information', 'Batterij Status', 'fa-battery-three-quarters', 'blue', 1, 1),
('cost_savings', 'stat-card', 'Shows cost savings information', 'Kosten Besparing', 'fa-euro-sign', 'yellow', 1, 1),
('energy_production_chart', 'chart', 'Energy production chart over time', 'Energie Productie', NULL, NULL, 2, 1),
('consumption_production_chart', 'chart', 'Consumption vs production comparison chart', 'Verbruik vs Productie', NULL, NULL, 2, 1),
('notifications', 'notifications', 'Notifications and alerts panel', 'Meldingen & Waarschuwingen', NULL, NULL, 2, 1),
('weather', 'weather', 'Weather forecast and solar production prediction', 'Weer Voorspelling', NULL, NULL, 2, 1),
('devices', 'devices', 'Connected devices status overview', 'Apparaten Status', NULL, NULL, 4, 1);

-- Insert sample user widget configurations for Alex Morgan
INSERT INTO user_widgets (user_id, widget_id, title, icon, icon_color, column_span, row_span, grid_position_x, grid_position_y, widget_data) VALUES
(1, 1, 'Zonne-energie Productie', 'fa-sun', 'green', 1, 1, 0, 0, '{"value": "24.8 kWh", "secondary_value": "+12% vs gisteren", "is_positive": true}'),
(1, 2, 'Stroomverbruik', 'fa-bolt', 'red', 1, 1, 1, 0, '{"value": "18.2 kWh", "secondary_value": "-15% vs gisteren", "is_positive": false}'),
(1, 3, 'Batterij Status', 'fa-battery-three-quarters', 'blue', 1, 1, 2, 0, '{"value": "78%", "secondary_value": "6.2 kWh opgeslagen", "is_positive": null}'),
(1, 4, 'Kosten Besparing', 'fa-euro-sign', 'yellow', 1, 1, 3, 0, '{"value": "€127.40", "secondary_value": "Deze maand", "is_positive": null}'),
(1, 5, 'Energie Productie', NULL, NULL, 2, 1, 0, 1, '{"chart_type": "line", "time_period": "day"}'),
(1, 6, 'Verbruik vs Productie', NULL, NULL, 2, 1, 2, 1, '{"chart_type": "bar", "time_period": "day"}'),
(1, 7, 'Meldingen & Waarschuwingen', NULL, NULL, 2, 1, 0, 2, '{"notifications": [
  {"type": "alert", "icon": "fa-exclamation-triangle", "title": "Hoog verbruik gedetecteerd", "description": "Verbruik 25% hoger dan gemiddeld"},
  {"type": "success", "icon": "fa-check-circle", "title": "Optimale productie", "description": "Zonnepanelen presteren uitstekend"},
  {"type": "info", "icon": "fa-info-circle", "title": "Batterij bijna vol", "description": "Overweeg energie verkoop aan het net"}
]}'),
(1, 8, 'Weer Voorspelling', NULL, NULL, 2, 1, 2, 2, '{"temperature": "22°C", "day": "Zondag", "icon": "fa-sun", "forecast": [
  {"label": "Zonkracht:", "value": "8/10", "highlight": false},
  {"label": "Verwachte productie:", "value": "28 kWh", "highlight": true}
]}'),
(1, 9, 'Apparaten Status', NULL, NULL, 4, 1, 0, 3, '{"devices": [
  {"name": "Zonnepanelen", "icon": "fa-solar-panel", "color": "green", "status": "Actief", "status_class": "active"},
  {"name": "Batterij", "icon": "fa-car-battery", "color": "blue", "status": "Opladen", "status_class": "charging"},
  {"name": "Warmtepomp", "icon": "fa-temperature-high", "color": "orange", "status": "Actief", "status_class": "active"}
]}');

-- Create view for easier widget retrieval
CREATE VIEW dashboard_widgets AS
SELECT 
    uw.user_widget_id,
    uw.user_id,
    u.username,
    w.widget_type,
    COALESCE(uw.title, w.default_title) AS title,
    COALESCE(uw.icon, w.default_icon) AS icon,
    COALESCE(uw.icon_color, w.default_icon_color) AS icon_color,
    uw.column_span,
    uw.row_span,
    uw.grid_position_x,
    uw.grid_position_y,
    uw.is_visible,
    uw.widget_data,
    uw.last_updated
FROM 
    user_widgets uw
JOIN 
    widgets w ON uw.widget_id = w.widget_id
JOIN 
    users u ON uw.user_id = u.user_id
WHERE 
    uw.is_visible = TRUE
ORDER BY 
    uw.user_id, uw.grid_position_y, uw.grid_position_x;

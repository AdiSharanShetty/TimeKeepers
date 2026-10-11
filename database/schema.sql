-- ============================================================
-- TimeKeepers — demo database schema + seed data
-- Verified against a live XAMPP install (MariaDB 10.4.28) via
-- SHOW CREATE TABLE; structure below matches the running app exactly.
--
-- Import via phpMyAdmin (Import tab) or the command line:
--   mysql -u root < database/schema.sql
--
-- Intended for a FRESH database. Re-importing over an existing one
-- will fail on duplicate primary keys (that protects your data).
-- ============================================================

CREATE DATABASE IF NOT EXISTS `ecom`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;
USE `ecom`;

-- ------------------------------------------------------------
-- users: login accounts (PLAIN TEXT passwords by design — see
-- the Security notice in README.md; demo accounts only)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','farmer','user','NGO') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `otp` int(11) DEFAULT NULL,
  `otp_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- category: product categories (demo data)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `status` varchar(10) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `image` varchar(50) NOT NULL,
  `color` varchar(10) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- product: the 8 demo watches (ids, names and prices exactly as
-- in the live database; image files ship in backend/uploads/)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `pname` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `image` varchar(100) NOT NULL,
  `price` varchar(10) NOT NULL,
  `pricetype` varchar(50) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `status` varchar(11) NOT NULL,
  `userid` int(10) NOT NULL,
  `categoryid` int(10) NOT NULL,
  `Featured` varchar(10) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- cart_items: one row per user+product (empty in the seed)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product` (`user_id`,`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- orders: checkout orders (empty in the seed)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) NOT NULL,
  `net_total` decimal(10,2) NOT NULL,
  `status` enum('Pending','Approved','Dispatched','Delivered') NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ------------------------------------------------------------
-- order_transactions: line items per order (empty in the seed)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- payment: payment records (empty in the seed; no real card data)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment` (
  `id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `product_id` int(10) NOT NULL,
  `payment_number` varchar(20) DEFAULT NULL,
  `status` enum('SUCCESS','FAILIURE','','') NOT NULL DEFAULT 'SUCCESS',
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `price` varchar(15) DEFAULT NULL,
  `payment_method` varchar(20) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `card_number` varchar(20) DEFAULT NULL,
  `card_holder_name` varchar(100) DEFAULT NULL,
  `card_expiry_month` varchar(2) DEFAULT NULL,
  `card_expiry_year` varchar(4) DEFAULT NULL,
  `cvv` varchar(4) DEFAULT NULL,
  `upi_id` varchar(50) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `account_number` varchar(20) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- SEED DATA — demo only. No real users, orders or carts.
-- Passwords are stored as plain text (matches the app's login).
-- ============================================================

-- Demo accounts (see README "Test accounts")
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
  (2, 'Admin', 'admin@gmail.com', 'admin', 'admin'),
  (7, 'Demo User', 'user@gmail.com', '123', 'user');

-- Categories (images ship in backend/uploads/)
INSERT INTO `category` (`id`, `name`, `description`, `status`, `image`, `color`) VALUES
  (1, 'Rolex', 'watch', 'active', 'uploads/1784612281496-.png', '#ffffff'),
  (5, 'titan', 'premium brand', 'active', 'uploads/1784612291396-.jpg', '#ffffff');

-- The 8 demo watches (current ids, names, prices and image files)
INSERT INTO `product` (`id`, `pname`, `description`, `image`, `price`, `pricetype`, `status`, `userid`, `categoryid`, `Featured`) VALUES
  (1, 'Rolex Submariner', 'Premium Watch', 'uploads/1784869992713-Rolex_Submariner.webp', '7800', 'dollars', 'active', 0, 1, '1'),
  (2, 'Omega Speedmaster', 'Premium Watch', 'uploads/1784615427372-OmegaSpeedmaster.webp', '6200', 'dollars', 'active', 0, 1, '1'),
  (3, 'Casio G SHOCK', 'Watch', 'uploads/1785300523615-Casio_Gshock.webp', '120', 'dollars', 'active', 0, 1, '1'),
  (4, 'Seiko Presage', 'Watch', 'uploads/1784615466662-Seiko_presage.webp', '450', 'dollars', 'active', 0, 1, '1'),
  (5, 'Rolex Sea Gold', 'premium watch', 'uploads/1784615480154-Rolex_sea_gold.png', '66600', 'dollars', 'active', 7, 1, '1'),
  (6, 'Seiko Marinemaster Heritage Divers Watch', 'Premium Watch', 'uploads/1784615494160-Seiko_marinemaster.jpg', '4200', 'dollars', 'active', 0, 1, '1'),
  (7, 'Casio G SHOCK Coca Cola collaboration model', 'Watch', 'uploads/1784612193645-Casio_cocacola.webp', '180', 'dollars', 'active', 0, 1, '1'),
  (8, 'Roamer Premier Automatic Analog', 'Watch', 'uploads/1784615502504-titan_roamer.jpg', '1000', 'dollars', 'active', 0, 1, '1');

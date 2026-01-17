-- ===============================
-- UNA FILM BOOKING – INIT SCRIPT
-- ===============================

-- ⚠️ NEMA CREATE DATABASE
-- ⚠️ NEMA USE database
-- phpMyAdmin je već u bazi: unafilm_booking

-- 1) Ugasi FK provjeru da DROP radi bez problema
SET FOREIGN_KEY_CHECKS = 0;

-- 2) Drop redoslijed: prvo child tabela, pa parent
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS partners;
DROP TABLE IF EXISTS films;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ===============================
-- USERS
-- ===============================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'REFERENT') NOT NULL,
  active TINYINT DEFAULT 1
);

INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2b$10$T6kCNmwqZ1SkGhJVuUDRWeq6EOdab7/U5GHE3gf2u/.B2z6VUmEbS', 'ADMIN'),
('referent', '$2b$10$T6kCNmwqZ1SkGhJVuUDRWeq6EOdab7/U5GHE3gf2u/.B2z6VUmEbS', 'REFERENT'),
('referent2', '$2b$10$T6kCNmwqZ1SkGhJVuUDRWeq6EOdab7/U5GHE3gf2u/.B2z6VUmEbS', 'REFERENT');

-- ===============================
-- FILMS
-- ===============================
CREATE TABLE films (
  id INT AUTO_INCREMENT PRIMARY KEY,
  naziv VARCHAR(255) NOT NULL,
  originalni_naziv VARCHAR(255),
  trajanje_min INT,
  godina_distribucije INT,
  zanr VARCHAR(100),
  status ENUM('AKTIVAN','NEAKTIVAN') DEFAULT 'AKTIVAN',
  napomena TEXT
);

-- ===============================
-- PARTNERS
-- ===============================
CREATE TABLE partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  naziv VARCHAR(255) NOT NULL,
  grad VARCHAR(100),
  adresa VARCHAR(255),
  kontakt_osoba VARCHAR(100),
  email VARCHAR(100),
  telefon VARCHAR(50),
  active TINYINT DEFAULT 1,
  napomena TEXT
);

-- ===============================
-- BOOKINGS
-- ===============================
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  film_id INT NOT NULL,
  partner_id INT NOT NULL,
  datum_od DATE NOT NULL,
  datum_do DATE NOT NULL,
  tip_materijala VARCHAR(50) DEFAULT 'DCP',
  status ENUM('POTVRDJENO','ODBIJENO','NA_CEKANJU') DEFAULT 'NA_CEKANJU',
  napomena TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_booking_film
    FOREIGN KEY (film_id) REFERENCES films(id),

  CONSTRAINT fk_booking_partner
    FOREIGN KEY (partner_id) REFERENCES partners(id),

  CONSTRAINT fk_booking_user
    FOREIGN KEY (created_by) REFERENCES users(id)
);

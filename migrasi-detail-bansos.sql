-- Migration: tambah kolom detail_bansos ke tabel users
-- Jalankan di Neon SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS detail_bansos TEXT;

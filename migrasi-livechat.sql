-- Migration: tambah kolom is_livechat_agent ke tabel users
-- Jalankan di Neon SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_livechat_agent BOOLEAN DEFAULT FALSE;

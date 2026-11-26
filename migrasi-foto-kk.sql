-- Migration: tambah kolom foto_kk untuk foto kepala keluarga
-- Jalankan di Vercel Postgres console atau via npx prisma db push

-- DataWarga (penduduk tetap)
ALTER TABLE data_warga ADD COLUMN IF NOT EXISTS foto_kk TEXT;

-- PendudukSementara
ALTER TABLE penduduk_sementara ADD COLUMN IF NOT EXISTS foto_kk TEXT;

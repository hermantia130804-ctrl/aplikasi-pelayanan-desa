CREATE TABLE IF NOT EXISTS perbaikan_desil (
  perbaikan_desil_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  nomor_permohonan TEXT NOT NULL UNIQUE,
  nama_kk TEXT NOT NULL,
  nik_kk TEXT NOT NULL,
  no_kk TEXT NOT NULL,
  jumlah_anggota INTEGER NOT NULL,
  alamat TEXT NOT NULL,
  nama_jalan TEXT NOT NULL,
  no_rumah TEXT NOT NULL,
  jawaban JSONB NOT NULL DEFAULT '{}'::jsonb,
  foto_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'DIAJUKAN',
  catatan TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "users"("user_id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pd_user ON perbaikan_desil(user_id);
CREATE INDEX IF NOT EXISTS idx_pd_nomor ON perbaikan_desil(nomor_permohonan);
-- Tabel admins
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  nickname TEXT,
  division TEXT,
  avatar_url TEXT,
  order_index SMALLINT DEFAULT 0
);

-- Tabel sync_logs
CREATE TABLE sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL, -- 'success' or 'failed'
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Mengaktifkan RLS untuk admins dan sync_logs
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk tabel admins (Bisa dibaca publik)
CREATE POLICY "Public admins are viewable by everyone."
  ON admins FOR SELECT
  USING ( true );

-- Kebijakan untuk tabel sync_logs (Opsional, biasanya hanya admin/backend yang bisa insert/select)
-- Karena Backend (Service Role) mem-bypass RLS, kita bisa membiarkan tabel ini tanpa policy SELECT publik 
-- kecuali jika ingin ditampilkan di Frontend.

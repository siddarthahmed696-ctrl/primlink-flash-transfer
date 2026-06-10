
CREATE TABLE public.transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  title TEXT,
  message TEXT,
  sender_email TEXT,
  recipient_email TEXT,
  total_size BIGINT NOT NULL DEFAULT 0,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

CREATE TABLE public.transfer_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transfer_id UUID NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transfer_files_transfer_id ON public.transfer_files(transfer_id);
CREATE INDEX idx_transfers_share_code ON public.transfers(share_code);

GRANT SELECT, INSERT, UPDATE ON public.transfers TO anon, authenticated;
GRANT ALL ON public.transfers TO service_role;
GRANT SELECT, INSERT ON public.transfer_files TO anon, authenticated;
GRANT ALL ON public.transfer_files TO service_role;

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_files ENABLE ROW LEVEL SECURITY;

-- Anyone can create a transfer (anonymous file sharing)
CREATE POLICY "Anyone can create transfers" ON public.transfers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view transfers" ON public.transfers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update download count" ON public.transfers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can add files" ON public.transfer_files FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view files" ON public.transfer_files FOR SELECT TO anon, authenticated USING (true);

-- Storage policies for the public 'transfers' bucket
CREATE POLICY "Public upload to transfers bucket" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'transfers');
CREATE POLICY "Public read from transfers bucket" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'transfers');

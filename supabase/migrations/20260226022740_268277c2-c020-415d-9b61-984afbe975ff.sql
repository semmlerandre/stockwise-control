
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view settings" ON public.system_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update settings" ON public.system_settings
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert settings" ON public.system_settings
  FOR INSERT TO authenticated WITH CHECK (true);

INSERT INTO public.system_settings (key, value) VALUES 
  ('logo_url', ''),
  ('primary_color', '215 70% 28%'),
  ('accent_color', '160 60% 38%'),
  ('sidebar_color', '215 70% 22%'),
  ('system_name', 'InventoryPro')
ON CONFLICT (key) DO NOTHING;


CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert otp_codes" ON public.otp_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can select otp_codes" ON public.otp_codes FOR SELECT USING (true);
CREATE POLICY "Anyone can update otp_codes" ON public.otp_codes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete otp_codes" ON public.otp_codes FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_expired_otps
  AFTER INSERT ON public.otp_codes
  EXECUTE FUNCTION public.cleanup_expired_otps();

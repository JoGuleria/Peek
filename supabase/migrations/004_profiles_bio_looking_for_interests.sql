-- Add bio, looking_for, and interests to profiles.
-- Run once in Supabase SQL Editor. Safe to run: columns are added only if missing.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS looking_for text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';

-- Optional: enforce max length for bio (150 chars)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_bio_max_length'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_bio_max_length
      CHECK (bio IS NULL OR char_length(bio) <= 150);
  END IF;
END $$;

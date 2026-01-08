-- Adds email subject column for reserved/sent email records.
-- Safe to run on existing DB (nullable column).

ALTER TABLE public.emails
  ADD COLUMN IF NOT EXISTS subject character varying(255);

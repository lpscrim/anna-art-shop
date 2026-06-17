-- Add hidden column to products table
-- Run this in the Supabase SQL editor.
-- Existing products default to visible (false). The NOT NULL constraint
-- means .eq('hidden', false) works cleanly without null-handling.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

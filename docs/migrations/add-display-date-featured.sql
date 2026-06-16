-- Migration: add display_date and featured to products
-- Run this in the Supabase SQL editor.

-- 1. display_date: controls gallery sort order, defaults to today
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS display_date date DEFAULT CURRENT_DATE;

-- 2. Back-fill existing rows from created_at where available
UPDATE products
SET display_date = created_at::date
WHERE display_date IS NULL AND created_at IS NOT NULL;

-- 3. featured: marks paintings to show on the home page
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

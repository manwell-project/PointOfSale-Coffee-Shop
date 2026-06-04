-- Add barcode column to products table for barcode scanning feature
ALTER TABLE products ADD COLUMN barcode VARCHAR(50) UNIQUE;

-- Create index for faster barcode lookup
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

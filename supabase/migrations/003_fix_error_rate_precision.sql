-- Fix error_rate column precision
-- DECIMAL(5,4) only allows 0.0000 to 9.9999
-- Change to DECIMAL(6,4) to allow up to 99.9999 (or use REAL for simplicity)

ALTER TABLE endpoints
ALTER COLUMN error_rate TYPE DECIMAL(6,4);

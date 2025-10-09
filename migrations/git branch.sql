-- Migration: Create vehicle_views table for tracking unique views
-- Purpose: Track unique views per vehicle by user ID or IP address
-- Date: 2025-10-09

-- Create vehicle_views table
CREATE TABLE IF NOT EXISTS vehicle_views (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_views_user_vehicle 
  ON vehicle_views(user_id, vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_views_vehicle 
  ON vehicle_views(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_views_ip_vehicle 
  ON vehicle_views(ip_address, vehicle_id);

-- Add composite unique constraint to prevent duplicate views
-- A user (or IP if not logged in) can only view a vehicle once
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_views_unique_user 
  ON vehicle_views(user_id, vehicle_id) 
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_views_unique_ip 
  ON vehicle_views(ip_address, vehicle_id) 
  WHERE ip_address IS NOT NULL AND user_id IS NULL;

-- Comment on table
COMMENT ON TABLE vehicle_views IS 'Tracks unique views of vehicles by users or IP addresses';
COMMENT ON COLUMN vehicle_views.user_id IS 'User ID if logged in, NULL if anonymous';
COMMENT ON COLUMN vehicle_views.ip_address IS 'IP address for anonymous tracking';
COMMENT ON COLUMN vehicle_views.vehicle_id IS 'Reference to annonces.id (as TEXT)';

-- ============================================================================
-- PART 2: Atomic Counter Functions
-- ============================================================================
-- These functions ensure that view and favorite counters are incremented/
-- decremented atomically, preventing race conditions under concurrent requests.

-- Function to atomically increment vehicle view counter
CREATE OR REPLACE FUNCTION increment_vehicle_views(p_vehicle_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE annonces
  SET views = COALESCE(views, 0) + 1
  WHERE id = p_vehicle_id::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to atomically increment vehicle favorites counter
CREATE OR REPLACE FUNCTION increment_vehicle_favorites(p_vehicle_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE annonces
  SET favorites = COALESCE(favorites, 0) + 1
  WHERE id = p_vehicle_id::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to atomically decrement vehicle favorites counter (never below 0)
CREATE OR REPLACE FUNCTION decrement_vehicle_favorites(p_vehicle_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE annonces
  SET favorites = GREATEST(COALESCE(favorites, 0) - 1, 0)
  WHERE id = p_vehicle_id::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Comment on functions
COMMENT ON FUNCTION increment_vehicle_views IS 'Atomically increments the view counter for a vehicle';
COMMENT ON FUNCTION increment_vehicle_favorites IS 'Atomically increments the favorites counter for a vehicle';
COMMENT ON FUNCTION decrement_vehicle_favorites IS 'Atomically decrements the favorites counter for a vehicle (min 0)';

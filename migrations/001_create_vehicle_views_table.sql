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

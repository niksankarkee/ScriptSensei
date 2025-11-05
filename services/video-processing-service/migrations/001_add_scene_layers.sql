-- Migration: Add scene layers table and update video_scenes table
-- Date: 2025-11-05
-- Purpose: Support interactive scene editor with layers

-- Update video_scenes table to add new columns
ALTER TABLE video_scenes ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE video_scenes ADD COLUMN IF NOT EXISTS start_time REAL DEFAULT 0.0;
ALTER TABLE video_scenes ADD COLUMN IF NOT EXISTS end_time REAL;
ALTER TABLE video_scenes ADD COLUMN IF NOT EXISTS is_expanded INTEGER DEFAULT 0;
ALTER TABLE video_scenes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create scene_layers table
CREATE TABLE IF NOT EXISTS scene_layers (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    duration REAL NOT NULL,
    start_time REAL NOT NULL DEFAULT 0.0,
    end_time REAL NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    properties TEXT,  -- JSON stored as text
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scene_id) REFERENCES video_scenes(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scene_layers_scene_id ON scene_layers(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_layers_type ON scene_layers(type);
CREATE INDEX IF NOT EXISTS idx_scene_layers_order ON scene_layers(scene_id, order_index);

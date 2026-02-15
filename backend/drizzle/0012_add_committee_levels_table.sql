-- Create committee_levels table
CREATE TABLE committee_levels (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(50) NOT NULL UNIQUE,
  mandatory BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert default levels
INSERT INTO committee_levels (name, mandatory, display_order) VALUES
  ('not_necessary', false, 1),
  ('optional', false, 2),
  ('mandatory', true, 3);

-- Add level_id column to committee_thresholds
ALTER TABLE committee_thresholds ADD COLUMN level_id INTEGER;

-- Migrate existing data: map level string to level_id
UPDATE committee_thresholds ct
SET level_id = cl.id
FROM committee_levels cl
WHERE ct.level = cl.name;

-- Make level_id NOT NULL and add FK
ALTER TABLE committee_thresholds ALTER COLUMN level_id SET NOT NULL;
ALTER TABLE committee_thresholds ADD CONSTRAINT fk_threshold_level
  FOREIGN KEY (level_id) REFERENCES committee_levels(id) ON DELETE RESTRICT;
ALTER TABLE committee_thresholds ADD CONSTRAINT unique_level_id UNIQUE (level_id);

-- Drop old level column
ALTER TABLE committee_thresholds DROP COLUMN level;

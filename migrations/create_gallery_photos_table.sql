-- Migration: Create gallery_photos table

CREATE TABLE IF NOT EXISTS gallery_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_locked BOOLEAN DEFAULT true,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gallery_photos_creator_id ON gallery_photos(creator_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_order ON gallery_photos("order");

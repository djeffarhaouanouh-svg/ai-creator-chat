import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_adRJ2j6FoufP@ep-green-salad-abfjkeza-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const sql = neon(DATABASE_URL)

async function runMigration() {
  try {
    console.log('Running migrations...')

    // Add cover_image column
    try {
      await sql`ALTER TABLE creators ADD COLUMN IF NOT EXISTS cover_image TEXT`
      console.log('✅ Added cover_image column')
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️ cover_image column already exists')
      } else {
        throw error
      }
    }

    // Add updated_at column
    try {
      await sql`ALTER TABLE creators ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
      console.log('✅ Added updated_at column')
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️ updated_at column already exists')
      } else {
        throw error
      }
    }

    // Create gallery_photos table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS gallery_photos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
          url TEXT NOT NULL,
          is_locked BOOLEAN DEFAULT true,
          "order" INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      console.log('✅ Created gallery_photos table')
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️ gallery_photos table already exists')
      } else {
        throw error
      }
    }

    // Create indexes
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_gallery_photos_creator_id ON gallery_photos(creator_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_gallery_photos_order ON gallery_photos("order")`
      console.log('✅ Created indexes')
    } catch (error: any) {
      console.log('ℹ️ Indexes may already exist')
    }

    console.log('✅ All migrations completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()

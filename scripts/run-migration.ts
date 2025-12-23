import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_adRJ2j6FoufP@ep-green-salad-abfjkeza-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const sql = neon(DATABASE_URL)

async function runMigration() {
  try {
    console.log('Running migration to add cover_image and updated_at columns...')

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

    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()

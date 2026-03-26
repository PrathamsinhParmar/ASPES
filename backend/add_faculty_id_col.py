"""
Migration: Add faculty_id column to the projects table (SQLite-compatible).
Run from the /backend directory: python add_faculty_id_col.py
"""
import asyncio
from sqlalchemy import text
from app.database.connection import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as db:
        try:
            # Check if column already exists (SQLite PRAGMA)
            result = await db.execute(text("PRAGMA table_info(projects)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'faculty_id' in columns:
                print("ℹ️  faculty_id column already exists. Skipping migration.")
                return

            # SQLite does not support IF NOT EXISTS or inline FK in ALTER TABLE
            await db.execute(text("ALTER TABLE projects ADD COLUMN faculty_id VARCHAR(36)"))
            await db.commit()
            print("✅ Migration complete: faculty_id column added to projects table.")
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(main())


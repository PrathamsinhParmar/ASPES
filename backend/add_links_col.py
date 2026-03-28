"""
Migration: Add live_link and github_repo_link columns to the projects table (SQLite-compatible).
Run from the /backend directory: python add_links_col.py
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
            
            if 'live_link' not in columns:
                await db.execute(text("ALTER TABLE projects ADD COLUMN live_link VARCHAR(512)"))
                print("✅ Migration complete: live_link column added to projects table.")
            else:
                print("ℹ️  live_link column already exists. Skipping migration.")

            if 'github_repo_link' not in columns:
                await db.execute(text("ALTER TABLE projects ADD COLUMN github_repo_link VARCHAR(512)"))
                print("✅ Migration complete: github_repo_link column added to projects table.")
            else:
                print("ℹ️  github_repo_link column already exists. Skipping migration.")
                
            await db.commit()
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(main())

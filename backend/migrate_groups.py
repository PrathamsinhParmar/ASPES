"""
Migration: Add team_name, team_members, group_id to projects; create groups table.
Run from the `backend/` directory:
    python migrate_groups.py
"""
import asyncio
import sys
import os

# Adjust path so we can import app modules
sys.path.insert(0, os.path.dirname(__file__))

import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "aspes_dev.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Create groups table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            owner_id TEXT NOT NULL REFERENCES users(id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✓ groups table created (or already exists)")

    # 2. Add team_name to projects (if missing)
    cur.execute("PRAGMA table_info(projects)")
    columns = [row[1] for row in cur.fetchall()]

    if "team_name" not in columns:
        cur.execute("ALTER TABLE projects ADD COLUMN team_name TEXT")
        print("✓ Added team_name column to projects")
    else:
        print("  team_name already exists, skipping")

    if "team_members" not in columns:
        cur.execute("ALTER TABLE projects ADD COLUMN team_members TEXT")
        print("✓ Added team_members column to projects")
    else:
        print("  team_members already exists, skipping")

    if "group_id" not in columns:
        cur.execute("ALTER TABLE projects ADD COLUMN group_id TEXT REFERENCES groups(id)")
        print("✓ Added group_id column to projects")
    else:
        print("  group_id already exists, skipping")

    conn.commit()
    conn.close()
    print("\nMigration complete.")

if __name__ == "__main__":
    migrate()

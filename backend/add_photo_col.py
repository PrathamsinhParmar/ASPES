import sqlite3
import sys

try:
    db_path = 'aspes_dev.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Check if column exists first
    cursor.execute("PRAGMA table_info(users)")
    columns = [info[1] for info in cursor.fetchall()]
    if 'profile_photo' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN profile_photo VARCHAR(255)")
        conn.commit()
        print("Column 'profile_photo' successfully added!")
    else:
        print("Column 'profile_photo' already exists.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

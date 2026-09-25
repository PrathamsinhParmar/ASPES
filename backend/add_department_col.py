import sqlite3
import sys

try:
    db_path = 'aspes_dev.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Check if column exists first
    cursor.execute("PRAGMA table_info(users)")
    columns = [info[1] for info in cursor.fetchall()]
    if 'department' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN department VARCHAR(100)")
        conn.commit()
        print("Column 'department' successfully added!")
    else:
        print("Column 'department' already exists.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

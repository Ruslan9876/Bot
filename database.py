import sqlite3
from typing import Optional, Dict, Any

DB_PATH = 'bot.db'

USER_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    phone TEXT,
    gender TEXT,
    age INTEGER,
    city TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
'''

def get_conn():
    return sqlite3.connect(DB_PATH)

def init_db():
    with get_conn() as conn:
        conn.execute(USER_TABLE_SQL)
        conn.commit()

def get_user(telegram_id: int) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        cur = conn.execute('SELECT telegram_id, phone, gender, age, city, created_at FROM users WHERE telegram_id=?', (telegram_id,))
        row = cur.fetchone()
        if row:
            keys = ['telegram_id','phone','gender','age','city','created_at']
            return dict(zip(keys, row))
        return None
def insert_user(telegram_id, gender, age, city, phone=None):
    """Insert a new user; if exists, update provided fields (upsert)."""
    with get_conn() as conn:
        sql = (
            "INSERT INTO users (telegram_id, phone, gender, age, city) "
            "VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(telegram_id) DO UPDATE SET "
            "phone=COALESCE(excluded.phone, phone), "
            "gender=COALESCE(excluded.gender, gender), "
            "age=COALESCE(excluded.age, age), "
            "city=COALESCE(excluded.city, city)"
        )
        conn.execute(sql, (telegram_id, phone, gender, age, city))
        conn.commit()

def update_user(telegram_id, **fields):
    if not fields:
        return
    with get_conn() as conn:
        assignments = ','.join(f"{k}=?" for k in fields.keys())
        params = list(fields.values()) + [telegram_id]
        conn.execute(f"UPDATE users SET {assignments} WHERE telegram_id=?", params)
        conn.commit()
if __name__ == '__main__':
    init_db()
    print('DB initialized')

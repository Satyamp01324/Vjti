"""
Local Mock Database and Supabase Client
Provides an offline, self-contained SQLite database that matches Supabase's Python SDK API.
Enables local authentication, sessions persistence, and full test suite verification without cloud setup.
"""

import sqlite3
import json
import uuid
import datetime
import hashlib
import os
from typing import Any, Dict, List, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "..", "local_database.sqlite")

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users_profile (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        password_hash TEXT,
        created_at TEXT,
        updated_at TEXT
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS analysis_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        input_type TEXT,
        input_text TEXT,
        detected_language TEXT,
        language_name TEXT,
        transcription_method TEXT,
        audio_file_url TEXT,
        audio_file_name TEXT,
        audio_file_size INTEGER,
        audio_content_type TEXT,
        depression_score REAL,
        anxiety_score REAL,
        stress_score REAL,
        analysis_source TEXT,
        stress_level TEXT,
        anxiety_level TEXT,
        depression_level TEXT,
        tone TEXT,
        base_energy INTEGER,
        energy_score INTEGER,
        energy_category TEXT,
        recommended_task_type TEXT,
        task_description TEXT,
        task_suggestions TEXT,
        stress_impact INTEGER,
        anxiety_impact INTEGER,
        depression_impact INTEGER,
        tone_impact INTEGER,
        total_impact INTEGER,
        created_at TEXT,
        updated_at TEXT
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS energy_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        user_id TEXT,
        energy_score INTEGER,
        energy_category TEXT,
        stress_level TEXT,
        anxiety_level TEXT,
        depression_level TEXT,
        tone TEXT,
        recorded_at TEXT
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        task_name TEXT,
        planned_duration INTEGER,
        status TEXT,
        started_at TEXT,
        ended_at TEXT,
        focus_seconds INTEGER,
        break_seconds INTEGER,
        pause_count INTEGER,
        breaks_log TEXT,
        pauses_log TEXT,
        stats TEXT,
        emotional_start TEXT,
        emotional_end TEXT,
        energy_at_start INTEGER,
        energy_at_end INTEGER,
        recovery_plan TEXT,
        created_at TEXT,
        updated_at TEXT
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS timetable_blocks (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        weekday INTEGER,
        start_time TEXT,
        end_time TEXT,
        title TEXT,
        source TEXT,
        created_at TEXT,
        updated_at TEXT
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS commute_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE,
        minutes_each_way INTEGER,
        mode TEXT,
        days_applicable TEXT,
        created_at TEXT,
        updated_at TEXT
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS day_overrides (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        date TEXT,
        override_type TEXT,
        value TEXT,
        created_at TEXT
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        description TEXT,
        task_type TEXT,
        due_date TEXT,
        is_fixed_deadline BOOLEAN,
        estimated_minutes INTEGER,
        difficulty TEXT,
        spoon_cost REAL,
        state TEXT,
        planned_date TEXT,
        planned_slot TEXT,
        moves_count INTEGER,
        created_at TEXT,
        updated_at TEXT
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS game_results (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        date TEXT,
        time_of_day TEXT,
        game TEXT,
        summary TEXT,
        valid BOOLEAN,
        skipped BOOLEAN,
        created_at TEXT
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS evening_labels (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        date TEXT,
        value INTEGER,
        skipped BOOLEAN,
        created_at TEXT
    )""")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        created_at TEXT
    )""")

    # Seed the standard test user if not already present
    test_user_id = "00000000-0000-0000-0000-000000000001"
    cur.execute("SELECT id FROM users_profile WHERE email = ?", ("tester.neuropilot@example.com",))
    row = cur.fetchone()
    if not row:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        cur.execute("""
        INSERT INTO users_profile (id, email, full_name, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (test_user_id, "tester.neuropilot@example.com", "Test User", hash_pw("Password@1234"), now, now))

    conn.commit()
    conn.close()

# Initialize DB on load
init_db()


class MockUser:
    def __init__(self, uid: str, email: str):
        self.id = uid
        self.email = email

class MockSession:
    def __init__(self, uid: str, email: str):
        self.access_token = f"mock-token-{uid}"
        self.refresh_token = f"mock-refresh-{uid}"
        self.user = MockUser(uid, email)

class MockAuthResponse:
    def __init__(self, user: Optional[MockUser], session: Optional[MockSession]):
        self.user = user
        self.session = session

class MockAuth:
    def sign_up(self, credentials: Dict[str, str]) -> MockAuthResponse:
        email = credentials.get("email", "").lower().strip()
        password = credentials.get("password", "")
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users_profile WHERE email = ?", (email,))
        if cur.fetchone():
            conn.close()
            raise Exception("A user with this email already exists.")
        
        uid = str(uuid.uuid4())
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        cur.execute("""
        INSERT INTO users_profile (id, email, full_name, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (uid, email, credentials.get("full_name", ""), hash_pw(password), now, now))
        conn.commit()
        conn.close()
        u = MockUser(uid, email)
        s = MockSession(uid, email)
        return MockAuthResponse(user=u, session=s)

    def sign_in_with_password(self, credentials: Dict[str, str]) -> MockAuthResponse:
        email = credentials.get("email", "").lower().strip()
        password = credentials.get("password", "")
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, password_hash FROM users_profile WHERE email = ?", (email,))
        row = cur.fetchone()
        conn.close()
        if not row:
            raise Exception("Invalid email or password.")
        
        if row["password_hash"] and row["password_hash"] != hash_pw(password):
            raise Exception("Invalid email or password.")
        
        uid = row["id"]
        u = MockUser(uid, email)
        s = MockSession(uid, email)
        return MockAuthResponse(user=u, session=s)


class MockQueryBuilder:
    def __init__(self, table_name: str):
        self.table_name = table_name
        self._action = "select"
        self._select_cols = "*"
        self._insert_data = None
        self._update_data = None
        self._where_conditions = []
        self._order_by = None
        self._limit = None
        self._is_upsert = False
        self._on_conflict = None

    def select(self, cols: str = "*"):
        self._action = "select"
        self._select_cols = cols
        return self

    def insert(self, data: Any):
        self._action = "insert"
        self._insert_data = data
        return self

    def update(self, data: Dict[str, Any]):
        self._action = "update"
        self._update_data = data
        return self

    def delete(self):
        self._action = "delete"
        return self

    def upsert(self, data: Any, on_conflict: Optional[str] = None):
        self._action = "upsert"
        self._insert_data = data
        self._on_conflict = on_conflict
        return self

    def eq(self, column: str, value: Any):
        self._where_conditions.append((column, "=", value))
        return self

    def order(self, column: str, desc: bool = False):
        direction = "DESC" if desc else "ASC"
        self._order_by = f"{column} {direction}"
        return self

    def limit(self, count: int):
        self._limit = count
        return self

    def maybe_single(self):
        self._limit = 1
        self._single = True
        return self

    def single(self):
        self._limit = 1
        self._single = True
        return self

    def execute(self):
        conn = get_connection()
        cur = conn.cursor()
        result_data = []

        try:
            if self._action == "insert" or self._action == "upsert":
                rows_to_insert = self._insert_data if isinstance(self._insert_data, list) else [self._insert_data]
                inserted_records = []
                for item in rows_to_insert:
                    record = dict(item)
                    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
                    if self.table_name == "energy_history":
                        if "recorded_at" not in record:
                            record["recorded_at"] = now
                    else:
                        if "id" not in record or not record["id"]:
                            record["id"] = str(uuid.uuid4())
                        if "created_at" not in record:
                            record["created_at"] = now
                        if "updated_at" not in record:
                            record["updated_at"] = now

                    # Serialize any dict or list values to JSON
                    clean_record = {}
                    for k, v in record.items():
                        if isinstance(v, (dict, list)):
                            clean_record[k] = json.dumps(v)
                        else:
                            clean_record[k] = v

                    cols = list(clean_record.keys())
                    vals = list(clean_record.values())
                    placeholders = ", ".join(["?"] * len(cols))
                    col_str = ", ".join(cols)

                    if self._action == "upsert" and self._on_conflict:
                        conflict_cols = [c.strip() for c in self._on_conflict.split(",")]
                        update_parts = [f"{col}=excluded.{col}" for col in cols if col not in conflict_cols]
                        if update_parts:
                            sql = f"INSERT INTO {self.table_name} ({col_str}) VALUES ({placeholders}) ON CONFLICT({self._on_conflict}) DO UPDATE SET {', '.join(update_parts)}"
                        else:
                            sql = f"INSERT INTO {self.table_name} ({col_str}) VALUES ({placeholders}) ON CONFLICT({self._on_conflict}) DO NOTHING"
                    else:
                        sql = f"INSERT INTO {self.table_name} ({col_str}) VALUES ({placeholders})"

                    try:
                        cur.execute(sql, vals)
                    except Exception as ins_err:
                        # Fallback for tables without some optional columns
                        print(f"[mock_db] Insert error on {self.table_name}: {ins_err}")
                    inserted_records.append(record)

                conn.commit()
                result_data = inserted_records

            elif self._action == "update":
                set_parts = []
                vals = []
                now = datetime.datetime.now(datetime.timezone.utc).isoformat()
                self._update_data["updated_at"] = now
                for k, v in self._update_data.items():
                    set_parts.append(f"{k} = ?")
                    vals.append(json.dumps(v) if isinstance(v, (dict, list)) else v)

                where_sql = ""
                if self._where_conditions:
                    where_clauses = [f"{col} {op} ?" for col, op, val in self._where_conditions]
                    where_sql = " WHERE " + " AND ".join(where_clauses)
                    vals.extend([val for col, op, val in self._where_conditions])

                sql = f"UPDATE {self.table_name} SET {', '.join(set_parts)}{where_sql}"
                cur.execute(sql, vals)
                conn.commit()
                result_data = [self._update_data]

            elif self._action == "delete":
                where_sql = ""
                vals = []
                if self._where_conditions:
                    where_clauses = [f"{col} {op} ?" for col, op, val in self._where_conditions]
                    where_sql = " WHERE " + " AND ".join(where_clauses)
                    vals = [val for col, op, val in self._where_conditions]
                cur.execute(f"DELETE FROM {self.table_name}{where_sql}", vals)
                conn.commit()
                result_data = []

            elif self._action == "select":
                where_sql = ""
                vals = []
                if self._where_conditions:
                    where_clauses = [f"{col} {op} ?" for col, op, val in self._where_conditions]
                    where_sql = " WHERE " + " AND ".join(where_clauses)
                    vals = [val for col, op, val in self._where_conditions]

                order_sql = f" ORDER BY {self._order_by}" if self._order_by else ""
                limit_sql = f" LIMIT {self._limit}" if self._limit else ""

                sql = f"SELECT * FROM {self.table_name}{where_sql}{order_sql}{limit_sql}"
                cur.execute(sql, vals)
                rows = cur.fetchall()

                for row in rows:
                    item = dict(row)
                    # Deserialise JSON strings
                    for k, v in item.items():
                        if isinstance(v, str) and (v.startswith("{") or v.startswith("[")):
                            try:
                                item[k] = json.loads(v)
                            except Exception:
                                pass
                    result_data.append(item)

        finally:
            conn.close()

        class ExecResult:
            def __init__(self, data):
                self.data = data

        if getattr(self, "_single", False):
            single_result = result_data[0] if result_data else None
            return ExecResult(single_result)

        return ExecResult(result_data)


class MockStorageBucket:
    def __init__(self, name: str):
        self.name = name

    def upload(self, path: str, file: bytes, file_options: Optional[Dict] = None):
        return {"Key": f"{self.name}/{path}"}

    def get_public_url(self, path: str) -> str:
        return f"http://localhost:8000/audio_files/{path}"


class MockStorage:
    def from_(self, bucket_name: str) -> MockStorageBucket:
        return MockStorageBucket(bucket_name)


class MockSupabaseClient:
    def __init__(self):
        self.auth = MockAuth()
        self.storage = MockStorage()

    def table(self, table_name: str) -> MockQueryBuilder:
        return MockQueryBuilder(table_name)

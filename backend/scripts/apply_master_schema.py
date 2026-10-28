"""
Automated runner to apply master_supabase_schema.sql to Supabase Postgres.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

def apply_schema(connection_string=None):
    if not connection_string:
        connection_string = os.getenv("SUPABASE_DB_URL")
    
    if not connection_string:
        print("ERROR: No database connection string provided.")
        return False

    try:
        import psycopg2
        print("Connecting to Supabase PostgreSQL database...")
        conn = psycopg2.connect(connection_string)
        conn.autocommit = True
        cur = conn.cursor()

        sql_path = os.path.join(os.path.dirname(__file__), "master_supabase_schema.sql")
        with open(sql_path, "r", encoding="utf-8") as f:
            sql = f.read()

        print(f"Applying schema from {sql_path}...")
        cur.execute(sql)
        print("✓ All tables, views, triggers, and storage bucket created successfully!")
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error applying schema: {e}")
        return False

if __name__ == "__main__":
    conn_str = sys.argv[1] if len(sys.argv) > 1 else None
    apply_schema(conn_str)


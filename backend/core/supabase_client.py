import os
import logging
from typing import Optional
from dotenv import load_dotenv

# Try multiple locations for .env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv()

url: Optional[str] = os.environ.get("SUPABASE_URL")
key: Optional[str] = os.environ.get("SUPABASE_KEY")

logger = logging.getLogger("supabase_client")

try:
    if url and key and not url.startswith("your_") and "mock" not in url:
        from supabase import create_client, Client
        supabase = create_client(url, key)
        logger.info("Connected to Cloud Supabase client.")
    else:
        logger.info("Using local SQLite MockSupabaseClient.")
        from core.mock_database import MockSupabaseClient
        supabase = MockSupabaseClient()
except Exception as e:
    logger.warning(f"Failed to initialize Supabase client: {e}; falling back to local MockSupabaseClient")
    from core.mock_database import MockSupabaseClient
    supabase = MockSupabaseClient()

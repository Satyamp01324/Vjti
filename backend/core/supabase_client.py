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
    if url and key and not url.startswith("your_"):
        from supabase import create_client, Client
        supabase: Optional[Client] = create_client(url, key)
    else:
        logger.warning("SUPABASE_URL or SUPABASE_KEY missing; using mock/null client.")
        supabase = None
except Exception as e:
    logger.warning(f"Failed to initialize Supabase client: {e}; using None")
    supabase = None

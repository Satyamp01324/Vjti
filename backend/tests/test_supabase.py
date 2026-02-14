"""
Simple test script to verify Supabase connection from backend
Run this with: python test_supabase.py
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 50)
print("🧪 Testing Supabase Configuration")
print("=" * 50)

# Check environment variables
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"\n✓ SUPABASE_URL: {url[:30] + '...' if url else '❌ Not configured'}")
print(f"✓ SUPABASE_KEY: {'✓ Configured' if key else '❌ Not configured'}")

if not url or not key or url == "your_supabase_url_here":
    print("\n❌ Please configure your .env file with actual Supabase credentials")
    print("\nCreate a .env file in the backend directory with:")
    print("SUPABASE_URL=your_actual_url")
    print("SUPABASE_KEY=your_actual_key")
    exit(1)

# Try to import and connect to Supabase
try:
    from supabase_client import supabase
    print("\n✓ Supabase client imported successfully")
    
    # Try a simple query (you'll need to replace 'test_table' with an actual table)
    print("\nAttempting to connect to Supabase...")
    response = supabase.table('test_table').select("*").limit(1).execute()
    
    print("✅ SUCCESS! Connected to Supabase!")
    print(f"Response: {response}")
    
except Exception as e:
    print(f"\n❌ Error connecting to Supabase:")
    print(f"   {str(e)}")
    print("\nMake sure:")
    print("1. Your credentials are correct")
    print("2. You have created a table in Supabase")
    print("3. Replace 'test_table' with your actual table name")

print("\n" + "=" * 50)

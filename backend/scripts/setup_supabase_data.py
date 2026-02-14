"""
Automated Supabase Table Creation Script
This script will create a sample table and insert test data directly from Python
"""
import os
from dotenv import load_dotenv
from supabase_client import supabase

# Load environment variables
load_dotenv()

def create_and_populate_table():
    """Create a sample table and add test data"""
    
    print("=" * 60)
    print("🚀 Setting up Supabase with sample data")
    print("=" * 60)
    
    # Test 1: Create and insert data
    print("\n📝 Creating 'items' table and inserting sample data...")
    print("   (Note: Table creation via API has limitations)")
    print("   If this fails, use the supabase_setup.sql file instead.\n")
    
    # Try to insert data (this will work if table exists)
    try:
        sample_items = [
            {
                "name": "Python Test Item",
                "description": "Created automatically by Python script"
            },
            {
                "name": "FastAPI Demo Item",
                "description": "Testing FastAPI + Supabase integration"
            },
            {
                "name": "React Frontend Item",
                "description": "Testing React + Supabase connection"
            }
        ]
        
        print("Attempting to insert sample data...")
        response = supabase.table('items').insert(sample_items).execute()
        
        print("✅ SUCCESS! Sample data inserted:")
        for item in response.data:
            print(f"   - {item.get('name')}: {item.get('description')}")
        
        # Verify by reading back
        print("\n📖 Reading back all items from database...")
        response = supabase.table('items').select("*").execute()
        print(f"✅ Found {len(response.data)} items in database:")
        for item in response.data:
            print(f"   ID: {item.get('id')}, Name: {item.get('name')}")
            
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ Error: {error_msg}")
        
        if "table" in error_msg.lower() and "not" in error_msg.lower():
            print("\n" + "=" * 60)
            print("⚠️  TABLE DOESN'T EXIST YET")
            print("=" * 60)
            print("\nTo create the table, follow these steps:")
            print("\n1. Go to your Supabase Dashboard: https://supabase.com/dashboard")
            print("2. Select your project")
            print("3. Click on 'SQL Editor' in the left sidebar")
            print("4. Click 'New Query'")
            print("5. Copy the contents of 'supabase_setup.sql' (in backend folder)")
            print("6. Paste into the SQL Editor")
            print("7. Click 'Run' button")
            print("\nOR use the Table Editor:")
            print("1. Click 'Table Editor' in left sidebar")
            print("2. Click 'New Table'")
            print("3. Name it 'items'")
            print("4. Add columns:")
            print("   - id: int8 (Primary, Auto-increment)")
            print("   - name: text (Required)")
            print("   - description: text")
            print("   - created_at: timestamptz (Default: now())")
            print("5. Enable RLS (Row Level Security)")
            print("6. Add a policy for SELECT: 'true'")
            print("\nThen run this script again!")
        else:
            print(f"\nUnexpected error occurred. Full details:")
            print(f"{error_msg}")

if __name__ == "__main__":
    create_and_populate_table()

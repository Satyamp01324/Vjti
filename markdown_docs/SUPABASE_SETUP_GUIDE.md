# 🚀 Supabase Setup Guide

## Your Supabase database is empty. Here's how to set it up:

### Option 1: Quick Setup via SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Setup Script**
   - Open the file `backend/supabase_setup.sql`
   - Copy all the contents
   - Paste into the SQL Editor
   - Click "Run" button (or press Ctrl+Enter)

4. **Verify**
   - Click "Table Editor" in left sidebar
   - You should see the "items" table with 4 sample rows

### Option 2: Manual Table Creation via UI

1. **Go to Table Editor**
   - Click "Table Editor" in left sidebar
   - Click "New table"

2. **Create 'items' table**
   - Name: `items`
   - Columns:
     ```
     id          | int8        | Primary key, Auto-increment
     name        | text        | NOT NULL
     description | text        | Nullable
     created_at  | timestamptz | Default: now()
     ```

3. **Configure Security**
   - Enable RLS (Row Level Security) toggle
   - Click "Add Policy"
   - Policy name: "Allow public access"
   - Policy command: SELECT
   - Policy definition: `true`
   - Add another policy for INSERT with: `true`

4. **Add Sample Data**
   - Click "Insert row" button
   - Add a few test items
   - OR run: `python backend/setup_supabase_data.py`

### Option 3: Automated Setup (After creating table)

Once you've created the table using Option 1 or 2, run:

```bash
cd backend
python setup_supabase_data.py
```

This will automatically populate the table with sample data.

---

## Testing Your Setup

After setting up the database:

1. **Backend Test**
   ```bash
   cd backend
   python test_supabase.py
   ```

2. **API Test**
   - Visit: http://127.0.0.1:8000/docs
   - Try the `/api/items` endpoint
   - Or use: http://127.0.0.1:8000/api/items

3. **Frontend Test**
   - Open: http://localhost:5173
   - Click "Show Supabase Test"
   - Click "Test Backend Connection"

---

## Common Issues

### "Could not find the table"
- The table doesn't exist yet
- Use Option 1 or 2 above to create it

### "row-level security policy"
- RLS is enabled but no policies exist
- Add the policies from the SQL script

### "permission denied"
- Check your RLS policies
- Make sure you're using the anon key (not service key)

---

## Your Current Credentials

Backend (.env):
- ✅ SUPABASE_URL is configured
- ✅ SUPABASE_KEY is configured

Frontend (.env):
- Check if VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set

Both servers are running and ready to test once the database is set up!

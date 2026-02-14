"""
Supabase Query Reference & Manual Test Script

Usage:
  cd backend
  python -m scripts.supabase_queries               # run all example queries
  python -m scripts.supabase_queries --insert       # insert a sample row
  python -m scripts.supabase_queries --upload FILE  # upload an mp3/wav to storage

These are the same queries the pipeline uses internally.
Use this file as a reference or to manually push/pull data.
"""

import sys
import json
import argparse

sys.path.insert(0, ".")

from dotenv import load_dotenv
load_dotenv()

from core.supabase_client import supabase


# ============================================================
# INSERT QUERIES
# ============================================================

def insert_analysis_session(data: dict):
    """
    Insert a full analysis session.

    Required fields:
      input_type          'text' | 'voice'
      input_text          str

    Optional (all populated automatically by the pipeline):
      depression_score, anxiety_score, stress_score   (float 0-1)
      stress_level, anxiety_level, depression_level   ('high'|'medium'|'low')
      tone                                            ('positive'|'neutral'|'negative')
      energy_score                                    (int 0-100)
      energy_category                                 ('high_energy'|'medium_energy'|'low_energy')
      recommended_task_type                           ('heavy'|'medium'|'light')
      task_description, task_suggestions              str / JSON array
      stress_impact, anxiety_impact, depression_impact, tone_impact, total_impact  (int)
      audio_file_url, audio_file_name, audio_file_size, audio_content_type
      detected_language, language_name, transcription_method
    """
    resp = supabase.table("analysis_sessions").insert(data).execute()
    return resp.data


def insert_energy_history(session_id: str, energy_score: int, extra: dict = None):
    """Insert a row into energy_history (for trend tracking)."""
    row = {
        "session_id": session_id,
        "energy_score": energy_score,
    }
    if extra:
        row.update(extra)
    resp = supabase.table("energy_history").insert(row).execute()
    return resp.data


# ============================================================
# SELECT QUERIES
# ============================================================

def get_all_sessions(limit=50):
    """SELECT * FROM analysis_sessions ORDER BY created_at DESC LIMIT {limit}"""
    return (
        supabase.table("analysis_sessions")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
        .data
    )


def get_session_by_id(session_id: str):
    """SELECT * FROM analysis_sessions WHERE id = '{session_id}'"""
    return (
        supabase.table("analysis_sessions")
        .select("*")
        .eq("id", session_id)
        .single()
        .execute()
        .data
    )


def get_sessions_by_type(input_type: str, limit=20):
    """SELECT * FROM analysis_sessions WHERE input_type = '{input_type}'"""
    return (
        supabase.table("analysis_sessions")
        .select("*")
        .eq("input_type", input_type)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
        .data
    )


def get_low_energy_sessions(limit=20):
    """SELECT * FROM analysis_sessions WHERE energy_category = 'low_energy'"""
    return (
        supabase.table("analysis_sessions")
        .select("*")
        .eq("energy_category", "low_energy")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
        .data
    )


def get_energy_history(limit=50):
    """SELECT * FROM energy_history ORDER BY recorded_at DESC LIMIT {limit}"""
    return (
        supabase.table("energy_history")
        .select("*")
        .order("recorded_at", desc=True)
        .limit(limit)
        .execute()
        .data
    )


def get_daily_energy_averages():
    """SELECT * FROM daily_energy_avg  (uses the SQL view)"""
    return supabase.table("daily_energy_avg").select("*").execute().data


def get_sessions_with_audio():
    """SELECT * FROM analysis_sessions WHERE audio_file_url IS NOT NULL"""
    return (
        supabase.table("analysis_sessions")
        .select("*")
        .not_.is_("audio_file_url", "null")
        .order("created_at", desc=True)
        .execute()
        .data
    )


# ============================================================
# STORAGE — audio file upload / download
# ============================================================

def upload_audio(file_path: str):
    """Upload a local audio file to Supabase Storage bucket 'audio-files'."""
    import os, uuid
    ext = os.path.splitext(file_path)[1] or ".mp3"
    storage_path = f"uploads/{uuid.uuid4().hex}{ext}"

    with open(file_path, "rb") as f:
        data = f.read()

    supabase.storage.from_("audio-files").upload(
        path=storage_path,
        file=data,
        file_options={"content-type": f"audio/{ext.lstrip('.')}"},
    )

    url = supabase.storage.from_("audio-files").get_public_url(storage_path)
    print(f"  Uploaded: {file_path} -> {url}")
    return url


def list_audio_files():
    """List all files in the 'audio-files' bucket."""
    return supabase.storage.from_("audio-files").list("uploads")


def download_audio(storage_path: str, save_to: str):
    """Download a file from Supabase Storage."""
    data = supabase.storage.from_("audio-files").download(storage_path)
    with open(save_to, "wb") as f:
        f.write(data)
    print(f"  Downloaded: {storage_path} -> {save_to}")


# ============================================================
# DELETE QUERIES
# ============================================================

def delete_session(session_id: str):
    """DELETE FROM analysis_sessions WHERE id = '{session_id}'
    (cascades to energy_history via FK)"""
    return (
        supabase.table("analysis_sessions")
        .delete()
        .eq("id", session_id)
        .execute()
        .data
    )


def delete_all_sessions():
    """DELETE FROM analysis_sessions (clears everything)"""
    return (
        supabase.table("analysis_sessions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")  # match all
        .execute()
        .data
    )


# ============================================================
# CLI demo
# ============================================================

def demo_insert():
    """Insert one sample session manually."""
    sample = {
        "input_type": "text",
        "input_text": "I'm feeling a bit overwhelmed with work today.",
        "depression_score": 0.25,
        "anxiety_score": 0.60,
        "stress_score": 0.70,
        "analysis_source": "local_model",
        "stress_level": "high",
        "anxiety_level": "medium",
        "depression_level": "low",
        "tone": "negative",
        "base_energy": 70,
        "energy_score": 35,
        "energy_category": "low_energy",
        "recommended_task_type": "light",
        "task_description": "You have low energy. Focus on rest and self-care.",
        "task_suggestions": json.dumps(["Take a break", "Light stretching", "Listen to music"]),
        "stress_impact": -20,
        "anxiety_impact": -8,
        "depression_impact": 0,
        "tone_impact": -5,
        "total_impact": -33,
    }
    rows = insert_analysis_session(sample)
    session = rows[0]
    print(f"  Inserted: {session['id']}")
    insert_energy_history(session["id"], sample["energy_score"], {
        "energy_category": sample["energy_category"],
        "stress_level": sample["stress_level"],
    })
    print(f"  Energy history row added")
    return session


def demo_queries():
    """Run all SELECT queries and print results."""
    print("\n--- All sessions ---")
    for s in get_all_sessions(5):
        print(f"  {s['id'][:8]}… | e={s.get('energy_score','?'):>3} | {(s.get('input_text') or '')[:50]}")

    print("\n--- Energy history ---")
    for h in get_energy_history(5):
        print(f"  {h['recorded_at'][:19]} | e={h['energy_score']}")

    print("\n--- Daily averages ---")
    for d in get_daily_energy_averages():
        print(f"  {d.get('date')} | avg={d.get('avg_energy')} | n={d.get('session_count')}")

    print("\n--- Audio sessions ---")
    for s in get_sessions_with_audio():
        print(f"  {s['id'][:8]}… | {s.get('audio_file_name')} | {s.get('audio_file_url','')[:60]}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Supabase query reference & test")
    parser.add_argument("--insert", action="store_true", help="Insert a sample row")
    parser.add_argument("--upload", type=str, help="Upload an audio file to storage")
    args = parser.parse_args()

    if args.insert:
        print("Inserting sample…")
        demo_insert()
    elif args.upload:
        print(f"Uploading {args.upload}…")
        upload_audio(args.upload)
    else:
        demo_queries()

import sys
import os
import asyncio
from datetime import datetime

# Add parent directory to path to import backend modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.supabase_client import supabase
from models.text_classification import clinical_predict
from core.energy_flow import calculate_energy_from_analysis
from core.pipeline import _save_session

def simulate_voice_analysis(text="I am very exhausted"):
    print(f"\n🎧 Simulating Voice Input: '{text}'")
    
    # 1. Analyze Text (Simulate Voice -> Text)
    print("🧠 Running Clinical Analysis...")
    analysis = clinical_predict(text)
    print(f"   Result: Depression={analysis.get('Depression')}, Anxiety={analysis.get('Anxiety')}, Stress={analysis.get('Stress')}")

    # 2. Calculate Energy
    print("⚡ Calculating Energy Flow...")
    energy_flow = calculate_energy_from_analysis(analysis)
    energy_calc = energy_flow["energy_calculation"]
    task_rec = energy_flow["task_recommendation"]
    levels = energy_flow["classified_levels"]
    impacts = energy_calc["impact_breakdown"]
    
    print(f"   Energy Score: {energy_calc['final_energy_score']}%")
    print(f"   Status: Stress={levels['stress']}, Anxiety={levels['anxiety']}")

    # 3. Construct DB Row (Mimic pipeline.py)
    db_row = {
        "input_type": "voice",
        "input_text": text,
        
        # Mimic voice metadata
        "detected_language": "en",
        "language_name": "English",
        "transcription_method": "simulation",
        "audio_file_name": "manual_test.wav",
        
        # Analysis
        "depression_score": analysis.get("Depression"),
        "anxiety_score": analysis.get("Anxiety"),
        "stress_score": analysis.get("Stress"),
        
        # Classified Levels
        "stress_level": levels["stress"],
        "anxiety_level": levels["anxiety"],
        "depression_level": levels["depression"],
        "tone": levels["tone"],
        
        # Energy
        "energy_score": energy_calc["final_energy_score"],
        "energy_category": task_rec["energy_category"],
        "recommended_task_type": task_rec["recommended_task_type"],
        
        # Impacts
        "stress_impact": impacts["stress_impact"],
        "anxiety_impact": impacts["anxiety_impact"],
        "depression_impact": impacts["depression_impact"],
        "tone_impact": impacts["tone_impact"],
        "total_impact": impacts["total_impact"],
        
        "created_at": datetime.utcnow().isoformat()
    }

    # 4. Insert into Supabase
    print("💾 Inserting into Database...")
    try:
        data = supabase.table("analysis_sessions").insert(db_row).execute()
        print("✅ Success! Data pushed to Supabase.")
        print("🚀 CHECK YOUR DASHBOARD NOW - It should reflect these changes.")
    except Exception as e:
        print(f"❌ Database Insert Failed: {e}")

if __name__ == "__main__":
    simulate_voice_analysis()

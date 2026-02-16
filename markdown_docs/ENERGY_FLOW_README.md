# Energy Flow System - Quick Reference

## ✅ Implementation Complete

The energy flow system has been successfully implemented with **dynamic integration** of ML model scores.

## Key Features

### 1. **Dynamic Score Extraction** ✓
- Anxiety, Depression, and Stress scores are automatically extracted from ML predictions
- Scores are in probability format (0.0 to 1.0)
- Real-time classification into high/medium/low levels

### 2. **Automatic Energy Calculation** ✓
- Base energy: 70
- Dynamic impact calculation based on extracted scores
- Final energy score: 0-100 range

### 3. **JSON Output** ✓
All results are returned in structured JSON format including:
- Raw probabilities from ML model
- Classified levels (high/medium/low)
- Energy calculation breakdown
- Task recommendations with suggestions

## Quick Test

Start the server and test:

```bash
# Start server
cd backend
uvicorn main:app --reload

# Test text analysis with energy (in another terminal)
curl -X POST http://localhost:8000/api/text-analysis-with-energy \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel stressed and anxious about everything"}'
```

## Example Flow

**Input Text:** "I feel stressed and anxious about everything"

**ML Model Output:**
```json
{
  "Depression": 0.42,
  "Anxiety": 0.75,
  "Stress": 0.81
}
```

**Dynamic Processing:**
1. Extract scores → Depression: 0.42, Anxiety: 0.75, Stress: 0.81
2. Classify levels → Depression: medium, Anxiety: high, Stress: high
3. Determine tone → negative (average: 0.66)
4. Calculate energy → 70 + (-20) + (-15) + (-12) + (-5) = **18**
5. Recommend tasks → **light** (rest, self-care, relaxation)

**JSON Response:**
```json
{
  "status": "success",
  "input_text": "I feel stressed and anxious about everything",
  "analysis": {
    "Depression": 0.42,
    "Anxiety": 0.75,
    "Stress": 0.81,
    "source": "local_model"
  },
  "energy_flow": {
    "raw_probabilities": {
      "depression": 0.42,
      "anxiety": 0.75,
      "stress": 0.81
    },
    "classified_levels": {
      "stress": "high",
      "anxiety": "high",
      "depression": "medium",
      "tone": "negative"
    },
    "energy_calculation": {
      "base_energy": 70,
      "impact_breakdown": {
        "stress_impact": -20,
        "anxiety_impact": -15,
        "depression_impact": -12,
        "tone_impact": -5,
        "total_impact": -52
      },
      "final_energy_score": 18
    },
    "task_recommendation": {
      "energy_category": "low_energy",
      "recommended_task_type": "light",
      "suggestions": [
        "Take breaks and rest",
        "Do light stretching or breathing exercises",
        "Engage in relaxing activities (reading, music)",
        "Practice self-care and mindfulness"
      ]
    }
  }
}
```

## API Endpoints

| Endpoint | Purpose | Input | Output |
|----------|---------|-------|--------|
| `/api/text-analysis-with-energy` | Text → Energy | JSON with text | Full analysis + energy |
| `/api/voice-input-with-energy` | Voice → Energy | Audio file | Transcription + analysis + energy |
| `/api/energy-calculate` | Manual calculation | Levels + tone | Energy + recommendations |
| `/api/test-energy-flow` | Test scenarios | None | Multiple test cases |

## Files Created

1. **`energy_flow.py`** - Core energy calculation module
2. **`ENERGY_FLOW_GUIDE.md`** - Complete documentation
3. **Updated `main.py`** - Added 4 new endpoints with full integration

## Storage Ready

All responses are JSON and can be stored in:
- Supabase (already integrated in your project)
- MongoDB
- PostgreSQL
- File system
- Any database supporting JSON

Example storage code is included in the documentation.

---

**Status:** ✅ Ready for production
**Tests:** ✅ All passed
**Integration:** ✅ Complete with ML models
**Format:** ✅ JSON output
**Dynamic:** ✅ Real-time score extraction

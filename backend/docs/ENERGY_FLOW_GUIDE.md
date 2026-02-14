# Energy Flow System Guide

## Overview
The Energy Flow system dynamically calculates a user's energy level based on mental health indicators (stress, anxiety, depression) and emotional tone extracted from text or voice input. It then provides personalized task recommendations.

## How It Works

### 1. Analysis → Energy Calculation Pipeline

```
Input (Text/Voice) 
    ↓
ML Analysis (Depression, Anxiety, Stress scores)
    ↓
Classification (high/medium/low levels)
    ↓
Energy Score Calculation (base 70, with impacts)
    ↓
Task Recommendation (heavy/medium/light)
```

### 2. Energy Calculation Formula

**Base Energy:** 70

**Impact Values:**
- Stress: high (-20), medium (-10), low (0)
- Anxiety: high (-15), medium (-8), low (0)
- Depression: high (-25), medium (-12), low (0)
- Tone: positive (+10), neutral (0), negative (-5)

**Final Score = Base + Stress Impact + Anxiety Impact + Depression Impact + Tone Impact**

### 3. Task Recommendations

- **High Energy (70-100):** Heavy tasks (complex projects, intense exercise, learning)
- **Medium Energy (40-69):** Medium tasks (routine work, moderate activities, social interactions)
- **Low Energy (0-39):** Light tasks (rest, light stretching, relaxing activities)

## API Endpoints

### 1. Text Analysis with Energy Flow
**Endpoint:** `POST /api/text-analysis-with-energy`

**Request:**
```json
{
  "text": "I feel very tired and stressed about work today"
}
```

**Response:**
```json
{
  "status": "success",
  "input_text": "I feel very tired and stressed about work today",
  "analysis": {
    "Depression": 0.45,
    "Anxiety": 0.62,
    "Stress": 0.78,
    "source": "local_model"
  },
  "energy_flow": {
    "raw_probabilities": {
      "depression": 0.45,
      "anxiety": 0.62,
      "stress": 0.78
    },
    "classified_levels": {
      "stress": "high",
      "anxiety": "medium",
      "depression": "medium",
      "tone": "negative"
    },
    "energy_calculation": {
      "base_energy": 70,
      "inputs": {
        "stress_level": "high",
        "anxiety_level": "medium",
        "depression_level": "medium",
        "tone": "negative"
      },
      "impact_breakdown": {
        "stress_impact": -20,
        "anxiety_impact": -8,
        "depression_impact": -12,
        "tone_impact": -5,
        "total_impact": -45
      },
      "final_energy_score": 25
    },
    "task_recommendation": {
      "energy_category": "low_energy",
      "recommended_task_type": "light",
      "energy_score": 25,
      "description": "You have low energy. Focus on rest, light activities, and self-care.",
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

### 2. Voice Analysis with Energy Flow
**Endpoint:** `POST /api/voice-input-with-energy`

**Request:** Multipart form data with audio file

**Response:**
```json
{
  "status": "success",
  "transcription": {
    "text": "I feel overwhelmed and anxious",
    "language": "en",
    "language_name": "English",
    "method": "whisper"
  },
  "analysis": {
    "Depression": 0.35,
    "Anxiety": 0.72,
    "Stress": 0.65
  },
  "energy_flow": {
    "raw_probabilities": {
      "depression": 0.35,
      "anxiety": 0.72,
      "stress": 0.65
    },
    "classified_levels": {
      "stress": "medium",
      "anxiety": "high",
      "depression": "low",
      "tone": "negative"
    },
    "energy_calculation": {
      "base_energy": 70,
      "final_energy_score": 37
    },
    "task_recommendation": {
      "recommended_task_type": "light",
      "energy_score": 37,
      "suggestions": [...]
    }
  },
  "audio_info": {
    "filename": "recording.wav",
    "content_type": "audio/wav",
    "size_bytes": 245600
  }
}
```

### 3. Manual Energy Calculation
**Endpoint:** `POST /api/energy-calculate`

**Request:**
```json
{
  "stress_level": "high",
  "anxiety_level": "medium",
  "depression_level": "low",
  "tone": "negative",
  "base_energy": 70
}
```

**Response:**
```json
{
  "status": "success",
  "energy_flow": {
    "base_energy": 70,
    "inputs": {
      "stress_level": "high",
      "anxiety_level": "medium",
      "depression_level": "low",
      "tone": "negative"
    },
    "impact_breakdown": {
      "stress_impact": -20,
      "anxiety_impact": -8,
      "depression_impact": 0,
      "tone_impact": -5,
      "total_impact": -33
    },
    "final_energy_score": 37,
    "task_recommendation": {
      "energy_category": "low_energy",
      "recommended_task_type": "light",
      "energy_score": 37,
      "description": "You have low energy. Focus on rest, light activities, and self-care.",
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

### 4. Test Energy Flow
**Endpoint:** `GET /api/test-energy-flow`

Tests various energy scenarios and returns results.

## Usage Examples

### Using cURL

```bash
# Text analysis with energy
curl -X POST http://localhost:8000/api/text-analysis-with-energy \
  -H "Content-Type: application/json" \
  -d '{"text": "I am feeling great today!"}'

# Voice analysis with energy
curl -X POST http://localhost:8000/api/voice-input-with-energy \
  -F "audio=@recording.wav"

# Manual energy calculation
curl -X POST http://localhost:8000/api/energy-calculate \
  -H "Content-Type: application/json" \
  -d '{
    "stress_level": "medium",
    "anxiety_level": "low",
    "depression_level": "low",
    "tone": "positive"
  }'
```

### Using JavaScript/Fetch

```javascript
// Text analysis with energy
const analyzeText = async (text) => {
  const response = await fetch('http://localhost:8000/api/text-analysis-with-energy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return await response.json();
};

// Voice analysis with energy
const analyzeVoice = async (audioFile) => {
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  const response = await fetch('http://localhost:8000/api/voice-input-with-energy', {
    method: 'POST',
    body: formData
  });
  return await response.json();
};

// Usage
const result = await analyzeText("I'm feeling stressed about my deadlines");
console.log('Energy Score:', result.energy_flow.energy_calculation.final_energy_score);
console.log('Task Type:', result.energy_flow.task_recommendation.recommended_task_type);
```

### Using Python

```python
import requests

# Text analysis with energy
response = requests.post(
    'http://localhost:8000/api/text-analysis-with-energy',
    json={'text': 'I feel anxious and overwhelmed'}
)
result = response.json()

energy_score = result['energy_flow']['energy_calculation']['final_energy_score']
task_type = result['energy_flow']['task_recommendation']['recommended_task_type']
suggestions = result['energy_flow']['task_recommendation']['suggestions']

print(f"Energy Score: {energy_score}")
print(f"Recommended Task Type: {task_type}")
print("Suggestions:")
for suggestion in suggestions:
    print(f"  - {suggestion}")
```

## Dynamic Integration

The system automatically:
1. **Extracts** Depression, Anxiety, and Stress scores from ML models
2. **Classifies** probabilities into high/medium/low levels
3. **Determines** emotional tone (positive/neutral/negative)
4. **Calculates** energy score with impact breakdown
5. **Recommends** appropriate task types
6. **Returns** complete JSON response with all details

## Classification Thresholds

**Probability → Level Mapping:**
- High: ≥ 0.7
- Medium: 0.4 - 0.69
- Low: < 0.4

**Tone Classification:**
- Negative: Average of scores ≥ 0.6
- Neutral: Average of scores 0.3 - 0.59
- Positive: Average of scores < 0.3

## Storage

All responses are returned in **JSON format** and can be:
- Stored directly in a database (MongoDB, PostgreSQL, etc.)
- Saved to files
- Cached in Redis/Memcached
- Sent to analytics platforms

### Example: Storing in Supabase

```python
from supabase_client import supabase

# Analyze text and get energy flow
result = await analyze_text_with_energy({"text": user_input})

# Store in Supabase
supabase.table('user_energy_logs').insert({
    'user_id': user_id,
    'input_text': result['input_text'],
    'energy_score': result['energy_flow']['energy_calculation']['final_energy_score'],
    'stress_level': result['energy_flow']['classified_levels']['stress'],
    'anxiety_level': result['energy_flow']['classified_levels']['anxiety'],
    'depression_level': result['energy_flow']['classified_levels']['depression'],
    'task_recommendation': result['energy_flow']['task_recommendation']['recommended_task_type'],
    'full_result': result,  # Store entire JSON
    'created_at': 'now()'
}).execute()
```

## Benefits

- **Real-time:** Instant energy calculation from user input
- **Dynamic:** Uses actual ML model predictions, not hardcoded values
- **Comprehensive:** Provides scores, classifications, impacts, and recommendations
- **Flexible:** Works with text input, voice input, or manual parameters
- **JSON Format:** Ready for storage, APIs, and frontend integration
- **Multilingual:** Supports 99+ languages through voice transcription

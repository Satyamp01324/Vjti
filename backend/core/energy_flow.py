"""
Energy Flow Calculation Module

This module calculates energy scores based on mental health indicators
(stress, anxiety, depression) and emotional tone, then recommends
appropriate task types based on the calculated energy level.
"""

from typing import Dict, Literal, Tuple
from enum import Enum

class StressLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class AnxietyLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class DepressionLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ToneLevel(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"

class TaskType(str, Enum):
    HEAVY = "heavy"
    MEDIUM = "medium"
    LIGHT = "light"

# Configuration constants
BASE_ENERGY = 70

# Impact values for different conditions and severities
IMPACT_VALUES = {
    "stress": {
        "high": -20,
        "medium": -10,
        "low": 0
    },
    "anxiety": {
        "high": -15,
        "medium": -8,
        "low": 0
    },
    "depression": {
        "high": -25,
        "medium": -12,
        "low": 0
    },
    "tone": {
        "positive": 10,
        "neutral": 0,
        "negative": -5
    }
}

# Energy thresholds for task recommendations
ENERGY_THRESHOLDS = {
    "high_energy": {
        "min": 70,
        "recommended_task_type": TaskType.HEAVY
    },
    "medium_energy": {
        "min": 40,
        "max": 69,
        "recommended_task_type": TaskType.MEDIUM
    },
    "low_energy": {
        "max": 39,
        "recommended_task_type": TaskType.LIGHT
    }
}


def classify_level(value: float, high_threshold: float = 0.7, medium_threshold: float = 0.4) -> str:
    """
    Classify a probability value into high/medium/low categories
    
    Args:
        value: Probability value between 0 and 1
        high_threshold: Threshold for high classification (default: 0.7)
        medium_threshold: Threshold for medium classification (default: 0.4)
    
    Returns:
        String category: "high", "medium", or "low"
    """
    if value >= high_threshold:
        return "high"
    elif value >= medium_threshold:
        return "medium"
    else:
        return "low"


def classify_tone(depression_prob: float, anxiety_prob: float, stress_prob: float) -> str:
    """
    Classify emotional tone based on mental health probabilities
    
    Args:
        depression_prob: Depression probability (0-1)
        anxiety_prob: Anxiety probability (0-1)
        stress_prob: Stress probability (0-1)
    
    Returns:
        Tone classification: "positive", "neutral", or "negative"
    """
    avg_negative = (depression_prob + anxiety_prob + stress_prob) / 3
    
    if avg_negative >= 0.6:
        return "negative"
    elif avg_negative >= 0.3:
        return "neutral"
    else:
        return "positive"


def calculate_energy_score(
    stress_level: str,
    anxiety_level: str,
    depression_level: str,
    tone: str,
    base_energy: int = BASE_ENERGY
) -> Dict:
    """
    Calculate final energy score based on mental health indicators
    
    Args:
        stress_level: "high", "medium", or "low"
        anxiety_level: "high", "medium", or "low"
        depression_level: "high", "medium", or "low"
        tone: "positive", "neutral", or "negative"
        base_energy: Starting energy value (default: 70)
    
    Returns:
        Dictionary containing calculation details and final energy score
    """
    # Get impact values for each factor
    stress_impact = IMPACT_VALUES["stress"].get(stress_level, 0)
    anxiety_impact = IMPACT_VALUES["anxiety"].get(anxiety_level, 0)
    depression_impact = IMPACT_VALUES["depression"].get(depression_level, 0)
    tone_impact = IMPACT_VALUES["tone"].get(tone, 0)
    
    # Calculate final energy score
    final_energy = base_energy + stress_impact + anxiety_impact + depression_impact + tone_impact
    
    # Ensure energy stays within valid range (0-100)
    final_energy = max(0, min(100, final_energy))
    
    return {
        "base_energy": base_energy,
        "inputs": {
            "stress_level": stress_level,
            "anxiety_level": anxiety_level,
            "depression_level": depression_level,
            "tone": tone
        },
        "impact_breakdown": {
            "stress_impact": stress_impact,
            "anxiety_impact": anxiety_impact,
            "depression_impact": depression_impact,
            "tone_impact": tone_impact,
            "total_impact": stress_impact + anxiety_impact + depression_impact + tone_impact
        },
        "final_energy_score": final_energy
    }


def get_task_recommendation(energy_score: int) -> Dict:
    """
    Get task type recommendation based on energy score
    
    Args:
        energy_score: Energy score between 0 and 100
    
    Returns:
        Dictionary with recommended task type and details
    """
    if energy_score >= ENERGY_THRESHOLDS["high_energy"]["min"]:
        category = "high_energy"
        task_type = ENERGY_THRESHOLDS["high_energy"]["recommended_task_type"]
        description = "You have high energy. Perfect for challenging tasks, complex problem-solving, or physical activities."
        suggestions = [
            "Tackle complex projects",
            "Engage in intense physical exercise",
            "Learn something new and challenging",
            "Take on leadership responsibilities"
        ]
    elif energy_score >= ENERGY_THRESHOLDS["medium_energy"]["min"]:
        category = "medium_energy"
        task_type = ENERGY_THRESHOLDS["medium_energy"]["recommended_task_type"]
        description = "You have moderate energy. Good for routine tasks, moderate activities, or social interactions."
        suggestions = [
            "Complete routine work tasks",
            "Engage in moderate exercise",
            "Have casual social interactions",
            "Organize and plan activities"
        ]
    else:
        category = "low_energy"
        task_type = ENERGY_THRESHOLDS["low_energy"]["recommended_task_type"]
        description = "You have low energy. Focus on rest, light activities, and self-care."
        suggestions = [
            "Take breaks and rest",
            "Do light stretching or breathing exercises",
            "Engage in relaxing activities (reading, music)",
            "Practice self-care and mindfulness"
        ]
    
    return {
        "energy_category": category,
        "recommended_task_type": task_type,
        "energy_score": energy_score,
        "description": description,
        "suggestions": suggestions
    }


def calculate_energy_from_analysis(analysis_result: Dict) -> Dict:
    """
    Calculate energy score directly from ML model analysis results
    
    Args:
        analysis_result: Dictionary with keys "Depression", "Anxiety", "Stress" 
                        (values between 0 and 1)
    
    Returns:
        Complete energy flow result including score and recommendations
    """
    # Extract probabilities
    depression_prob = analysis_result.get("Depression", 0)
    anxiety_prob = analysis_result.get("Anxiety", 0)
    stress_prob = analysis_result.get("Stress", 0)
    
    # Classify into high/medium/low categories
    stress_level = classify_level(stress_prob)
    anxiety_level = classify_level(anxiety_prob)
    depression_level = classify_level(depression_prob)
    
    # Determine tone
    tone = classify_tone(depression_prob, anxiety_prob, stress_prob)
    
    # Calculate energy score
    energy_calculation = calculate_energy_score(
        stress_level=stress_level,
        anxiety_level=anxiety_level,
        depression_level=depression_level,
        tone=tone
    )
    
    # Get task recommendation
    task_recommendation = get_task_recommendation(energy_calculation["final_energy_score"])
    
    return {
        "raw_probabilities": {
            "depression": depression_prob,
            "anxiety": anxiety_prob,
            "stress": stress_prob
        },
        "classified_levels": {
            "stress": stress_level,
            "anxiety": anxiety_level,
            "depression": depression_level,
            "tone": tone
        },
        "energy_calculation": energy_calculation,
        "task_recommendation": task_recommendation
    }


# Example usage and testing
if __name__ == "__main__":
    # Test with manual inputs
    print("=== Manual Input Test ===")
    result1 = calculate_energy_score(
        stress_level="high",
        anxiety_level="medium",
        depression_level="low",
        tone="negative"
    )
    print(f"Energy Score: {result1['final_energy_score']}")
    print(f"Impact Breakdown: {result1['impact_breakdown']}")
    
    recommendation1 = get_task_recommendation(result1["final_energy_score"])
    print(f"Recommendation: {recommendation1['recommended_task_type']}")
    print(f"Description: {recommendation1['description']}\n")
    
    # Test with ML model output format
    print("=== ML Model Output Test ===")
    sample_analysis = {
        "Depression": 0.3,
        "Anxiety": 0.5,
        "Stress": 0.8
    }
    
    result2 = calculate_energy_from_analysis(sample_analysis)
    print(f"Classified Levels: {result2['classified_levels']}")
    print(f"Energy Score: {result2['energy_calculation']['final_energy_score']}")
    print(f"Task Recommendation: {result2['task_recommendation']['recommended_task_type']}")
    print(f"Suggestions: {result2['task_recommendation']['suggestions']}")

"""
Example: Using Energy Flow with Dynamic ML Scores

This script demonstrates how the system:
1. Gets ML predictions (Depression, Anxiety, Stress)
2. Dynamically calculates energy score
3. Returns results in JSON format
"""

from energy_flow import calculate_energy_from_analysis
from feature1.text_classification_model import clinical_predict
import json

def analyze_and_calculate_energy(text: str) -> dict:
    """
    Complete pipeline: Text → ML Analysis → Energy Flow
    
    Args:
        text: Input text to analyze
    
    Returns:
        Complete JSON result with analysis and energy flow
    """
    # Step 1: Get ML predictions (dynamic scores)
    ml_analysis = clinical_predict(text)
    print(f"\n📊 ML Analysis:")
    print(f"   Depression: {ml_analysis['Depression']:.3f}")
    print(f"   Anxiety: {ml_analysis['Anxiety']:.3f}")
    print(f"   Stress: {ml_analysis['Stress']:.3f}")
    
    # Step 2: Calculate energy flow from dynamic scores
    energy_flow = calculate_energy_from_analysis(ml_analysis)
    
    # Step 3: Combine into complete result (JSON format)
    complete_result = {
        "input_text": text,
        "ml_analysis": ml_analysis,
        "energy_flow": energy_flow,
        "timestamp": "2026-02-14T12:00:00Z"  # You can use datetime.now()
    }
    
    return complete_result


def display_results(result: dict):
    """Display results in a readable format"""
    print(f"\n{'='*60}")
    print(f"INPUT: {result['input_text']}")
    print(f"{'='*60}")
    
    # Show classified levels
    levels = result['energy_flow']['classified_levels']
    print(f"\n🔍 Classified Levels:")
    print(f"   Stress: {levels['stress'].upper()}")
    print(f"   Anxiety: {levels['anxiety'].upper()}")
    print(f"   Depression: {levels['depression'].upper()}")
    print(f"   Tone: {levels['tone'].upper()}")
    
    # Show energy calculation
    energy_calc = result['energy_flow']['energy_calculation']
    print(f"\n⚡ Energy Calculation:")
    print(f"   Base Energy: {energy_calc['base_energy']}")
    print(f"   Total Impact: {energy_calc['impact_breakdown']['total_impact']}")
    print(f"   Final Score: {energy_calc['final_energy_score']}")
    
    # Show task recommendation
    task_rec = result['energy_flow']['task_recommendation']
    print(f"\n✅ Recommendation:")
    print(f"   Task Type: {task_rec['recommended_task_type'].upper()}")
    print(f"   Category: {task_rec['energy_category']}")
    print(f"   Description: {task_rec['description']}")
    print(f"\n   Suggestions:")
    for suggestion in task_rec['suggestions']:
        print(f"      • {suggestion}")


def save_to_json(result: dict, filename: str = "energy_result.json"):
    """Save result to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result, indent=2, fp=f, ensure_ascii=False)
    print(f"\n💾 Saved to {filename}")


def main():
    """Run examples"""
    print("\n" + "="*60)
    print("ENERGY FLOW SYSTEM - DYNAMIC INTEGRATION DEMO")
    print("="*60)
    
    # Example 1: High stress text
    print("\n\n🔴 EXAMPLE 1: High Stress Scenario")
    text1 = "I'm feeling overwhelmed with work deadlines and very anxious about everything"
    result1 = analyze_and_calculate_energy(text1)
    display_results(result1)
    save_to_json(result1, "example1_high_stress.json")
    
    # Example 2: Positive text
    print("\n\n🟢 EXAMPLE 2: Positive Scenario")
    text2 = "I'm feeling great today! Everything is going wonderfully and I'm excited about my projects"
    result2 = analyze_and_calculate_energy(text2)
    display_results(result2)
    save_to_json(result2, "example2_positive.json")
    
    # Example 3: Moderate text
    print("\n\n🟡 EXAMPLE 3: Moderate Scenario")
    text3 = "I'm a bit tired but managing okay. Some stress but nothing too serious"
    result3 = analyze_and_calculate_energy(text3)
    display_results(result3)
    save_to_json(result3, "example3_moderate.json")
    
    print("\n\n" + "="*60)
    print("✅ ALL EXAMPLES COMPLETED")
    print("="*60)
    print("\nNote: All results are in JSON format and ready for storage!")
    print("You can store these in Supabase, MongoDB, PostgreSQL, etc.")


if __name__ == "__main__":
    main()

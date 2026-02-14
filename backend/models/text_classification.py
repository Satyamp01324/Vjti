from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
import re

# ------------------------
# Remote model (Hugging Face)
# ------------------------
remote_repo = "GehrmanSparrow1711/clinical_roberta"

# Load model + tokenizer
model = AutoModelForSequenceClassification.from_pretrained(remote_repo)
tokenizer = AutoTokenizer.from_pretrained(remote_repo)

# ------------------------
# Prediction function
# ------------------------
def is_english(text):
    return bool(re.match(r'^[\x00-\x7F\s]+$', text))

def clinical_predict(text):
    # For now, everything uses the same model since the Hugging Face one has fallback built-in
    source = "groq_fallback_language" if not is_english(text) else "local_model"
    
    inputs = tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
    
    probs = torch.sigmoid(outputs.logits).squeeze().tolist()
    categories = ["Depression", "Anxiety", "Stress"]
    
    result = {cat: float(prob) for cat, prob in zip(categories, probs)}
    result["source"] = source
    return result

# ------------------------
# Example usage
# ------------------------
text_en = "I feel very tired and anxious today."
text_hi = "मुझे बहुत थकान हो रही है"

print(clinical_predict(text_en))
print(clinical_predict(text_hi))
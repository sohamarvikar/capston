from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import os

app = FastAPI(title="CI/CD Intelligence AI Engine")

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'failure_classifier.joblib')

class LogRequest(BaseModel):
    log_text: str

@app.on_event("startup")
def load_model():
    global model
    try:
        model = joblib.load(MODEL_PATH)
    except FileNotFoundError:
        print("Warning: Model not found. Run train_model.py first.")
        model = None

@app.post("/api/classify")
def classify_failure(req: LogRequest):
    if not model:
        return {"error": "Model not loaded"}
    
    # Predict Category
    prediction = model.predict([req.log_text])[0]
    
    # Risk Scoring Heuristic
    high_risk = ["Security issue", "Deployment error"]
    medium_risk = ["Build failure", "Configuration error", "Dependency issue"]
    
    priority = "High" if prediction in high_risk else "Medium" if prediction in medium_risk else "Low"
    
    return {
        "predicted_category": prediction,
        "priority": priority,
        "summary": f"Detected a {priority}-priority {prediction}."
    }

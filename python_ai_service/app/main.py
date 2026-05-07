from fastapi import FastAPI
from app.schemas import DelayPredictionRequest, BurnoutPredictionRequest, PerformancePredictionRequest, TaskAssignmentRequest
from app.predictor import MLPredictor

app = FastAPI(
    title="Karmavyuha AI Prediction Module", 
    version="2.0.0",
    description="Standalone Machine Learning microservice trained on existing CSV data."
)

predictor = MLPredictor()

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "AI Module is running independently"}

@app.post("/predict/delay")
def predict_project_delay(req: DelayPredictionRequest):
    data = [req.project_complexity, req.team_size, req.required_skills_count, req.avg_team_experience, req.days_to_deadline, req.current_workload_factor]
    delay_prob = predictor.predict_delay(data)
    
    risk_level = "High" if delay_prob > 50 else "Medium" if delay_prob > 20 else "Low"
    return {
        "delay_probability_percentage": delay_prob,
        "risk_level": risk_level
    }

@app.post("/predict/burnout")
def predict_burnout_risk(req: BurnoutPredictionRequest):
    data = [req.weekly_hours, req.pending_tasks, req.days_since_vacation, req.experience]
    risk = predictor.predict_burnout(data, req.department)
    
    mapping = {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"}
    return {
        "burnout_risk_level": mapping.get(risk, "Unknown"),
        "burnout_score": risk
    }

@app.post("/predict/performance")
def predict_performance(req: PerformancePredictionRequest):
    data = [req.experience, req.weekly_hours, req.tasks_completed_monthly]
    score = predictor.predict_performance(data, req.department)
    return {
        "employee_performance_score": score,
        "max_score": 5.0
    }

@app.post("/predict/assignment")
def recommend_task_assignment(req: TaskAssignmentRequest):
    best_emp_id = predictor.recommend_assignment(req.task_complexity, req.required_skills_count, req.candidates)
    return {
        "recommended_employee_id": best_emp_id,
        "task_complexity": req.task_complexity
    }

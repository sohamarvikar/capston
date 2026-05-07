# AI-Driven Workforce & Project Management Platform (Standalone ML Module)

This module is a completely separate AI microservice developed independently in Python (FastAPI). It was trained exclusively on augmented features from the **existing dataset** (`Employe_Performance_dataset.csv`).

## 📊 Dataset Analysis & Preprocessing Report
We analyzed `backend/data/Employe_Performance_dataset.csv`.
- **Verdict:** The dataset was useful (1000 records) but insufficient for production-level Delay, Burnout, and Assignment tracking as it lacked crucial columns like Workload, Tasks, Projects, and Skills, and was missing 50% of the Performance Scores.
- **Preprocessing Action:** We built `enhance_data.py`. 
  - We used **Mean Imputation** to fill missing Performance Scores based on Employee Experience.
  - We generated derived synthetic features natively bridging into the dataset (`Weekly_Hours`, `Pending_Tasks`, `Days_Since_Vacation`, `Tasks_Completed_Monthly`, `Skills`).
  - We generated a separate `synthetic_project_data.csv` mapping purely to team dynamics to allow accurate Project Delay predictions.

## 🚀 Model Selection & Comparison
1. **Burnout Risk Model:** Selected `XGBoost Classifier`. XGBoost easily handles non-linear patterns (e.g., burnout thresholds only triggering when hours > 60 AND vacation > 200). 
   - **Evaluation Metric (F1-Score):** Output via `graphs/burnout_cm.png`
2. **Performance Prediction:** Selected `RandomForest Regressor`. Continuous estimation of a 5.0 score based on tasks completed and experience. 
3. **Project Delay:** Selected `RandomForest Classifier`. Handles mixed numerical inputs (workload factor vs deadline proximity) exceptionally well without deep scaling.

## 📂 Folder Architecture
```
python_ai_service/
│
├── data/                       # Contains datasets
│   ├── enhance_data.py         # Script to preprocess & augment CSVs
│   ├── enhanced_employee_data.csv       
│   └── synthetic_project_data.csv         
│
├── models/                     # Saved ML models (.joblib files)
│   ├── delay_rf.joblib
│   ├── burnout_xgb.joblib
│   └── performance_rf.joblib
│
├── graphs/                     # Evaluation metrics visuals (Seaborn Heatmaps)
│   ├── burnout_cm.png
│   └── delay_cm.png
│
├── scripts/
│   └── train_models.py         # Script to train and save models
│
├── app/                        # FastAPI Application
│   ├── main.py                 # API Routes & Endpoints
│   ├── predictor.py            # ML Model Loading
│   └── schemas.py              # Pydantic Schemas
│
└── requirements.txt            
```

## 📡 API Testing (Sample Postman Requests)

### 1. Predict Project Delay
**Endpoint:** `POST http://localhost:8000/predict/delay`
**Body:**
```json
{
  "project_complexity": 4,
  "team_size": 3,
  "required_skills_count": 3,
  "avg_team_experience": 2.5,
  "days_to_deadline": 10,
  "current_workload_factor": 1.5
}
```

### 2. Predict Burnout Risk
**Endpoint:** `POST http://localhost:8000/predict/burnout`
**Body:**
```json
{
  "weekly_hours": 55,
  "pending_tasks": 12,
  "days_since_vacation": 150,
  "experience": 5,
  "department": "IT"
}
```

### 3. Recommend Task Assignment
**Endpoint:** `POST http://localhost:8000/predict/assignment`
**Body:**
```json
{
  "task_complexity": 4,
  "required_skills_count": 3,
  "candidates": [
    {
      "employee_id": "emp_001",
      "experience": 3,
      "current_workload": 1.2,
      "skills_matched": 2
    },
    {
      "employee_id": "emp_002",
      "experience": 8,
      "current_workload": 0.5,
      "skills_matched": 3
    }
  ]
}
```

## 🔗 Future Integration Plan
This service operates completely stand-alone. To integrate with the capstone project later:
1. Wrap this directory in a `Dockerfile`.
2. Deploy the containerized FastAPI server.
3. Call the `POST` endpoints exclusively from the Node.js backend controllers to keep API keys / models hidden from the frontend React client.

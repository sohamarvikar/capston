import joblib
import os

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')

class MLPredictor:
    def __init__(self):
        self.delay_model = None
        self.burnout_model = None
        self.performance_model = None
        self._load_models()
        
        # Simple static encoder matching training
        self.dept_map = {"IT": 0, "HR": 1, "Sales": 2, "Finance": 3, "Marketing": 4}

    def _load_models(self):
        try:
            self.delay_model = joblib.load(os.path.join(MODELS_DIR, 'delay_rf.joblib'))
            self.burnout_model = joblib.load(os.path.join(MODELS_DIR, 'burnout_xgb.joblib'))
            self.performance_model = joblib.load(os.path.join(MODELS_DIR, 'performance_rf.joblib'))
        except FileNotFoundError:
            print("Warning: Models not found. Please run scripts/train_models.py first.")

    def _encode_dept(self, dept_name: str) -> int:
        return self.dept_map.get(dept_name, 0)

    def predict_delay(self, data: list):
        if not self.delay_model: return 0.0
        # data: [Project_Complexity, Team_Size, Required_Skills_Count, Avg_Team_Experience, Days_To_Deadline, Current_Workload_Factor]
        prob = self.delay_model.predict_proba([data])[0][1]
        return round(prob * 100, 2)

    def predict_burnout(self, data: list, dept: str):
        if not self.burnout_model: return 0
        # data: [Weekly_Hours, Pending_Tasks, Days_Since_Vacation, Experience, Department_Encoded]
        encoded_data = data + [self._encode_dept(dept)]
        risk_class = self.burnout_model.predict([encoded_data])[0]
        return int(risk_class) # 0: Low, 1: Medium, 2: High

    def predict_performance(self, data: list, dept: str):
        if not self.performance_model: return 0.0
        # data: [Experience, Weekly_Hours, Tasks_Completed_Monthly, Department_Encoded]
        encoded_data = data + [self._encode_dept(dept)]
        score = self.performance_model.predict([encoded_data])[0]
        return round(float(score), 2)
        
    def recommend_assignment(self, task_complexity: int, req_skills: int, candidates: list):
        best_candidate = None
        best_score = -9999
        
        for candidate in candidates:
            # Match ML-driven logic loosely based on project delay logic:
            # We want high experience, low workload, high skills matched
            skill_ratio = candidate.skills_matched / max(1, req_skills)
            
            score = (skill_ratio * 50) - (candidate.current_workload * 20)
            if task_complexity >= 3:
                score += (candidate.experience * 2)
                
            if score > best_score:
                best_score = score
                best_candidate = candidate.employee_id
                
        return best_candidate

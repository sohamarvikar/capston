from pydantic import BaseModel
from typing import List

class DelayPredictionRequest(BaseModel):
    project_complexity: int
    team_size: int
    required_skills_count: int
    avg_team_experience: float
    days_to_deadline: int
    current_workload_factor: float

class BurnoutPredictionRequest(BaseModel):
    weekly_hours: int
    pending_tasks: int
    days_since_vacation: int
    experience: int
    department: str # We will encode it in predictor

class PerformancePredictionRequest(BaseModel):
    experience: int
    weekly_hours: int
    tasks_completed_monthly: int
    department: str # We will encode it

class TaskAssignmentCandidate(BaseModel):
    employee_id: str
    experience: int
    current_workload: float
    skills_matched: int

class TaskAssignmentRequest(BaseModel):
    task_complexity: int
    required_skills_count: int
    candidates: List[TaskAssignmentCandidate]

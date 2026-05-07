import pandas as pd
import numpy as np
import os

os.makedirs('data', exist_ok=True)
np.random.seed(42)

# 1. Project Delay Data
n_samples = 1000
delay_data = pd.DataFrame({
    'num_tasks': np.random.randint(5, 50, n_samples),
    'workload': np.random.uniform(0.5, 1.5, n_samples), # 1.0 is normal
    'avg_performance': np.random.uniform(2.0, 5.0, n_samples),
    'days_to_deadline': np.random.randint(1, 30, n_samples),
    'team_velocity': np.random.randint(10, 40, n_samples)
})
# Simulate delay logic
delay_prob = (delay_data['workload'] * 0.4) - (delay_data['avg_performance'] * 0.2) - (delay_data['days_to_deadline'] * 0.05) + np.random.normal(0, 0.1, n_samples)
delay_data['is_delayed'] = (delay_prob > 0.1).astype(int)
delay_data.to_csv('data/project_delay.csv', index=False)

# 2. Burnout Risk Data
burnout_data = pd.DataFrame({
    'weekly_hours': np.random.randint(35, 70, n_samples),
    'pending_tasks': np.random.randint(0, 20, n_samples),
    'attendance_rate': np.random.uniform(0.7, 1.0, n_samples),
    'days_since_vacation': np.random.randint(10, 300, n_samples)
})
burnout_risk = (burnout_data['weekly_hours'] * 0.5) + (burnout_data['pending_tasks'] * 2) + (burnout_data['days_since_vacation'] * 0.1) + np.random.normal(0, 5, n_samples)
burnout_data['burnout_level'] = pd.qcut(burnout_risk, q=3, labels=[0, 1, 2]) # 0: Low, 1: Medium, 2: High
burnout_data.to_csv('data/burnout_risk.csv', index=False)

# 3. Performance Data
perf_data = pd.DataFrame({
    'tasks_completed': np.random.randint(10, 100, n_samples),
    'on_time_rate': np.random.uniform(0.5, 1.0, n_samples),
    'communication_score': np.random.uniform(1.0, 5.0, n_samples)
})
perf_score = (perf_data['tasks_completed'] * 0.02) + (perf_data['on_time_rate'] * 3) + (perf_data['communication_score'] * 0.5) + np.random.normal(0, 0.5, n_samples)
perf_data['performance_score'] = np.clip(perf_score, 1.0, 5.0)
perf_data.to_csv('data/performance.csv', index=False)

print("Mock datasets generated successfully in data/ folder.")

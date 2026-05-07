import pandas as pd
import numpy as np
import os

np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
input_csv = os.path.join(BASE_DIR, '../backend/data/Employe_Performance_dataset.csv')
output_dir = os.path.join(BASE_DIR, 'data')

os.makedirs(output_dir, exist_ok=True)

# 1. Analyze existing data
print(f"Loading existing dataset from: {input_csv}")
df = pd.read_csv(input_csv)

print(f"Initial Dataset Shape: {df.shape}")
print(f"Missing Values:\n{df.isnull().sum()}")

# -------------------------------------------------------------
# ENHANCEMENT 1: EMPLOYEE PERFORMANCE & BURNOUT RISK DATASET
# -------------------------------------------------------------
print("\nEnhancing Employee Dataset with AI Features...")

# Drop unneeded ID/Name/Dates for ML feature generation, but keep them for reference
enhanced_emp = df.copy()

# Fix Missing Performance Scores (Imputation strategy: Mean imputation based on Experience)
mean_perf_by_exp = enhanced_emp.groupby('Experience')['Performance Score'].transform('mean')
# For any still NaN, use global mean
global_mean = enhanced_emp['Performance Score'].mean()
enhanced_emp['Performance Score'] = enhanced_emp['Performance Score'].fillna(mean_perf_by_exp).fillna(global_mean)

# Generate Derived/Synthetic Features for Burnout & Performance
n_samples = len(enhanced_emp)
enhanced_emp['Skills'] = [np.random.choice(['React,Node', 'Python,SQL', 'Java,Spring', 'UI/UX', 'AWS,Docker']) for _ in range(n_samples)]
enhanced_emp['Weekly_Hours'] = np.random.normal(loc=42, scale=8, size=n_samples).astype(int)
enhanced_emp['Weekly_Hours'] = np.clip(enhanced_emp['Weekly_Hours'], 20, 80)
enhanced_emp['Pending_Tasks'] = np.random.randint(0, 25, n_samples)
enhanced_emp['Days_Since_Vacation'] = np.random.randint(10, 300, n_samples)
enhanced_emp['Tasks_Completed_Monthly'] = np.random.randint(5, 50, n_samples)

# Generate Burnout Risk Target (Heuristic combining long hours, many tasks, no vacation)
burnout_score = (enhanced_emp['Weekly_Hours'] * 0.4) + (enhanced_emp['Pending_Tasks'] * 1.5) + (enhanced_emp['Days_Since_Vacation'] * 0.1)
enhanced_emp['Burnout_Level'] = pd.qcut(burnout_score, q=3, labels=[0, 1, 2]) # 0: Low, 1: Medium, 2: High

enhanced_emp.to_csv(os.path.join(output_dir, 'enhanced_employee_data.csv'), index=False)


# -------------------------------------------------------------
# ENHANCEMENT 2: PROJECT DELAY PREDICTION DATASET
# -------------------------------------------------------------
# Since the original CSV contains NO project data, we must synthesize it
# using properties that map to the workforce.
print("Generating Synthetic Project Delay Dataset...")

n_projects = 1500
proj_data = pd.DataFrame({
    'Project_Complexity': np.random.randint(1, 6, n_projects),
    'Team_Size': np.random.randint(2, 10, n_projects),
    'Required_Skills_Count': np.random.randint(1, 5, n_projects),
    'Avg_Team_Experience': np.random.uniform(1.0, 15.0, n_projects),
    'Days_To_Deadline': np.random.randint(5, 60, n_projects),
    'Current_Workload_Factor': np.random.uniform(0.5, 2.0, n_projects) # 1.0 is normal capacity
})

# Delay target logic: high complexity, low team size, high workload -> delay
delay_risk = (proj_data['Project_Complexity'] * 2) + (proj_data['Current_Workload_Factor'] * 10) - (proj_data['Avg_Team_Experience'] * 0.5) - (proj_data['Days_To_Deadline'] * 0.1)
proj_data['Is_Delayed'] = (delay_risk > 15).astype(int)

proj_data.to_csv(os.path.join(output_dir, 'synthetic_project_data.csv'), index=False)

print("\nData enhancement complete. Files saved successfully.")

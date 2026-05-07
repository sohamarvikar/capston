import pandas as pd
import numpy as np
import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, mean_squared_error

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(BASE_DIR, 'models'), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, 'graphs'), exist_ok=True)

print("=== Training ML Models on Enhanced Datasets ===\n")

# -------------------------------------------------------------
# 1. BURNOUT RISK MODEL (XGBoost)
# -------------------------------------------------------------
print("Loading Enhanced Employee Data for Burnout & Performance...")
df_emp = pd.read_csv(os.path.join(BASE_DIR, 'data/enhanced_employee_data.csv'))

# Categorical encoding
le_dept = LabelEncoder()
df_emp['Department_Encoded'] = le_dept.fit_transform(df_emp['Department'])

# Features for Burnout
X_burnout = df_emp[['Weekly_Hours', 'Pending_Tasks', 'Days_Since_Vacation', 'Experience', 'Department_Encoded']]
y_burnout = df_emp['Burnout_Level']

X_train_b, X_test_b, y_train_b, y_test_b = train_test_split(X_burnout, y_burnout, test_size=0.2, random_state=42)

burnout_model = XGBClassifier(eval_metric='mlogloss', random_state=42)
burnout_model.fit(X_train_b, y_train_b)

y_pred_b = burnout_model.predict(X_test_b)
acc_b = accuracy_score(y_test_b, y_pred_b)
prec_b = precision_score(y_test_b, y_pred_b, average='weighted')
rec_b = recall_score(y_test_b, y_pred_b, average='weighted')
f1_b = f1_score(y_test_b, y_pred_b, average='weighted')
cm_b = confusion_matrix(y_test_b, y_pred_b)

print(f"Burnout Model Metrics:\n Accuracy: {acc_b:.4f}\n Precision: {prec_b:.4f}\n Recall: {rec_b:.4f}\n F1-Score: {f1_b:.4f}")

# Plot Confusion Matrix
plt.figure(figsize=(6, 4))
sns.heatmap(cm_b, annot=True, fmt='d', cmap='Blues', xticklabels=['Low', 'Med', 'High'], yticklabels=['Low', 'Med', 'High'])
plt.title('Burnout Risk Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.savefig(os.path.join(BASE_DIR, 'graphs/burnout_cm.png'))
plt.close()

joblib.dump(burnout_model, os.path.join(BASE_DIR, 'models/burnout_xgb.joblib'))

# -------------------------------------------------------------
# 2. PERFORMANCE PREDICTION MODEL (Random Forest)
# -------------------------------------------------------------
# Features for Performance
X_perf = df_emp[['Experience', 'Weekly_Hours', 'Tasks_Completed_Monthly', 'Department_Encoded']]
y_perf = df_emp['Performance Score']

X_train_p, X_test_p, y_train_p, y_test_p = train_test_split(X_perf, y_perf, test_size=0.2, random_state=42)

perf_model = RandomForestRegressor(n_estimators=100, random_state=42)
perf_model.fit(X_train_p, y_train_p)

y_pred_p = perf_model.predict(X_test_p)
mse_p = mean_squared_error(y_test_p, y_pred_p)
print(f"\nPerformance Model Metrics:\n Mean Squared Error: {mse_p:.4f}")

joblib.dump(perf_model, os.path.join(BASE_DIR, 'models/performance_rf.joblib'))


# -------------------------------------------------------------
# 3. PROJECT DELAY PREDICTION MODEL (Random Forest)
# -------------------------------------------------------------
print("\nLoading Synthetic Project Data for Delay Prediction...")
df_proj = pd.read_csv(os.path.join(BASE_DIR, 'data/synthetic_project_data.csv'))

X_delay = df_proj.drop('Is_Delayed', axis=1)
y_delay = df_proj['Is_Delayed']

X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(X_delay, y_delay, test_size=0.2, random_state=42)

delay_model = RandomForestClassifier(n_estimators=100, random_state=42)
delay_model.fit(X_train_d, y_train_d)

y_pred_d = delay_model.predict(X_test_d)
acc_d = accuracy_score(y_test_d, y_pred_d)
prec_d = precision_score(y_test_d, y_pred_d)
rec_d = recall_score(y_test_d, y_pred_d)
f1_d = f1_score(y_test_d, y_pred_d)
cm_d = confusion_matrix(y_test_d, y_pred_d)

print(f"Delay Model Metrics:\n Accuracy: {acc_d:.4f}\n Precision: {prec_d:.4f}\n Recall: {rec_d:.4f}\n F1-Score: {f1_d:.4f}")

plt.figure(figsize=(6, 4))
sns.heatmap(cm_d, annot=True, fmt='d', cmap='Reds', xticklabels=['On Time', 'Delayed'], yticklabels=['On Time', 'Delayed'])
plt.title('Project Delay Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.savefig(os.path.join(BASE_DIR, 'graphs/delay_cm.png'))
plt.close()

joblib.dump(delay_model, os.path.join(BASE_DIR, 'models/delay_rf.joblib'))

print("\nModel training complete. All models saved to models/ directory. Evaluation graphs saved to graphs/ directory.")

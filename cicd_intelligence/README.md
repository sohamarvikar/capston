# CI/CD Intelligence Platform

A totally standalone, isolated microservice for AI-powered CI/CD pipeline monitoring and intelligent issue management. 
This module operates completely independently from the "AI-Driven Workforce & Project Management Platform" and can be integrated via API at a later time.

## 📁 Architecture
```
cicd_intelligence/
├── ai-engine/             # Python FastAPI + Scikit-Learn NLP Model
│   ├── generate_data.py   # Simulates log data (Since HR dataset lacked CI/CD data)
│   ├── train_model.py     # Trains a RandomForest TF-IDF Classifier
│   ├── app.py             # FastAPI port 8001
│   └── models/            # Saved joblib pipeline
├── backend/               # Node.js Express Webhooks + MongoDB
│   ├── server.js          # Webhook Receiver port 5002
│   ├── models/            # WorkflowExecution Schema
│   └── package.json
├── frontend/              # React + Tailwind Dashboard
│   ├── src/Dashboard.jsx  # Main UI
│   └── package.json
└── README.md              # Setup Instructions
```

## 🧠 Why we didn't use the existing CSV
We analyzed `backend/data/Employe_Performance_dataset.csv`. It contains exclusively HR metrics (Salary, Age, Department). It does **not** contain any CI/CD metrics, GitHub workflows, or build logs. Training an NLP Failure Classifier on HR data is impossible.
**Solution:** We created a preprocessing script `ai-engine/generate_data.py` to synthesize realistic CI/CD build logs and map them to standard errors (Dependency issue, Security issue, Build failure). We used this generated dataset to train the model.

## 🚀 Step-by-Step Setup Guide

### 1. Start the AI Engine (Python)
```bash
cd cicd_intelligence/ai-engine
pip install -r requirements.txt

# Step 1a: Generate data and train the model
python generate_data.py
python train_model.py

# Step 1b: Run the FastAPI server
uvicorn app:app --port 8001 --reload
```

### 2. Start the Backend Webhook Server (Node.js)
```bash
cd cicd_intelligence/backend
npm install

# Start the Node.js server
npm start
```
*Make sure MongoDB is running locally on port 27017!*

### 3. Start the Frontend Dashboard (React)
```bash
cd cicd_intelligence/frontend
# Note: You should initialize Vite here if not already done: npm create vite@latest . -- --template react
npm install
npm run dev
```

## 🔗 Testing the Integration
You can simulate a GitHub Action Webhook failure by sending a POST request to your backend:
```bash
curl -X POST http://localhost:5002/api/webhook/github \
-H "Content-Type: application/json" \
-d '{
  "workflow_run": {
    "id": 12345,
    "repository": {"name": "core-api"},
    "head_commit": {"message": "Update packages"},
    "actor": {"login": "dev_soham"},
    "conclusion": "failure"
  }
}'
```
**What happens:**
1. Node receives the failure.
2. It fetches the mocked error log.
3. It POSTs the log to the Python `ai-engine` on port 8001.
4. The AI classifies it as a "Dependency issue" and assigns it High Priority.
5. Node applies Auto-Assignment logic (assigning to Senior DevOps Engineer).
6. It saves to MongoDB.
7. Your React Dashboard instantly updates!

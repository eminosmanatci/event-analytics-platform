# 🚀 Event Analytics Platform

A high-performance, scalable event tracking and analytics system designed to collect, process, and analyze real-time user activity data. Built with modern, cloud-native architecture.

## 🏗️ System Architecture
The platform follows a robust **event-driven architecture** to ensure high throughput and data integrity.



- **Frontend:** React + Vite + Tailwind CSS (Responsive Dashboard)
- **Backend:** FastAPI (Python) - Async request handling
- **Message Queue:** Redis + Celery (Background processing for data ingestion)
- **Database:** PostgreSQL (Relational data storage)
- **AI Insights:** Groq API (LLaMA 3.1) for automated data analysis
- **Containerization:** Docker & Docker Compose

## 🚀 Key Features
- **Real-time Ingestion:** Scalable API to capture user actions.
- **Background Processing:** Decoupled data persistence using Celery to prevent database bottlenecks.
- **AI Analytics:** Automated insight generation powered by LLaMA 3.1 for anomaly detection.
- **Data Visualization:** Interactive charts (Recharts) and real-time event streaming.
- **Near Real-time Monitoring:** Optimized short-polling mechanism for live tracking.

## ⚙️ Quick Start

### Prerequisites
- Docker & Docker Compose installed on your machine.
- A free [Groq API Key](https://console.groq.com/).

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/KULLANICI_ADIN/event-analytics-platform.git](https://github.com/KULLANICI_ADIN/event-analytics-platform.git)
   cd event-analytics-platform
Configure Environment Variables:
Create a .env file in the root directory and add your Groq API Key:

Kod snippet'i
GROQ_API_KEY=gsk_your_key_here
Launch the platform:

Bash
docker-compose up --build -d
Access:

Dashboard: http://localhost:5173

API Docs: http://localhost:8000/docs

📊 Analytics & Insights
The system automatically aggregates user activity and leverages AI to provide actionable business intelligence. You can view daily trends, event type distributions, and automated platform health reports directly from the dashboard.

Built for excellence in Data & Backend Engineering.
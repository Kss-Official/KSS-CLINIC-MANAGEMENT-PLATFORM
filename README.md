# KSS Clinic Management Platform

A full-stack clinic management system featuring a React + Vite frontend and a Django REST Framework backend.

## Project Structure

```
project/
├── frontend/             # React (Vite) Single Page Application
│   ├── public/           # Static assets
│   ├── src/              # React source code (components, features, hooks, routes, store)
│   ├── .env              # Frontend environment variables
│   ├── package.json      # Frontend dependencies & scripts
│   └── vite.config.js    # Vite build configuration
└── backend/              # Django REST Framework backend
    ├── config/           # Project-level configuration & settings
    ├── apps/             # Django apps (users, authentication, core)
    ├── static/           # Static files
    ├── media/            # User uploads
    ├── requirements/     # Python requirements (base, dev, prod)
    ├── manage.py         # Django CLI
    └── .env              # Backend environment variables
```

## Getting Started

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements/dev.txt
python manage.py migrate
python manage.py runserver
```


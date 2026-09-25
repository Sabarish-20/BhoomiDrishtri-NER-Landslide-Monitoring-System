#!/usr/bin/env bash
set -e

echo "================================================================="
echo "  🚀 Starting BhoomiDrishti-NER (SIH26001 Demo System)"
echo "  Corridor: NH-106 (Guwahati to Shillong, Meghalaya)"
echo "================================================================="

# Activate virtualenv or create if missing
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtualenv..."
    python3 -m venv backend/venv
    ./backend/venv/bin/pip install -r backend/requirements.txt
fi

# Build frontend if dist doesn't exist
if [ ! -d "frontend/dist" ]; then
    echo "Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

echo "Running automated backend verification tests..."
PYTHONPATH=. ./backend/venv/bin/pytest backend/tests/test_backend.py -q

echo "================================================================="
echo "  ✅ All systems verified!"
echo "  🌐 Dashboard URL: http://localhost:8000/"
echo "  📖 API Docs:     http://localhost:8000/docs"
echo "  📡 NDMA CAP Feed: http://localhost:8000/api/alerts/latest.xml"
echo "================================================================="

./backend/venv/bin/python backend/run_server.py

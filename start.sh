#!/bin/bash

# Comprehensive Particle Life System - Simple Launcher

echo "🚀 Starting Comprehensive Particle Life System..."
echo "=============================================="

PORT=8080
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

# Open browser
sleep 1 && open "http://localhost:$PORT" &

echo "✨ Server running at: http://localhost:$PORT"
echo "📌 Press 'C' to toggle parameters, 'R' to reset"
echo "🛑 Press Ctrl+C to stop"
echo ""

python3 -m http.server $PORT

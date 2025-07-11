#!/bin/bash

echo "Starting Comprehensive Particle Life System..."

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Starting web server on http://localhost:8080"
    echo "Open http://localhost:8080/index-comprehensive.html in your browser"
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "Starting web server on http://localhost:8080"
    echo "Open http://localhost:8080/index-comprehensive.html in your browser"
    python -m SimpleHTTPServer 8080
else
    echo "Python not found. Please install Python or use another web server."
    exit 1
fi
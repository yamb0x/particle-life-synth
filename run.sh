#!/bin/bash
# Simple development server script

echo "Starting development server on http://localhost:8000"
echo "Press Ctrl+C to stop"

# Use Python's built-in server
cd "$(dirname "$0")"
python3 -m http.server 8000
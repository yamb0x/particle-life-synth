#!/bin/bash

# Comprehensive Particle Life System - Auto Launcher
# This script handles everything needed to run the system

echo "================================================"
echo "🚀 Comprehensive Particle Life System Launcher"
echo "================================================"

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Check if TypeScript needs compilation
if [ ! -f "src/core/ComprehensiveParticleSystem.js" ] || [ "src/core/ComprehensiveParticleSystem.ts" -nt "src/core/ComprehensiveParticleSystem.js" ]; then
    echo "📦 TypeScript files need compilation..."
    
    # Check if TypeScript is installed
    if command -v tsc &> /dev/null; then
        echo "✅ TypeScript compiler found, compiling..."
        tsc -p tsconfig-comprehensive.json
        
        if [ $? -eq 0 ]; then
            echo "✅ Compilation successful!"
        else
            echo "⚠️  Compilation had errors but continuing anyway..."
        fi
    else
        echo "⚠️  TypeScript compiler not found."
        echo "   To install: npm install -g typescript"
        echo "   Continuing with existing JavaScript files..."
    fi
else
    echo "✅ JavaScript files are up to date"
fi

# Find an available port
PORT=8080
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    echo "Port $PORT is in use, trying next port..."
    PORT=$((PORT + 1))
done

echo ""
echo "🌐 Starting web server on port $PORT..."
echo ""

# Function to open browser
open_browser() {
    sleep 2  # Give server time to start
    
    # Detect OS and open browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "http://localhost:$PORT/index-comprehensive.html"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:$PORT/index-comprehensive.html"
        elif command -v gnome-open &> /dev/null; then
            gnome-open "http://localhost:$PORT/index-comprehensive.html"
        fi
    fi
}

# Start browser in background
open_browser &

echo "================================================"
echo "✨ Server running at:"
echo "   http://localhost:$PORT/index-comprehensive.html"
echo ""
echo "📌 Controls:"
echo "   • Press 'C' to toggle parameter panel"
echo "   • Press 'R' to reset particles"
echo "   • Press '1-5' to load presets"
echo "   • Click to create pulse effects"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo "================================================"
echo ""

# Start the server
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
else
    echo "❌ Error: Python is required to run the web server"
    echo "Please install Python 3 from https://www.python.org/"
    exit 1
fi
#!/bin/bash

# Particle Life Synth Server Manager
# Usage: ./server.sh [start|stop|restart|status]

PROJECT_DIR="/Users/yamb0x.eth/Yambo Studio Dropbox/Admin/8. Vibe Coding/particle-life-synth"
PORT=8000

case "$1" in
    start)
        echo "🚀 Starting Particle Life Synth server..."
        cd "$PROJECT_DIR"
        python3 serve.py
        ;;
    
    stop)
        echo "🛑 Stopping server on port $PORT..."
        lsof -ti :$PORT | xargs kill -9 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Server stopped"
        else
            echo "❌ No server running on port $PORT"
        fi
        ;;
    
    restart)
        echo "🔄 Restarting server..."
        lsof -ti :$PORT | xargs kill -9 2>/dev/null
        sleep 1
        cd "$PROJECT_DIR"
        python3 serve.py
        ;;
    
    status)
        if lsof -ti :$PORT > /dev/null 2>&1; then
            echo "✅ Server is running on port $PORT"
            echo "PID: $(lsof -ti :$PORT)"
        else
            echo "❌ Server is not running"
        fi
        ;;
    
    *)
        echo "Particle Life Synth Server Manager"
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the development server"
        echo "  stop    - Stop the server"
        echo "  restart - Restart the server"
        echo "  status  - Check if server is running"
        exit 1
        ;;
esac
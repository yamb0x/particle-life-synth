#!/usr/bin/env python3
"""
Simple development server for the Particle Life Synthesizer prototype
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

class DevServer:
    def __init__(self, port=8000):
        self.port = port
        self.project_root = Path(__file__).parent
        
    def start(self):
        os.chdir(self.project_root)
        
        handler = http.server.SimpleHTTPRequestHandler
        
        # Add MIME type for TypeScript files
        handler.extensions_map.update({
            '.ts': 'text/javascript',
            '.js': 'application/javascript',
            '.mjs': 'application/javascript',
        })
        
        with socketserver.TCPServer(("", self.port), handler) as httpd:
            print(f"🚀 Particle Life Synthesizer Development Server")
            print(f"📡 Server running at http://localhost:{self.port}")
            print(f"📁 Serving files from: {self.project_root}")
            print(f"🎯 Open http://localhost:{self.port} in your browser")
            print(f"⚡ Press Ctrl+C to stop the server")
            
            try:
                # Auto-open browser
                webbrowser.open(f"http://localhost:{self.port}")
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n🛑 Server stopped")

if __name__ == "__main__":
    server = DevServer()
    server.start()
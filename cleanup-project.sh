#!/bin/bash

echo "🧹 Cleaning up particle-life-synth project..."
echo "============================================"

# Create backup directory
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Files to remove (old versions and duplicates)
OLD_FILES=(
    "index-old.html"
    "README-old.md"
    "src/main-old.js"
    "src/main-comprehensive.ts"
    "src/main-comprehensive.js"
    "src/main-comprehensive.d.ts"
    "run-comprehensive.sh"
    "start-comprehensive.bat"
    "README-COMPREHENSIVE.md"
    "tsconfig-comprehensive.json"
    "GITHUB_SETUP.txt"
)

# Old particle system files (we're using Comprehensive versions now)
OLD_SYSTEM_FILES=(
    "src/core/ParticleSystem.ts"
    "src/core/ParticleSystem.js"
    "src/core/ParticleSystem.d.ts"
    "src/core/ForceField.ts"
    "src/core/ForceField.js"
    "src/core/ForceField.d.ts"
    "src/ui/ParameterPanel.ts"
    "src/ui/ParameterPanel.js"
    "src/ui/ParameterPanel.d.ts"
)

# Files we're not using yet (WebGL renderers)
UNUSED_FILES=(
    "src/rendering/WebGLRenderer.ts"
    "src/rendering/WebGLRenderer.js"
    "src/rendering/WebGLRenderer.d.ts"
    "src/rendering/TrailRenderer.ts"
    "src/rendering/TrailRenderer.js"
    "src/rendering/TrailRenderer.d.ts"
)

echo ""
echo "📋 Files to be cleaned up:"
echo ""

# Move old files to backup
echo "🔄 Moving old/duplicate files to backup..."
for file in "${OLD_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file"
        mv "$file" "$BACKUP_DIR/"
    fi
done

echo ""
echo "🔄 Moving old system files to backup..."
for file in "${OLD_SYSTEM_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file"
        mv "$file" "$BACKUP_DIR/"
    fi
done

echo ""
echo "🔄 Moving unused rendering files to backup..."
for file in "${UNUSED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file"
        mv "$file" "$BACKUP_DIR/"
    fi
done

# Clean up empty directories
echo ""
echo "🗑️  Removing empty directories..."
find . -type d -empty -delete 2>/dev/null

# Update start script to be simpler
echo ""
echo "✏️  Updating start scripts..."
cat > start.sh << 'EOF'
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
EOF

chmod +x start.sh

# Create a simple package.json if needed
echo ""
echo "📝 Updating package.json..."
cat > package.json << 'EOF'
{
  "name": "particle-life-synth",
  "version": "3.0.0",
  "description": "Comprehensive Particle Life System with 100+ parameters",
  "main": "src/main.js",
  "scripts": {
    "start": "./start.sh",
    "build": "tsc",
    "dev": "python3 -m http.server 8080"
  },
  "keywords": [
    "particle-life",
    "simulation",
    "emergence",
    "complex-systems"
  ],
  "author": "yamb0x",
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
EOF

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Backup created in: $BACKUP_DIR"
echo "  - Old files moved: ${#OLD_FILES[@]}"
echo "  - Old system files moved: ${#OLD_SYSTEM_FILES[@]}"
echo "  - Unused files moved: ${#UNUSED_FILES[@]}"
echo ""
echo "💡 To restore any file: cp $BACKUP_DIR/filename ."
echo "🚀 To run the app: ./start.sh"
echo ""
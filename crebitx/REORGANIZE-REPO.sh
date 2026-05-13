#!/bin/bash

# This script reorganizes the repo to have both frontend and backend folders
# Run this from the crebitx directory

echo "🔧 Starting repository reorganization..."

# Step 1: Create new branch
echo "📝 Creating new branch 'mallikarjun'..."
git checkout -b mallikarjun

# Step 2: Create temporary directory for reorganization
echo "📁 Creating temporary directory..."
TEMP_DIR="/tmp/crebitx-reorganize-$$"
mkdir -p "$TEMP_DIR"

# Step 3: Copy current frontend to temp
echo "📦 Copying frontend files..."
rsync -av --exclude='.git' --exclude='node_modules' --exclude='.next' \
  ./ "$TEMP_DIR/crebitx/"

# Step 4: Copy backend to temp
echo "📦 Copying backend files..."
rsync -av --exclude='node_modules' --exclude='dist' \
  ../crebitx-backend/ "$TEMP_DIR/crebitx-backend/"

# Step 5: Create README for new structure
cat > "$TEMP_DIR/README.md" << 'EOF'
# CREBITX - Complete Application

This repository contains both frontend and backend for the CREBITX application.

## Structure

```
├── crebitx/          # Next.js Frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
└── crebitx-backend/  # NestJS Backend
    ├── src/
    ├── migrations/
    └── package.json
```

## Quick Start

### Backend
```bash
cd crebitx-backend
docker-compose up -d
```

### Frontend
```bash
cd crebitx
npm install
npm run dev
```

## Documentation

- Frontend: See `crebitx/README.md`
- Backend: See `crebitx-backend/README.md`
- Setup Guide: See `SETUP.md`
EOF

# Step 6: Clear current directory (except .git)
echo "🧹 Clearing current directory..."
find . -maxdepth 1 ! -name '.git' ! -name '.gitignore' ! -name '.' ! -name '..' -exec rm -rf {} +

# Step 7: Copy reorganized structure back
echo "📋 Copying reorganized structure..."
cp -r "$TEMP_DIR/"* .

# Step 8: Create .gitignore for root
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
.next/
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Environment
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
postgres_data/

# Temp
tmp/
temp/
EOF

# Step 9: Add all files
echo "➕ Adding files to git..."
git add .

# Step 10: Commit
echo "💾 Committing changes..."
git commit -m "Reorganize: Move frontend to crebitx/ and add backend to crebitx-backend/

- Frontend code moved to crebitx/ subdirectory
- Backend code added to crebitx-backend/ subdirectory
- Updated README for new structure
- Both applications now in single repository for easier management"

# Step 11: Show status
echo "✅ Reorganization complete!"
echo ""
echo "📊 Current structure:"
ls -la
echo ""
echo "🌿 Current branch:"
git branch --show-current
echo ""
echo "📝 Last commit:"
git log -1 --oneline
echo ""
echo "🚀 To push to remote:"
echo "   git push origin mallikarjun"
echo ""
echo "⚠️  Note: You'll need to update CI/CD and deployment configs for new structure"

# Cleanup
rm -rf "$TEMP_DIR"

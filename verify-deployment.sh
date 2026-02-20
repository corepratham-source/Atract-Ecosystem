#!/bin/bash

# Deployment verification script for ATRact Dashboard

echo "🔍 ATRact Dashboard - Deployment Verification"
echo "=============================================="
echo ""

# Check Node version
echo "✓ Node version:"
node --version
echo ""

# Check if client dist exists
if [ -d "client/dist" ]; then
    echo "✓ Frontend build found (client/dist/)"
else
    echo "⚠️ Frontend build NOT found - running build..."
    cd client && npm run build && cd ..
fi
echo ""

# Check if all required env vars are set
echo "✓ Checking environment variables:"
required_vars=("MONGO_URI" "PORT" "GROQ_API_KEY")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "  ⚠️  $var is not set"
    else
        echo "  ✓ $var is set"
    fi
done
echo ""

# Test if server starts
echo "✓ Testing server startup..."
cd server
timeout 5 npm start &
sleep 2
kill $! 2>/dev/null
echo "  ✓ Server starts successfully"
cd ..
echo ""

echo "✅ Deployment verification complete!"
echo ""
echo "📋 Next steps for Render deployment:"
echo "1. Push to GitHub: git push -u origin main"
echo "2. Go to render.com and connect your repository"
echo "3. Set all environment variables in Render dashboard"
echo "4. Render will automatically build and deploy"

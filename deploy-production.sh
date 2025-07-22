#!/bin/bash

# Deploy to Vercel Production
# This script helps deploy directly to production when branch settings are misconfigured

echo "🚀 Deploying to Vercel Production..."
echo "=================================="

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Deploy to production
echo "📦 Creating production deployment..."
vercel --prod

echo "✅ Production deployment initiated!"
echo "Check your deployment at: https://particle-life-synth.vercel.app"
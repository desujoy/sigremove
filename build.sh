#!/bin/bash
set -e

echo "🚀 Starting Smart Build (Hybrid CI)..."

# Ensure Bun is available
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please enable Bun in Cloudflare Pages settings (Environment Variables: BUN_VERSION=latest)."
    exit 1
fi

REBUILD_WASM=false

# 1. Check if we need to rebuild WASM
if [ ! -d "sigremove_rs/pkg" ]; then
    echo "⚠️  WASM artifact missing. Rebuilding..."
    REBUILD_WASM=true
else
    # Determine commit range
    COMMIT_FROM="${CF_PAGES_PREVIOUS_COMMIT_SHA:-HEAD^}"
    COMMIT_TO="${CF_PAGES_COMMIT_SHA:-HEAD}"
    
    echo "🔍 Checking diff between $COMMIT_FROM and $COMMIT_TO..."
    
    # Check for changes in sigremove_rs
    # using '|| true' to prevent exit on git error, capturing output
    if ! CHANGES=$(git diff --name-only "$COMMIT_FROM" "$COMMIT_TO" 2>/dev/null); then
        echo "⚠️  Git check failed (shallow clone?). Forcing build to be safe."
        REBUILD_WASM=true
    elif echo "$CHANGES" | grep -q "^sigremove_rs/"; then
        echo "📦 Rust changes detected:"
        echo "$CHANGES" | grep "^sigremove_rs/" | head -n 5
        REBUILD_WASM=true
    else
        echo "✅ No Rust changes detected."
    fi
fi

# 2. Rebuild WASM if needed
if [ "$REBUILD_WASM" = "true" ]; then
    echo "🛠️  Building WASM module..."
    
    # Install wasm-pack if missing
    if ! command -v wasm-pack &> /dev/null; then
        echo "⬇️  Installing wasm-pack..."
        curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
    fi

    cd sigremove_rs
    wasm-pack build --target web
    cd ..
else
    echo "⏩ Using cached WASM artifacts."
fi

# 3. Build Frontend
echo "🎨 Building Frontend..."
cd sigremove-web
bun install
bun run build

echo "✨ Build Complete. Output directory: sigremove-web/dist"

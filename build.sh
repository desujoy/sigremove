#!/bin/bash
set -e
set -x  # Enable debug logging

echo "🚀 Starting Smart Build (Hybrid CI)..."

# Ensure Bun is available
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed."
    exit 1
fi

# Ensure Cargo/Rust env is loaded
export PATH="$HOME/.cargo/bin:$PATH"

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
    if ! CHANGES=$(git diff --name-only "$COMMIT_FROM" "$COMMIT_TO" 2>/dev/null); then
        echo "⚠️  Git check failed. Forcing build."
        REBUILD_WASM=true
    elif echo "$CHANGES" | grep -q "^sigremove_rs/"; then
        echo "📦 Rust changes detected."
        REBUILD_WASM=true
    else
        echo "✅ No Rust changes detected."
    fi
fi

# 2. Rebuild WASM if needed
if [ "$REBUILD_WASM" = "true" ]; then
    echo "🛠️  Building WASM module..."
    
    if ! command -v cargo &> /dev/null; then
         echo "❌ Cargo not found. Trying to source cargo env..."
         if [ -f "$HOME/.cargo/env" ]; then
            source "$HOME/.cargo/env"
         fi
    fi

    # Install wasm-pack if missing
    if ! command -v wasm-pack &> /dev/null; then
        echo "⬇️  Installing wasm-pack..."
        curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
    fi
    
    # Verify wasm-pack again
    if ! command -v wasm-pack &> /dev/null; then
        echo "❌ wasm-pack failed to install or not in PATH ($PATH)."
        exit 1
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

echo "✨ Build Complete."

#!/bin/bash
set -e
set -x

echo "🚀 Starting Smart Build (Hybrid CI)..."

# Ensure Bun is available
# Ensure Bun is available
if ! command -v bun &> /dev/null; then
    echo "⬇️  Bun not found. Installing..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

if ! command -v bun &> /dev/null; then
    echo "❌ Failed to install Bun."
    exit 1
fi

export PATH="$HOME/.cargo/bin:$PATH"

REBUILD_WASM=false

# 1. Logic Check
if [ ! -d "sigremove_rs/pkg" ]; then
    echo "⚠️  WASM artifact missing. Rebuilding..."
    REBUILD_WASM=true
else
    # Try diff
    COMMIT_FROM="${CF_PAGES_PREVIOUS_COMMIT_SHA}"
    COMMIT_TO="${CF_PAGES_COMMIT_SHA:-HEAD}"
    
    if [ -z "$COMMIT_FROM" ]; then
        echo "ℹ️  No previous commit SHA (First deploy?). Rebuilding to verify environment."
        REBUILD_WASM=true
    else
        echo "🔍 Checking diff between $COMMIT_FROM and $COMMIT_TO..."
        if ! CHANGES=$(git diff --name-only "$COMMIT_FROM" "$COMMIT_TO" 2>/dev/null); then
             echo "⚠️  Git diff failed. Forcing rebuild."
             REBUILD_WASM=true
        elif echo "$CHANGES" | grep -v "^sigremove_rs/pkg" | grep -q "^sigremove_rs/"; then
             echo "📦 Rust changes detected:"
             echo "$CHANGES" | grep -v "^sigremove_rs/pkg" | grep "^sigremove_rs/" | head -n 5
             REBUILD_WASM=true
        else
             echo "✅ No Rust changes detected."
        fi
    fi
fi

# 2. Rebuild WASM if needed
if [ "$REBUILD_WASM" = "true" ]; then
    echo "🛠️  Building WASM module..."
    
    # INSTALL RUST if missing
    if ! command -v cargo &> /dev/null; then
         echo "⬇️  Installing Rust (rustup)..."
         curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
         source "$HOME/.cargo/env"
    fi
    
    # Check again
    if ! command -v cargo &> /dev/null; then
        echo "❌ Rust installation failed."
        exit 1
    fi

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
echo "🎨 Building Frontend (SSG)..."
cd sigremove-web
bun install
bun run build

# Verify SSG Output
if [ ! -f "dist/client/index.html" ]; then
    echo "❌ SSG Build failed: dist/client/index.html not found."
    exit 1
fi

if ! grep -q "Initializing Core" "dist/client/index.html"; then
    echo "⚠️  Warning: SSG App Shell not detected in index.html"
fi

# Cleanup intermediate artifacts
echo "🧹 Cleaning up intermediate artifacts..."
rm -rf dist/server

# Flatten output (ensure dest doesn't conflict)
rm -rf dist/assets dist/*.{js,css,html,png,xml,txt,ico,svg,webmanifest,json,wasm}
cp -r dist/client/* dist/
rm -rf dist/client

echo "✅ Frontend Build Success (Output: dist)"

echo "✨ Build Complete."

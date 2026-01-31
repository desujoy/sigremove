# SigRemove 🛡️📄

**SigRemove** is a high-performance, privacy-focused PDF cleaner that runs entirely in your browser using WebAssembly (WASM). It removes password protection, digital signatures, and annotations without your data ever leaving your device.

## Features
-   🔒 **Privacy First**: All processing happens client-side. No server uploads.
-   ⚡ **Fast**: Powered by Rust and WebAssembly (`lopdf`).
-   🧼 **Cleaner**: Removes `/Annots`, `/AcroForm`, and `/Sig` artifacts effectively.
-   🗝️ **Unlock**: Handles password-protected PDFs seamlessly.
-   🎨 **Modern UI**: Built with Vite, React, TypeScript, and Framer Motion.

## Project Structure
This is a monorepo containing:
-   `sigremove_rs/`: Core Rust library (WASM logic).
-   `sigremove-web/`: Frontend application.

## Quick Start

### Prerequisites
-   [Bun](https://bun.sh) (Recommended) or Node.js
-   Rust & `wasm-pack` (only if modifying core logic)

### Running Locally
1.  **Clone the repo:**
    ```bash
    git clone https://github.com/desujoy/sigremove.git
    cd sigremove
    ```

2.  **Run the frontend:**
    ```bash
    cd sigremove-web
    bun install
    bun dev
    ```
    Open `http://localhost:5173`.

> **Note**: The repository includes pre-built WASM artifacts in `sigremove_rs/pkg`. You don't need to build Rust to run the web app unless you change the Rust code.

## Development (Hybrid CI)
If you modify `sigremove_rs`, you must rebuild the WASM:
```bash
./build.sh
```
This script automatically detects changes and installs `wasm-pack` if needed.

## License
MIT

# Tauri Executor Template

A comprehensive template for creating Tauri desktop applications that can execute bundled Windows executables securely through a web interface.

## Features

- 🔒 **Secure Execution**: Uses Tauri's sidecar system for safe process execution
- 🖥️ **Windows Compatible**: Built specifically for Windows deployment
- 🌐 **Web Interface**: Modern HTML/CSS/JavaScript frontend
- ⚡ **Dual Execution Modes**: Both blocking and non-blocking execution
- 📦 **Bundled Executables**: Includes sample dialog tool for demonstration
- 🛡️ **Proper Security**: Configured with appropriate capabilities and permissions

## Prerequisites

Before starting, ensure you have the necessary tools installed on your Windows development machine:

### Required Tools

1. **Rust** (required for Tauri backend)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js** - Download from [nodejs.org](https://nodejs.org)

3. **Tauri CLI**
   ```bash
   npm install -g @tauri-apps/cli@latest
   ```

4. **Visual Studio Build Tools** with C++ workload
   - Download from: https://visualstudio.microsoft.com/downloads/
   - Or install MinGW for C++ compilation

## Quick Start

1. **Clone or download this template**

2. **Build the sample executable**
   ```bash
   cd dialog-tool
   build.bat
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run in development mode**
   ```bash
   npm run tauri dev
   
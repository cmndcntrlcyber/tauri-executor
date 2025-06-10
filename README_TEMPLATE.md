# Tauri Executable Runner Template

A complete template for creating Tauri desktop applications that can securely execute bundled Windows executables through a modern web interface.

## Features

- **Secure Execution**: Demonstrates safe execution of bundled executables using Tauri's security model
- **Cross-Platform Ready**: Built with Tauri for Windows, macOS, and Linux compatibility
- **Modern Web Interface**: Clean HTML/CSS/JavaScript frontend with real-time output display
- **Dual Execution Modes**: Both blocking and asynchronous execution patterns
- **Template Structure**: Complete project structure ready for customization
- **Build System**: Automated build process for executables and bundling

## Project Structure

```
tauri-executor/
├── src/                         # Frontend files
│   ├── index.html              # Main application interface
│   ├── main.js                 # JavaScript logic and Tauri API calls
│   └── style.css               # Application styling
├── src-tauri/                  # Tauri backend
│   ├── binaries/              # Bundled executables directory
│   │   └── dialog-tool-x86_64-pc-windows-msvc.exe
│   ├── capabilities/          # Security permissions (Tauri v2)
│   │   └── default.json
│   ├── src/
│   │   ├── lib.rs             # Main application logic
│   │   └── main.rs            # Entry point
│   ├── Cargo.toml             # Rust dependencies
│   └── tauri.conf.json        # Tauri configuration
├── dialog-tool/               # Example executable source
│   ├── dialog.cpp             # C++ source for demo executable
│   ├── build.bat              # Windows build script
│   └── build.sh               # Unix build script
└── package.json               # Node.js dependencies
```

## Quick Start

### Prerequisites

1. **Node.js** - Download from [nodejs.org](https://nodejs.org)
2. **Rust** - Install from [rustup.rs](https://rustup.rs)
3. **Tauri CLI**:
   ```bash
   npm install -g @tauri-apps/cli
   ```
4. **C++ Compiler** (for building sample executable):
   - Windows: Visual Studio Build Tools or MinGW
   - Linux/macOS: gcc/g++

### Setup

1. **Clone this template**

2. **Build the sample executable**:
   ```bash
   # On Windows
   cd dialog-tool
   build.bat
   
   # On Linux/macOS
   cd dialog-tool
   chmod +x build.sh
   ./build.sh
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run in development mode**:
   ```bash
   npm run tauri dev
   ```

## Template Components

### Frontend (Web Interface)

- **HTML**: Clean, accessible interface with input fields and action buttons
- **CSS**: Professional styling with responsive design
- **JavaScript**: Tauri API integration for executing bundled programs

### Backend (Rust)

- **Command Handlers**: Secure execution of bundled executables
- **Error Handling**: Comprehensive error reporting and logging
- **Async Support**: Non-blocking execution with real-time output

### Sample Executable

- **Cross-platform C++**: Simple demonstration program
- **Build Scripts**: Automated compilation for different platforms
- **Output Capture**: Console output routing back to the web interface

## Customization Guide

### Adding Your Own Executable

1. **Place your executable** in `src-tauri/binaries/`
2. **Update tauri.conf.json**:
   ```json
   "externalBin": [
     "binaries/your-executable-name"
   ]
   ```
3. **Modify the Rust code** in `src-tauri/src/lib.rs` to call your executable
4. **Update the frontend** in `src/main.js` to match your interface needs

### Security Configuration

The template includes proper security configurations:

- **Tauri v1.x**: Uses `allowlist` in `tauri.conf.json`
- **Tauri v2.x**: Uses `capabilities` system in `src-tauri/capabilities/`
- **CSP**: Content Security Policy for web interface protection

### Building for Production

```bash
# Build the application
npm run tauri build

# The installer will be in src-tauri/target/release/bundle/
```

## Example Use Cases

- **Development Tools**: Bundle CLI tools with a GUI interface
- **System Utilities**: Wrap command-line utilities in a modern interface
- **Data Processing**: Execute analysis scripts with real-time progress
- **Legacy Integration**: Modernize old executables with new interfaces

## Security Best Practices

1. **Validate Inputs**: Always sanitize user inputs before passing to executables
2. **Limit Permissions**: Use minimal required permissions in Tauri configuration
3. **Path Validation**: Ensure executables are only accessed from intended locations
4. **Error Handling**: Properly handle and log execution failures
5. **Resource Management**: Implement timeouts and resource limits

## Troubleshooting

### Common Issues

**Executable not found**:
- Verify the executable is in `src-tauri/binaries/`
- Check the path in `tauri.conf.json` matches exactly
- Ensure executable has proper permissions

**Permission denied**:
- Review Tauri security configuration
- Check executable file permissions
- Verify allowlist/capabilities settings

**Build failures**:
- Ensure all dependencies are installed
- Check Rust and Node.js versions
- Review build logs for specific errors

## Contributing

This template provides a foundation for building desktop applications that execute bundled programs. Customize it for your specific needs and requirements.

## License

This template is provided as-is for educational and development purposes.
# Tauri Executable Runner Template - Complete Implementation Guide

This template provides a production-ready foundation for creating Tauri desktop applications that securely execute bundled Windows executables through a modern web interface.

## What's Included

### 1. Complete Project Structure
- **Frontend**: Modern HTML/CSS/JavaScript interface with real-time output display
- **Backend**: Rust-based Tauri application with secure executable execution
- **Sample Executable**: Cross-platform C++ demo program with build scripts
- **Configuration**: Proper security settings and bundling configuration

### 2. Security Features
- Secure executable execution using Tauri's permission system
- Input validation and sanitization
- Proper error handling and logging
- Resource management and timeout handling

### 3. Dual Execution Modes
- **Blocking Execution**: Wait for completion with full output capture
- **Asynchronous Execution**: Non-blocking with real-time event streaming

## Implementation Details

### Frontend Components

**HTML Interface (`src/index.html`)**:
- Clean, professional interface with input fields
- Action buttons for different execution modes
- Real-time output display area
- Status indicators and error handling

**JavaScript Logic (`src/main.js`)**:
- Tauri API integration for secure IPC communication
- Event listeners for user interactions
- Real-time output streaming and display
- Error handling with user feedback

**Styling (`src/style.css`)**:
- Modern, responsive design
- Professional color scheme and typography
- Interactive elements with hover states
- Status indicators for different message types

### Backend Components

**Rust Application (`src-tauri/src/lib.rs`)**:
- Secure command handlers for executable execution
- Path resolution for bundled resources
- Async runtime for non-blocking operations
- Comprehensive error handling and logging

**Configuration (`src-tauri/tauri.conf.json`)**:
- Proper security permissions and allowlists
- Bundle configuration for executable inclusion
- Window settings and application metadata
- Resource and external binary declarations

### Sample Executable

**C++ Source (`dialog-tool/dialog.cpp`)**:
- Cross-platform command-line program
- Command-line argument parsing
- Console output for capture by Tauri
- Demonstration of typical executable patterns

**Build Scripts**:
- `build.bat`: Windows batch script using Visual Studio or MinGW
- `build.sh`: Unix shell script using gcc/g++
- Automatic copying to Tauri binaries directory

## Usage Patterns

### Basic Executable Execution
```javascript
// Frontend call
const result = await invoke('show_dialog', { 
    message: 'Hello World',
    title: 'Demo Dialog'
});

// Rust handler
#[tauri::command]
async fn show_dialog(message: String, title: Option<String>) -> Result<DialogResult, String>
```

### Asynchronous Execution with Events
```javascript
// Start async execution
await invoke('show_dialog_async', { message, title });

// Listen for events
listen('dialog-output', (event) => {
    console.log('Output:', event.payload);
});
```

## Customization Guide

### Adding Your Own Executable

1. **Compile your executable** and place it in `src-tauri/binaries/`
2. **Update the configuration** in `tauri.conf.json`:
   ```json
   "externalBin": ["binaries/your-executable-name"]
   ```
3. **Modify the Rust handlers** to call your executable with appropriate arguments
4. **Update the frontend interface** to match your executable's requirements

### Security Customization

**Tauri v1.x (Current Template)**:
```json
"allowlist": {
  "shell": {
    "execute": true,
    "sidecar": true
  },
  "path": { "all": true }
}
```

**Tauri v2.x (Future Migration)**:
```json
"permissions": [
  "shell:allow-execute",
  "shell:allow-spawn",
  "core:default"
]
```

### Interface Customization

- **Input Fields**: Modify HTML and JavaScript to match your executable's parameters
- **Output Display**: Customize the output formatting and styling
- **Error Handling**: Implement specific error messages for your use case
- **Branding**: Update colors, fonts, and layout to match your application

## Production Deployment

### Building the Application
```bash
# Development
npm run tauri dev

# Production build
npm run tauri build
```

### Distribution
- Windows: NSIS installer or MSI package
- macOS: DMG or PKG installer
- Linux: AppImage or DEB/RPM packages

### Code Signing
- Configure code signing certificates for production distribution
- Update bundle configuration with signing details
- Test installation on clean systems

## Best Practices

### Security
- Always validate user inputs before passing to executables
- Use minimal required permissions in Tauri configuration
- Implement proper error handling for all execution paths
- Log security-relevant events for auditing

### Performance
- Implement timeouts for long-running executables
- Use async execution for better user experience
- Handle large output streams efficiently
- Optimize bundle size by including only necessary files

### User Experience
- Provide clear feedback during execution
- Implement progress indicators for long operations
- Handle edge cases gracefully
- Offer helpful error messages and recovery options

## Architecture Benefits

This template provides:
- **Security**: Leverages Tauri's sandboxed execution model
- **Performance**: Native desktop performance with web UI flexibility
- **Maintainability**: Clear separation between frontend and backend logic
- **Extensibility**: Easy to add new executables and functionality
- **Cross-platform**: Works on Windows, macOS, and Linux with minimal changes

## Migration Notes

When upgrading to newer Tauri versions:
- Review security configuration changes
- Update API calls to match new patterns
- Test executable resolution and permissions
- Verify bundle configuration compatibility

This template serves as a comprehensive foundation for building professional desktop applications that bridge modern web interfaces with existing command-line tools and executables.
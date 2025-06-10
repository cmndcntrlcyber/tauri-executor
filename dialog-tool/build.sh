#!/bin/bash
echo "Building dialog tool executable..."

# Check if we have gcc/g++ available
if command -v g++ &> /dev/null; then
    echo "Using g++ compiler..."
    g++ dialog.cpp -o dialog-tool-x86_64-pc-windows-msvc.exe
    
    if [ $? -eq 0 ]; then
        echo "Build successful!"
        
        # Create binaries directory if it doesn't exist
        mkdir -p ../src-tauri/binaries
        cp dialog-tool-x86_64-pc-windows-msvc.exe ../src-tauri/binaries/
        
        echo "Executable copied to src-tauri/binaries/"
        echo "Executable details:"
        ls -la dialog-tool-x86_64-pc-windows-msvc.exe
    else
        echo "Build failed!"
        exit 1
    fi
else
    echo "g++ compiler not found!"
    exit 1
fi
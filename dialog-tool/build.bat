@echo off
echo Building dialog tool executable...

:: Check if Visual Studio compiler is available
where cl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Visual Studio compiler not found. Trying with MinGW...
    where g++ >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo Neither cl.exe nor g++.exe found in PATH
        echo Please install Visual Studio Build Tools or MinGW
        pause
        exit /b 1
    )
    
    echo Using MinGW compiler...
    g++ dialog.cpp -o dialog-tool-x86_64-pc-windows-msvc.exe -luser32 -static
) else (
    echo Using Visual Studio compiler...
    cl /EHsc dialog.cpp /Fe:dialog-tool-x86_64-pc-windows-msvc.exe user32.lib
)

if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    
    :: Copy to Tauri binaries directory
    if not exist "..\src-tauri\binaries" mkdir "..\src-tauri\binaries"
    copy dialog-tool-x86_64-pc-windows-msvc.exe ..\src-tauri\binaries\
    
    echo Executable copied to src-tauri/binaries/
) else (
    echo Build failed!
    pause
    exit /b 1
)

pause

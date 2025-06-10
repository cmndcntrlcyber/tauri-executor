@echo off
:: Windows Deployment Script for Cross-Platform Executable Runner
:: Run this on Windows endpoints to set up the agent

echo Cross-Platform Executable Runner - Windows Setup
echo ================================================

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with administrator privileges
) else (
    echo ERROR: This script requires administrator privileges
    echo Please run as administrator
    pause
    exit /b 1
)

:: Set deployment paths
set INSTALL_DIR=C:\ExecutableRunner
set BINARIES_DIR=%INSTALL_DIR%\binaries
set LOGS_DIR=%INSTALL_DIR%\logs

:: Create directories
echo Creating directories...
mkdir "%INSTALL_DIR%" 2>nul
mkdir "%BINARIES_DIR%" 2>nul
mkdir "%LOGS_DIR%" 2>nul

:: Copy executables if they exist
if exist "dialog-tool.exe" (
    echo Copying dialog-tool.exe to binaries directory...
    copy "dialog-tool.exe" "%BINARIES_DIR%\"
) else (
    echo WARNING: dialog-tool.exe not found in current directory
    echo You will need to manually copy your Windows executables to:
    echo %BINARIES_DIR%
)

:: Copy PowerShell agent script
if exist "windows-agent.ps1" (
    echo Copying Windows agent script...
    copy "windows-agent.ps1" "%INSTALL_DIR%\"
) else (
    echo ERROR: windows-agent.ps1 not found
    echo Please ensure the PowerShell script is in the current directory
    pause
    exit /b 1
)

:: Create service start script
echo Creating start script...
echo @echo off > "%INSTALL_DIR%\start-agent.bat"
echo cd /d "%INSTALL_DIR%" >> "%INSTALL_DIR%\start-agent.bat"
echo powershell.exe -ExecutionPolicy Bypass -File "windows-agent.ps1" -Port 8080 -LogPath "%LOGS_DIR%\agent.log" -ExecutablesPath "%BINARIES_DIR%" >> "%INSTALL_DIR%\start-agent.bat"
echo pause >> "%INSTALL_DIR%\start-agent.bat"

:: Create service stop script
echo Creating stop script...
echo @echo off > "%INSTALL_DIR%\stop-agent.bat"
echo taskkill /F /IM powershell.exe /FI "WINDOWTITLE eq Windows PowerShell*" >> "%INSTALL_DIR%\stop-agent.bat"
echo echo Agent stopped >> "%INSTALL_DIR%\stop-agent.bat"
echo pause >> "%INSTALL_DIR%\stop-agent.bat"

:: Configure Windows Firewall
echo Configuring Windows Firewall...
netsh advfirewall firewall add rule name="Executable Runner Agent" dir=in action=allow protocol=TCP localport=8080

:: Set PowerShell execution policy
echo Setting PowerShell execution policy...
powershell.exe -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine -Force"

:: Create uninstall script
echo Creating uninstall script...
echo @echo off > "%INSTALL_DIR%\uninstall.bat"
echo echo Stopping agent... >> "%INSTALL_DIR%\uninstall.bat"
echo taskkill /F /IM powershell.exe /FI "WINDOWTITLE eq Windows PowerShell*" 2^>nul >> "%INSTALL_DIR%\uninstall.bat"
echo echo Removing firewall rule... >> "%INSTALL_DIR%\uninstall.bat"
echo netsh advfirewall firewall delete rule name="Executable Runner Agent" >> "%INSTALL_DIR%\uninstall.bat"
echo echo Removing installation directory... >> "%INSTALL_DIR%\uninstall.bat"
echo rd /s /q "%INSTALL_DIR%" >> "%INSTALL_DIR%\uninstall.bat"
echo echo Uninstallation complete >> "%INSTALL_DIR%\uninstall.bat"

echo.
echo ================================================
echo Installation Complete!
echo ================================================
echo.
echo Installation directory: %INSTALL_DIR%
echo Binaries directory: %BINARIES_DIR%
echo Logs directory: %LOGS_DIR%
echo.
echo To start the agent:
echo   Run: %INSTALL_DIR%\start-agent.bat
echo.
echo To stop the agent:
echo   Run: %INSTALL_DIR%\stop-agent.bat
echo.
echo To uninstall:
echo   Run: %INSTALL_DIR%\uninstall.bat
echo.
echo The agent will listen on port 8080
echo Make sure this port is accessible from your Ubuntu host
echo.
echo IMPORTANT: Copy your Windows executables to:
echo %BINARIES_DIR%
echo.
pause
# Windows Agent for Cross-Platform Executable Runner
# This PowerShell script runs on Windows endpoints to receive and execute commands

param(
    [Parameter(Mandatory=$false)]
    [int]$Port = 8080,
    
    [Parameter(Mandatory=$false)]
    [string]$LogPath = "C:\temp\executor-agent.log",
    
    [Parameter(Mandatory=$false)]
    [string]$ExecutablesPath = "C:\ExecutableRunner\binaries",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey = $null
)

# Create required directories
New-Item -ItemType Directory -Force -Path (Split-Path $LogPath)
New-Item -ItemType Directory -Force -Path $ExecutablesPath

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogPath -Value $logEntry
}

function Execute-Command {
    param(
        [string]$ExecutablePath,
        [string[]]$Arguments,
        [int]$TimeoutSeconds = 60
    )
    
    try {
        Write-Log "Executing: $ExecutablePath with args: $($Arguments -join ' ')"
        
        # Validate executable exists
        if (-not (Test-Path $ExecutablePath)) {
            throw "Executable not found: $ExecutablePath"
        }
        
        # Start process with timeout
        $process = Start-Process -FilePath $ExecutablePath -ArgumentList $Arguments -PassThru -NoNewWindow -RedirectStandardOutput "stdout.tmp" -RedirectStandardError "stderr.tmp"
        
        # Wait for completion with timeout
        $completed = $process.WaitForExit($TimeoutSeconds * 1000)
        
        if (-not $completed) {
            $process.Kill()
            throw "Process timeout after $TimeoutSeconds seconds"
        }
        
        # Read output
        $stdout = if (Test-Path "stdout.tmp") { Get-Content "stdout.tmp" -Raw } else { "" }
        $stderr = if (Test-Path "stderr.tmp") { Get-Content "stderr.tmp" -Raw } else { "" }
        
        # Cleanup temp files
        Remove-Item -Path "stdout.tmp", "stderr.tmp" -ErrorAction SilentlyContinue
        
        return @{
            Success = ($process.ExitCode -eq 0)
            ExitCode = $process.ExitCode
            StandardOutput = $stdout.Trim()
            StandardError = $stderr.Trim()
            ExecutionTime = (Get-Date)
        }
        
    } catch {
        Write-Log "Execution failed: $($_.Exception.Message)" "ERROR"
        return @{
            Success = $false
            ExitCode = -1
            StandardOutput = ""
            StandardError = $_.Exception.Message
            ExecutionTime = (Get-Date)
        }
    }
}

function Handle-ExecuteRequest {
    param([hashtable]$RequestData, [System.Net.HttpListenerResponse]$Response)
    
    try {
        $message = $RequestData.message
        $title = $RequestData.title
        
        # Find the dialog executable
        $executableName = "dialog-tool.exe"
        $executablePath = Join-Path $ExecutablesPath $executableName
        
        # If not found locally, try some common locations
        if (-not (Test-Path $executablePath)) {
            $commonPaths = @(
                ".\dialog-tool.exe",
                "C:\Windows\System32\dialog-tool.exe",
                "${env:ProgramFiles}\ExecutableRunner\dialog-tool.exe"
            )
            
            foreach ($path in $commonPaths) {
                if (Test-Path $path) {
                    $executablePath = $path
                    break
                }
            }
        }
        
        # Prepare arguments
        $arguments = @($message)
        if ($title) {
            $arguments += $title
        }
        
        # Execute the command
        $result = Execute-Command -ExecutablePath $executablePath -Arguments $arguments
        
        # Prepare response
        $responseData = @{
            success = $result.Success
            message = $result.StandardOutput
            error = $result.StandardError
            code = $result.ExitCode
            executionMode = "windows_agent"
            hostname = $env:COMPUTERNAME
            username = $env:USERNAME
            timestamp = $result.ExecutionTime.ToString("o")
        }
        
        Write-Log "Execution completed. Success: $($result.Success), ExitCode: $($result.ExitCode)"
        
    } catch {
        Write-Log "Request handling failed: $($_.Exception.Message)" "ERROR"
        $responseData = @{
            success = $false
            message = ""
            error = $_.Exception.Message
            code = -1
            executionMode = "windows_agent"
            hostname = $env:COMPUTERNAME
            timestamp = (Get-Date).ToString("o")
        }
    }
    
    # Send JSON response
    $jsonResponse = $responseData | ConvertTo-Json -Depth 10
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
    
    $Response.ContentType = "application/json"
    $Response.ContentLength64 = $buffer.Length
    $Response.StatusCode = 200
    $Response.OutputStream.Write($buffer, 0, $buffer.Length)
    $Response.Close()
}

function Handle-StatusRequest {
    param([System.Net.HttpListenerResponse]$Response)
    
    # Get system uptime
    $uptime = (Get-Date) - (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime
    
    # Get available executables
    $availableExecutables = @()
    if (Test-Path $ExecutablesPath) {
        $executables = Get-ChildItem -Path $ExecutablesPath -File | Where-Object { $_.Extension -in @('.exe', '.bat', '.cmd') }
        $availableExecutables = $executables | ForEach-Object { 
            @{
                name = $_.Name
                size = $_.Length
                modified = $_.LastWriteTime.ToString("o")
            }
        }
    }
    
    $statusData = @{
        status = "online"
        hostname = $env:COMPUTERNAME
        username = $env:USERNAME
        domain = $env:USERDOMAIN
        platform = "windows"
        architecture = $env:PROCESSOR_ARCHITECTURE
        osVersion = [System.Environment]::OSVersion.VersionString
        powershellVersion = $PSVersionTable.PSVersion.ToString()
        executablesPath = $ExecutablesPath
        availableExecutables = $availableExecutables
        uptimeHours = [math]::Round($uptime.TotalHours, 2)
        freeMemoryMB = [math]::Round((Get-CimInstance -ClassName Win32_OperatingSystem).FreePhysicalMemory / 1024, 0)
        totalMemoryMB = [math]::Round((Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory / 1MB, 0)
        agentVersion = "1.0"
        timestamp = (Get-Date).ToString("o")
    }
    
    $jsonResponse = $statusData | ConvertTo-Json -Depth 10
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
    
    $Response.ContentType = "application/json"
    $Response.ContentLength64 = $buffer.Length
    $Response.StatusCode = 200
    $Response.OutputStream.Write($buffer, 0, $buffer.Length)
    $Response.Close()
}

function Start-HttpListener {
    try {
        # Create HTTP listener
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://+:$Port/")
        
        Write-Log "Starting Windows Agent on port $Port"
        Write-Log "Executables path: $ExecutablesPath"
        Write-Log "Log path: $LogPath"
        
        $listener.Start()
        Write-Log "Windows Agent listening on http://localhost:$Port"
        
        while ($listener.IsListening) {
            try {
                # Wait for request
                $context = $listener.GetContext()
                $request = $context.Request
                $response = $context.Response
                
                Write-Log "Received $($request.HttpMethod) request to $($request.Url.AbsolutePath)"
                
                # Enable CORS
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")
                
                # Handle OPTIONS request
                if ($request.HttpMethod -eq "OPTIONS") {
                    $response.StatusCode = 200
                    $response.Close()
                    continue
                }
                
                # Validate API key if configured
                if ($ApiKey) {
                    $authHeader = $request.Headers["Authorization"]
                    if (-not $authHeader -or $authHeader -ne "Bearer $ApiKey") {
                        $response.StatusCode = 401
                        $response.Close()
                        Write-Log "Unauthorized request - invalid API key" "WARN"
                        continue
                    }
                }
                
                # Route requests
                switch ($request.Url.AbsolutePath) {
                    "/execute" {
                        if ($request.HttpMethod -eq "POST") {
                            # Read request body
                            $reader = New-Object System.IO.StreamReader($request.InputStream)
                            $body = $reader.ReadToEnd()
                            $reader.Close()
                            
                            $requestData = $body | ConvertFrom-Json -AsHashtable
                            Handle-ExecuteRequest -RequestData $requestData -Response $response
                        } else {
                            $response.StatusCode = 405
                            $response.Close()
                        }
                    }
                    "/status" {
                        if ($request.HttpMethod -eq "GET") {
                            Handle-StatusRequest -Response $response
                        } else {
                            $response.StatusCode = 405
                            $response.Close()
                        }
                    }
                    default {
                        $response.StatusCode = 404
                        $response.Close()
                    }
                }
                
            } catch {
                Write-Log "Request processing error: $($_.Exception.Message)" "ERROR"
                try {
                    $response.StatusCode = 500
                    $response.Close()
                } catch {
                    # Response already closed
                }
            }
        }
        
    } catch {
        Write-Log "HTTP listener error: $($_.Exception.Message)" "ERROR"
    } finally {
        if ($listener) {
            $listener.Stop()
            $listener.Close()
        }
        Write-Log "Windows Agent stopped"
    }
}

# Signal handlers for graceful shutdown
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Log "Shutting down Windows Agent..."
}

# Start the service
Write-Log "Windows Agent for Cross-Platform Executable Runner starting..."
Write-Log "Configuration: Port=$Port, LogPath=$LogPath, ExecutablesPath=$ExecutablesPath"

Start-HttpListener
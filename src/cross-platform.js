// Cross-platform executable runner client
class CrossPlatformRunner {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadSystemInfo();
        this.loadExecutables();
    }

    initializeElements() {
        this.messageInput = document.getElementById('message');
        this.titleInput = document.getElementById('title');
        this.endpointInput = document.getElementById('endpoint');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.privateKeyInput = document.getElementById('privateKey');
        this.apiKeyInput = document.getElementById('apiKey');
        this.executeBtn = document.getElementById('executeBtn');
        this.testBtn = document.getElementById('testConnection');
        this.refreshBtn = document.getElementById('refreshInfo');
        this.outputElement = document.getElementById('output');
        this.systemInfoElement = document.getElementById('systemInfo');
        this.executablesElement = document.getElementById('executables');
        this.credentialsSection = document.getElementById('credentialsSection');
        this.modeRadios = document.querySelectorAll('input[name="mode"]');
    }

    bindEvents() {
        this.executeBtn.addEventListener('click', () => this.executeOnTarget());
        this.testBtn.addEventListener('click', () => this.testConnection());
        this.refreshBtn.addEventListener('click', () => this.loadSystemInfo());
        
        this.modeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateUIForMode());
        });
        
        // Enable enter key for inputs
        [this.messageInput, this.titleInput, this.endpointInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.executeOnTarget();
                }
            });
        });
    }

    updateUIForMode() {
        const selectedMode = this.getSelectedMode();
        const needsCredentials = ['remote_ssh', 'remote_wmi', 'remote_api'].includes(selectedMode);
        const needsEndpoint = selectedMode !== 'local';
        
        this.credentialsSection.style.display = needsCredentials ? 'block' : 'none';
        this.endpointInput.required = needsEndpoint;
        
        // Update placeholder text based on mode
        switch (selectedMode) {
            case 'remote_ssh':
                this.endpointInput.placeholder = 'SSH host (192.168.1.100)';
                break;
            case 'remote_wmi':
                this.endpointInput.placeholder = 'Windows computer name or IP';
                break;
            case 'remote_api':
                this.endpointInput.placeholder = 'API endpoint (example.com:8080)';
                break;
            default:
                this.endpointInput.placeholder = 'Not required for local execution';
        }
    }

    getSelectedMode() {
        const selectedRadio = document.querySelector('input[name="mode"]:checked');
        return selectedRadio ? selectedRadio.value : 'local';
    }

    async executeOnTarget() {
        const message = this.messageInput.value.trim() || 'Default message';
        const title = this.titleInput.value.trim() || undefined;
        const endpoint = this.endpointInput.value.trim() || undefined;
        const mode = this.getSelectedMode();
        
        const credentials = {
            username: this.usernameInput.value.trim() || undefined,
            password: this.passwordInput.value.trim() || undefined,
            privateKey: this.privateKeyInput.value.trim() || undefined,
            apiKey: this.apiKeyInput.value.trim() || undefined
        };

        this.executeBtn.disabled = true;
        this.appendOutput(`🚀 Executing on target (${mode})...`, 'info');
        
        if (mode !== 'local' && !endpoint) {
            this.appendOutput('❌ Endpoint required for remote execution', 'error');
            this.executeBtn.disabled = false;
            return;
        }

        try {
            const response = await fetch('/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    title,
                    endpoint,
                    mode,
                    credentials
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.appendOutput(`✅ Execution successful (${result.executionMode})`, 'success');
                this.appendOutput(`📝 Output:\n${result.message}`, 'info');
                if (result.endpoint) {
                    this.appendOutput(`🎯 Target: ${result.endpoint}`, 'info');
                }
            } else {
                this.appendOutput(`❌ Execution failed: ${result.error}`, 'error');
            }
            
            this.appendOutput(`⏱️ Completed at: ${result.timestamp}`, 'info');
            
        } catch (error) {
            this.appendOutput(`❌ Request failed: ${error.message}`, 'error');
        } finally {
            this.executeBtn.disabled = false;
        }
    }

    async testConnection() {
        const mode = this.getSelectedMode();
        const endpoint = this.endpointInput.value.trim();
        
        if (mode === 'local') {
            this.appendOutput('ℹ️ Local mode - no connection test needed', 'info');
            return;
        }
        
        if (!endpoint) {
            this.appendOutput('❌ Endpoint required for connection test', 'error');
            return;
        }

        this.testBtn.disabled = true;
        this.appendOutput(`🔍 Testing connection to ${endpoint} (${mode})...`, 'info');
        
        // Simple connectivity test
        try {
            const response = await fetch('/system-info');
            const systemInfo = await response.json();
            this.appendOutput(`✅ Server connectivity confirmed`, 'success');
            this.appendOutput(`📊 Server: ${systemInfo.platform} ${systemInfo.arch}`, 'info');
        } catch (error) {
            this.appendOutput(`❌ Connection test failed: ${error.message}`, 'error');
        } finally {
            this.testBtn.disabled = false;
        }
    }

    async loadSystemInfo() {
        try {
            const response = await fetch('/system-info');
            const info = await response.json();
            
            const systemHtml = `
                <strong>Host System Information:</strong><br>
                🖥️ Platform: ${info.platform} ${info.arch}<br>
                🏠 Hostname: ${info.hostname}<br>
                🔄 Uptime: ${Math.floor(info.uptime / 3600)}h ${Math.floor((info.uptime % 3600) / 60)}m<br>
                💾 Memory: ${Math.round(info.freeMemory / 1024 / 1024)}MB free / ${Math.round(info.totalMemory / 1024 / 1024)}MB total<br>
                🔧 Supported modes: ${info.supportedModes.join(', ')}<br>
                ⏰ Server time: ${new Date(info.serverTime).toLocaleString()}
            `;
            
            this.systemInfoElement.innerHTML = systemHtml;
        } catch (error) {
            this.systemInfoElement.innerHTML = `❌ Failed to load system info: ${error.message}`;
        }
    }

    async loadExecutables() {
        try {
            const response = await fetch('/executables');
            const data = await response.json();
            
            if (data.executables.length === 0) {
                this.executablesElement.textContent = 'No executables found in binaries directory';
                return;
            }
            
            const executablesList = data.executables.map(exe => 
                `📦 ${exe.name} (${exe.platform})`
            ).join('\n');
            
            this.executablesElement.textContent = executablesList;
        } catch (error) {
            this.executablesElement.textContent = `❌ Failed to load executables: ${error.message}`;
        }
    }

    appendOutput(text, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] `;
        
        let icon = '';
        switch (type) {
            case 'error': icon = '❌'; break;
            case 'success': icon = '✅'; break;
            case 'info': icon = 'ℹ️'; break;
            default: icon = '📝';
        }
        
        this.outputElement.textContent += `${prefix}${icon} ${text}\n`;
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    clearOutput() {
        this.outputElement.textContent = '';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const runner = new CrossPlatformRunner();
    
    // Add clear output button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear Output';
    clearBtn.style.marginTop = '0.5rem';
    clearBtn.style.padding = '0.25rem 0.5rem';
    clearBtn.style.fontSize = '12px';
    clearBtn.style.background = '#6c757d';
    clearBtn.style.color = 'white';
    clearBtn.style.border = 'none';
    clearBtn.style.borderRadius = '3px';
    clearBtn.style.cursor = 'pointer';
    clearBtn.addEventListener('click', () => runner.clearOutput());
    
    document.querySelector('.output').appendChild(clearBtn);
    
    runner.appendOutput('Cross-platform executable runner ready', 'success');
    runner.appendOutput('Select execution mode and configure target endpoint', 'info');
});
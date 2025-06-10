// Direct Windows Execution Client
class DirectWindowsExecutor {
    constructor() {
        this.endpoints = JSON.parse(localStorage.getItem('windowsEndpoints') || '[]');
        this.selectedEndpoint = null;
        this.initializeElements();
        this.bindEvents();
        this.loadEndpoints();
        this.loadConfiguration();
    }

    initializeElements() {
        // Input elements
        this.messageInput = document.getElementById('message');
        this.titleInput = document.getElementById('title');
        this.windowsHostInput = document.getElementById('windowsHost');
        this.agentPortInput = document.getElementById('agentPort');
        this.useHttpsInput = document.getElementById('useHttps');
        this.domainInput = document.getElementById('domain');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.apiKeyInput = document.getElementById('apiKey');

        // Button elements
        this.testLocalBtn = document.getElementById('testLocal');
        this.testConnectionBtn = document.getElementById('testConnection');
        this.saveEndpointBtn = document.getElementById('saveEndpoint');
        this.clearEndpointsBtn = document.getElementById('clearEndpoints');
        this.executeBtn = document.getElementById('executeBtn');
        this.executeSelectedBtn = document.getElementById('executeSelectedBtn');
        this.executeBatchBtn = document.getElementById('executeBatchBtn');
        this.clearOutputBtn = document.getElementById('clearOutput');
        this.exportResultsBtn = document.getElementById('exportResults');

        // Status elements
        this.localStatusIndicator = document.getElementById('localStatus');
        this.localStatusText = document.getElementById('localStatusText');
        this.connectionStatusIndicator = document.getElementById('connectionStatus');
        this.connectionStatusText = document.getElementById('connectionStatusText');
        this.endpointList = document.getElementById('endpointList');
        this.outputElement = document.getElementById('output');
    }

    bindEvents() {
        this.testLocalBtn.addEventListener('click', () => this.testLocalConnection());
        this.testConnectionBtn.addEventListener('click', () => this.testWindowsConnection());
        this.saveEndpointBtn.addEventListener('click', () => this.saveEndpoint());
        this.clearEndpointsBtn.addEventListener('click', () => this.clearAllEndpoints());
        this.executeBtn.addEventListener('click', () => this.executeOnCurrent());
        this.executeSelectedBtn.addEventListener('click', () => this.executeOnSelected());
        this.executeBatchBtn.addEventListener('click', () => this.executeOnAll());
        this.clearOutputBtn.addEventListener('click', () => this.clearOutput());
        this.exportResultsBtn.addEventListener('click', () => this.exportResults());

        // Enter key handlers
        [this.messageInput, this.titleInput, this.windowsHostInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.executeOnCurrent();
                }
            });
        });
    }

    async loadConfiguration() {
        try {
            const response = await fetch('/config');
            const config = await response.json();
            this.appendOutput(`Server loaded: ${config.serverInfo.platform} at ${config.serverInfo.hostname}`, 'info');
        } catch (error) {
            this.appendOutput(`Failed to load configuration: ${error.message}`, 'error');
        }
    }

    async testLocalConnection() {
        this.updateStatus(this.localStatusIndicator, this.localStatusText, 'testing', 'Testing...');
        
        try {
            const response = await fetch('/test-local', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: 'Local connection test',
                    title: 'Test'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.updateStatus(this.localStatusIndicator, this.localStatusText, 'online', 'Connected');
                this.appendOutput('Local server connection successful', 'success');
            } else {
                this.updateStatus(this.localStatusIndicator, this.localStatusText, 'offline', 'Failed');
                this.appendOutput(`Local test failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.updateStatus(this.localStatusIndicator, this.localStatusText, 'offline', 'Error');
            this.appendOutput(`Local connection failed: ${error.message}`, 'error');
        }
    }

    async testWindowsConnection() {
        const host = this.windowsHostInput.value.trim();
        const port = this.agentPortInput.value || '8080';
        const useHttps = this.useHttpsInput.checked;
        
        if (!host) {
            this.appendOutput('Windows host is required for connection test', 'error');
            return;
        }

        const url = `${useHttps ? 'https' : 'http'}://${host}:${port}/status`;
        this.updateStatus(this.connectionStatusIndicator, this.connectionStatusText, 'testing', 'Testing...');
        
        try {
            this.appendOutput(`Testing connection to ${url}...`, 'info');
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            this.updateStatus(this.connectionStatusIndicator, this.connectionStatusText, 'online', 'Connected');
            this.appendOutput(`Connection successful to ${result.hostname} (${result.platform})`, 'success');
            this.appendOutput(`Windows version: ${result.osVersion}`, 'info');
            
        } catch (error) {
            this.updateStatus(this.connectionStatusIndicator, this.connectionStatusText, 'offline', 'Failed');
            this.appendOutput(`Connection failed to ${host}:${port} - ${error.message}`, 'error');
            this.appendOutput('Make sure the Windows agent is running and accessible', 'info');
        }
    }

    saveEndpoint() {
        const host = this.windowsHostInput.value.trim();
        const port = this.agentPortInput.value || '8080';
        const useHttps = this.useHttpsInput.checked;
        
        if (!host) {
            this.appendOutput('Host is required to save endpoint', 'error');
            return;
        }

        const endpoint = {
            id: Date.now(),
            host: host,
            port: port,
            useHttps: useHttps,
            url: `${useHttps ? 'https' : 'http'}://${host}:${port}`,
            name: `${host}:${port}`,
            saved: new Date().toISOString(),
            status: 'unknown'
        };

        // Check if endpoint already exists
        const existingIndex = this.endpoints.findIndex(ep => ep.host === host && ep.port === port);
        if (existingIndex >= 0) {
            this.endpoints[existingIndex] = endpoint;
        } else {
            this.endpoints.push(endpoint);
        }

        this.saveEndpointsToStorage();
        this.loadEndpoints();
        this.appendOutput(`Endpoint saved: ${endpoint.name}`, 'success');
    }

    clearAllEndpoints() {
        if (confirm('Are you sure you want to clear all saved endpoints?')) {
            this.endpoints = [];
            this.selectedEndpoint = null;
            this.saveEndpointsToStorage();
            this.loadEndpoints();
            this.appendOutput('All endpoints cleared', 'info');
        }
    }

    saveEndpointsToStorage() {
        localStorage.setItem('windowsEndpoints', JSON.stringify(this.endpoints));
    }

    loadEndpoints() {
        this.endpointList.innerHTML = '';
        
        if (this.endpoints.length === 0) {
            this.endpointList.innerHTML = '<div class="endpoint-item"><span>No saved endpoints</span></div>';
            return;
        }

        this.endpoints.forEach(endpoint => {
            const item = document.createElement('div');
            item.className = 'endpoint-item';
            item.innerHTML = `
                <span>${endpoint.name}</span>
                <div>
                    <span class="status-indicator status-${endpoint.status}"></span>
                    <button onclick="executor.removeEndpoint(${endpoint.id})" style="margin-left: 10px; padding: 2px 6px; font-size: 11px;">Remove</button>
                </div>
            `;
            
            item.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    this.selectEndpoint(endpoint);
                }
            });
            
            this.endpointList.appendChild(item);
        });
    }

    selectEndpoint(endpoint) {
        // Remove previous selection
        document.querySelectorAll('.endpoint-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Select new endpoint
        event.currentTarget.classList.add('selected');
        this.selectedEndpoint = endpoint;
        
        // Update form fields
        this.windowsHostInput.value = endpoint.host;
        this.agentPortInput.value = endpoint.port;
        this.useHttpsInput.checked = endpoint.useHttps;
        
        this.appendOutput(`Selected endpoint: ${endpoint.name}`, 'info');
    }

    removeEndpoint(id) {
        this.endpoints = this.endpoints.filter(ep => ep.id !== id);
        if (this.selectedEndpoint && this.selectedEndpoint.id === id) {
            this.selectedEndpoint = null;
        }
        this.saveEndpointsToStorage();
        this.loadEndpoints();
        this.appendOutput('Endpoint removed', 'info');
    }

    async executeOnCurrent() {
        const host = this.windowsHostInput.value.trim();
        const port = this.agentPortInput.value || '8080';
        const useHttps = this.useHttpsInput.checked;
        
        if (!host) {
            this.appendOutput('Windows host is required for execution', 'error');
            return;
        }

        const url = `${useHttps ? 'https' : 'http'}://${host}:${port}`;
        await this.executeOnEndpoint({ host, port, useHttps, url, name: `${host}:${port}` });
    }

    async executeOnSelected() {
        if (!this.selectedEndpoint) {
            this.appendOutput('No endpoint selected', 'error');
            return;
        }
        
        await this.executeOnEndpoint(this.selectedEndpoint);
    }

    async executeOnAll() {
        if (this.endpoints.length === 0) {
            this.appendOutput('No saved endpoints to execute on', 'error');
            return;
        }

        this.appendOutput(`Starting batch execution on ${this.endpoints.length} endpoints...`, 'info');
        
        for (const endpoint of this.endpoints) {
            await this.executeOnEndpoint(endpoint, true);
            // Small delay between executions
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.appendOutput('Batch execution completed', 'success');
    }

    async executeOnEndpoint(endpoint, isBatch = false) {
        const message = this.messageInput.value.trim() || 'Default message';
        const title = this.titleInput.value.trim() || undefined;
        
        const executeUrl = `${endpoint.url}/execute`;
        const prefix = isBatch ? `[${endpoint.name}]` : '';
        
        this.executeBtn.disabled = true;
        this.appendOutput(`${prefix} Executing on ${endpoint.name}...`, 'info');
        
        try {
            const response = await fetch(executeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                mode: 'cors',
                body: JSON.stringify({ message, title })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.appendOutput(`${prefix} Execution successful on ${result.hostname}`, 'success');
                this.appendOutput(`${prefix} Output: ${result.message}`, 'info');
                
                // Update endpoint status
                const endpointIndex = this.endpoints.findIndex(ep => ep.id === endpoint.id);
                if (endpointIndex >= 0) {
                    this.endpoints[endpointIndex].status = 'online';
                    this.saveEndpointsToStorage();
                    this.loadEndpoints();
                }
            } else {
                this.appendOutput(`${prefix} Execution failed: ${result.error}`, 'error');
            }
            
        } catch (error) {
            this.appendOutput(`${prefix} Request failed: ${error.message}`, 'error');
            
            // Update endpoint status
            const endpointIndex = this.endpoints.findIndex(ep => ep.id === endpoint.id);
            if (endpointIndex >= 0) {
                this.endpoints[endpointIndex].status = 'offline';
                this.saveEndpointsToStorage();
                this.loadEndpoints();
            }
        } finally {
            this.executeBtn.disabled = false;
        }
    }

    getAuthHeaders() {
        const headers = {};
        
        if (this.apiKeyInput.value.trim()) {
            headers['Authorization'] = `Bearer ${this.apiKeyInput.value.trim()}`;
        }
        
        return headers;
    }

    updateStatus(indicator, textElement, status, text) {
        indicator.className = `status-indicator status-${status}`;
        textElement.textContent = text;
    }

    appendOutput(text, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}]`;
        
        let icon = '';
        switch (type) {
            case 'error': icon = '❌'; break;
            case 'success': icon = '✅'; break;
            case 'info': icon = 'ℹ️'; break;
            default: icon = '📝';
        }
        
        this.outputElement.textContent += `${prefix} ${icon} ${text}\n`;
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    clearOutput() {
        this.outputElement.textContent = '';
    }

    exportResults() {
        const results = this.outputElement.textContent;
        if (!results) {
            this.appendOutput('No results to export', 'error');
            return;
        }

        const blob = new Blob([results], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `execution-results-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.appendOutput('Results exported to file', 'success');
    }
}

// Initialize when DOM is loaded
let executor;
document.addEventListener('DOMContentLoaded', () => {
    executor = new DirectWindowsExecutor();
    executor.appendOutput('Direct Windows Executor ready', 'success');
    executor.appendOutput('Configure Windows endpoints and test connections', 'info');
});
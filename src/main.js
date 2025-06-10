import { invoke, listen } from './api.js';

// DOM elements
const messageInput = document.getElementById('message');
const titleInput = document.getElementById('title');
const showDialogBtn = document.getElementById('showDialog');
const showDialogAsyncBtn = document.getElementById('showDialogAsync');
const outputElement = document.getElementById('output');

// Utility function to append output
function appendOutput(text, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] `;
    
    if (type === 'error') {
        outputElement.textContent += `${prefix}ERROR: ${text}\n`;
    } else if (type === 'success') {
        outputElement.textContent += `${prefix}SUCCESS: ${text}\n`;
    } else {
        outputElement.textContent += `${prefix}${text}\n`;
    }
    
    // Auto-scroll to bottom
    outputElement.scrollTop = outputElement.scrollHeight;
}

// Clear output
function clearOutput() {
    outputElement.textContent = '';
}

// Show blocking dialog
async function showBlockingDialog() {
    const message = messageInput.value.trim() || 'Hello from Tauri!';
    const title = titleInput.value.trim() || undefined;
    
    showDialogBtn.disabled = true;
    appendOutput(`Executing dialog with message: "${message}"${title ? ` and title: "${title}"` : ''}`);
    
    try {
        const result = await invoke('show_dialog', { 
            message: message,
            title: title 
        });
        
        appendOutput(`Dialog result: ${result.message}`, 'success');
        
    } catch (error) {
        appendOutput(`Failed to show dialog: ${error}`, 'error');
    } finally {
        showDialogBtn.disabled = false;
    }
}

// Show non-blocking dialog
async function showAsyncDialog() {
    const message = messageInput.value.trim() || 'Hello from Tauri!';
    const title = titleInput.value.trim() || undefined;
    
    showDialogAsyncBtn.disabled = true;
    appendOutput(`Starting async dialog with message: "${message}"${title ? ` and title: "${title}"` : ''}`);
    
    try {
        await invoke('show_dialog_async', { 
            message: message,
            title: title 
        });
        
        appendOutput('Async dialog started successfully', 'success');
        
    } catch (error) {
        appendOutput(`Failed to start async dialog: ${error}`, 'error');
    } finally {
        showDialogAsyncBtn.disabled = false;
    }
}

// Event listeners for buttons
showDialogBtn.addEventListener('click', showBlockingDialog);
showDialogAsyncBtn.addEventListener('click', showAsyncDialog);

// Listen for async dialog events
listen('dialog-output', (event) => {
    appendOutput(`Dialog stdout: ${event.payload}`, 'info');
});

listen('dialog-error', (event) => {
    appendOutput(`Dialog stderr: ${event.payload}`, 'error');
});

listen('dialog-closed', (event) => {
    appendOutput(`Dialog process terminated with code: ${event.payload.code}`, 
                event.payload.code === 0 ? 'success' : 'error');
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    appendOutput('Tauri Executor ready. Click buttons to test executable execution.');
    
    // Enable enter key for inputs
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            showBlockingDialog();
        }
    });
    
    titleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            showBlockingDialog();
        }
    });
});

// Add clear output functionality
const clearBtn = document.createElement('button');
clearBtn.textContent = 'Clear Output';
clearBtn.style.marginTop = '0.5rem';
clearBtn.style.padding = '0.25rem 0.5rem';
clearBtn.style.fontSize = '12px';
clearBtn.style.background = '#6c757d';
clearBtn.addEventListener('click', clearOutput);

document.querySelector('.output').appendChild(clearBtn);

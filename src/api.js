// Local API module to avoid import issues
const { invoke } = window.__TAURI__.tauri;
const { listen } = window.__TAURI__.event;

export { invoke, listen };
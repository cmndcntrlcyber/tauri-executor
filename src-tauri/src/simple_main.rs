// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};

#[derive(Debug, Serialize, Deserialize)]
struct DialogResult {
    success: bool,
    message: String,
}

#[tauri::command]
fn show_dialog(message: String, title: Option<String>) -> Result<DialogResult, String> {
    let args = if let Some(t) = title {
        vec![message, t]
    } else {
        vec![message]
    };
    
    println!("Executing dialog tool with args: {:?}", args);
    
    // Execute the bundled dialog tool
    let output = Command::new("./src-tauri/binaries/dialog-tool-x86_64-pc-windows-msvc.exe")
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to execute: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        println!("Dialog tool output: {}", stdout);
        Ok(DialogResult {
            success: true,
            message: stdout.trim().to_string(),
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        eprintln!("Dialog tool error: {}", stderr);
        Err(format!("Dialog failed: {}", stderr))
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![show_dialog])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
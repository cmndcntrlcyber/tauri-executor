use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};

#[derive(Debug, Serialize, Deserialize)]
struct DialogResult {
    success: bool,
    message: String,
}

#[tauri::command]
async fn show_dialog(
    app: tauri::AppHandle,
    message: String,
    title: Option<String>,
) -> Result<DialogResult, String> {
    // Build arguments
    let mut args = vec![message.clone()];
    if let Some(t) = title.clone() {
        args.push(t);
    }
    
    println!("Executing dialog tool with args: {:?}", args);
    
    // Get path to the bundled executable
    let resource_path = app
        .path_resolver()
        .resolve_resource("binaries/dialog-tool-x86_64-pc-windows-msvc.exe")
        .ok_or("Failed to resolve bundled executable path")?;
    
    // Execute the bundled dialog tool
    let output = Command::new(&resource_path)
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

#[tauri::command]
async fn show_dialog_async(
    app: tauri::AppHandle,
    window: tauri::Window,
    message: String,
    title: Option<String>,
) -> Result<(), String> {
    // Build arguments
    let mut args = vec![message.clone()];
    if let Some(t) = title.clone() {
        args.push(t);
    }
    
    println!("Spawning async dialog tool with args: {:?}", args);
    
    // Get path to the bundled executable
    let resource_path = app
        .path_resolver()
        .resolve_resource("binaries/dialog-tool-x86_64-pc-windows-msvc.exe")
        .ok_or("Failed to resolve bundled executable path")?;
    
    // Clone window for async task
    let window_clone = window.clone();
    
    // Spawn the dialog tool for non-blocking execution
    tauri::async_runtime::spawn(async move {
        let output = Command::new(&resource_path)
            .args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output();
            
        match output {
            Ok(result) => {
                let stdout = String::from_utf8_lossy(&result.stdout).to_string();
                let stderr = String::from_utf8_lossy(&result.stderr).to_string();
                
                if !stdout.is_empty() {
                    let _ = window_clone.emit("dialog-output", &stdout);
                }
                if !stderr.is_empty() {
                    let _ = window_clone.emit("dialog-error", &stderr);
                }
                
                let _ = window_clone.emit("dialog-closed", &serde_json::json!({
                    "code": result.status.code().unwrap_or(-1)
                }));
            }
            Err(e) => {
                let _ = window_clone.emit("dialog-error", &format!("Failed to execute: {}", e));
            }
        }
    });

    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            show_dialog,
            show_dialog_async
        ])
        .setup(|app| {
            println!("Tauri Executor initialized successfully");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

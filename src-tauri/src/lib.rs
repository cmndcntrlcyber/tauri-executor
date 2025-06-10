use tauri::Manager;
use tauri_plugin_shell::{ShellExt, process::CommandEvent};
use serde::{Deserialize, Serialize};

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
    let shell = app.shell();
    
    // Build arguments
    let mut args = vec![message.clone()];
    if let Some(t) = title.clone() {
        args.push(t);
    }
    
    println!("Executing dialog tool with args: {:?}", args);
    
    // Execute the bundled dialog tool
    let output = shell
        .sidecar("dialog-tool")
        .map_err(|e| format!("Failed to create sidecar: {}", e))?
        .args(&args)
        .output()
        .await
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
    let shell = app.shell();
    
    // Build arguments
    let mut args = vec![message.clone()];
    if let Some(t) = title.clone() {
        args.push(t);
    }
    
    println!("Spawning async dialog tool with args: {:?}", args);
    
    // Spawn the dialog tool for non-blocking execution
    let (mut rx, _child) = shell
        .sidecar("dialog-tool")
        .map_err(|e| format!("Failed to create sidecar: {}", e))?
        .args(&args)
        .spawn()
        .map_err(|e| format!("Failed to spawn: {}", e))?;

    // Handle events in background
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    println!("Dialog stdout: {}", line);
                    let _ = window.emit("dialog-output", &line);
                }
                CommandEvent::Stderr(line) => {
                    eprintln!("Dialog stderr: {}", line);
                    let _ = window.emit("dialog-error", &line);
                }
                CommandEvent::Terminated(payload) => {
                    println!("Dialog terminated with code: {:?}", payload.code);
                    let _ = window.emit("dialog-closed", &payload);
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
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

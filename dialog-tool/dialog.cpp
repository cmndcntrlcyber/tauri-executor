// dialog.cpp - Simple Windows dialog executable
#include <windows.h>
#include <string>
#include <iostream>

int main(int argc, char* argv[]) {
    std::string message = "Hello from bundled executable!";
    std::string title = "Tauri Bundled App";
    
    // Parse command line arguments
    if (argc > 1) {
        message = argv[1];
    }
    if (argc > 2) {
        title = argv[2];
    }
    
    // Output to console for Tauri to capture
    std::cout << "Dialog shown with message: " << message << std::endl;
    std::cout << "Dialog title: " << title << std::endl;
    
    // Display Windows message box
    int result = MessageBoxA(
        NULL,
        message.c_str(),
        title.c_str(),
        MB_OK | MB_ICONINFORMATION
    );
    
    // Output result
    std::cout << "MessageBox result: " << result << std::endl;
    
    return 0;
}

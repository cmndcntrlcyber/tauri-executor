// dialog.cpp - Cross-platform dialog executable
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
    std::cout << "Dialog executed successfully!" << std::endl;
    std::cout << "Message: " << message << std::endl;
    std::cout << "Title: " << title << std::endl;
    std::cout << "Timestamp: " << __DATE__ << " " << __TIME__ << std::endl;
    
    // Simulate some work
    for (int i = 1; i <= 3; i++) {
        std::cout << "Processing step " << i << "/3..." << std::endl;
    }
    
    std::cout << "Dialog tool completed successfully!" << std::endl;
    
    return 0;
}

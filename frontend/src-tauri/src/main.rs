// Temporarily show console for debugging — will hide again once app works
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Write;

fn main() {
    // Set up panic hook to write crash info to a file on Desktop
    std::panic::set_hook(Box::new(|info| {
        let home = std::env::var("USERPROFILE")
            .or_else(|_| std::env::var("HOME"))
            .unwrap_or_else(|_| ".".to_string());
        let path = format!("{}/Desktop/remio-crash.log", home);
        if let Ok(mut f) = std::fs::File::create(&path) {
            let _ = writeln!(f, "Remio crashed at: {:?}", std::time::SystemTime::now());
            let _ = writeln!(f, "Panic info: {}", info);
            if let Some(loc) = info.location() {
                let _ = writeln!(f, "Location: {}:{}:{}", loc.file(), loc.line(), loc.column());
            }
        }
        eprintln!("REMIO CRASH: {}", info);
    }));

    println!("Starting Remio...");
    app_lib::run();
    println!("Remio exited normally");
}

use clap::{Arg, Command};
use std::fs;
use std::path::Path;
use std::process;
use sigremove_rs::process_pdf_bytes;

fn main() {
    let matches = Command::new("sigremove_rs")
        .version("0.1.1")
        .about("Removes password protection, signatures, and widget annotations from PDFs")
        .arg(
            Arg::new("input")
                .help("Input PDF file")
                .required(true)
                .index(1),
        )
        .arg(
            Arg::new("output")
                .help("Output PDF file (optional)")
                .required(false)
                .index(2),
        )
        .get_matches();

    let input_path = matches.get_one::<String>("input").unwrap();
    let default_output = format!("cleaned_{}", Path::new(input_path).file_name().unwrap_or_default().to_string_lossy());
    let output_path = matches.get_one::<String>("output").map(|s| s.as_str()).unwrap_or(&default_output);

    println!("Input:  {}", input_path);
    println!("Output: {}", output_path);
    println!();

    // 1. Read Input Bytes
    let input_bytes = match fs::read(input_path) {
        Ok(b) => b,
        Err(e) => {
            eprintln!("Error reading file: {}", e);
            process::exit(1);
        }
    };

    // 2. Try processing (first attempt without password if we assume unencrypted or empty pass, 
    //    BUT our lib requires password UP FRONT if encrypted to load properly.
    //    So we iterate: Try empty pass -> if error is "InvalidPassword" -> Prompt -> Retry)
    
    // Attempt 1: Try with no password (or empty string/default)
    let result = process_pdf_bytes(&input_bytes, None);

    let final_bytes = match result {
        Ok(b) => b,
        Err(_) => {
            // Assume error might be password related.
            // Note: lopdf::Error doesn't always have a clean "PasswordRequired" variant exposed easily, 
            // but process_pdf_bytes returns generic Error. 
            // We'll optimistically assume if it failed, we prompt for password.
            
            println!("  → Encryption check failed or password required.");
            println!("  → Enter password (input hidden):");
            let password = rpassword::prompt_password("PDF Password: ").unwrap_or_default();
            
            println!("  → Retrying with provided password...");
            match process_pdf_bytes(&input_bytes, Some(&password)) {
                 Ok(b) => {
                     println!("  → Success.");
                    b
                 },
                 Err(e) => {
                     eprintln!("Error: Failed to process PDF. Incorrect password or other issue: {:?}", e);
                     process::exit(1);
                 }
            }
        }
    };

    // 3. Save Output
    if let Err(e) = fs::write(output_path, final_bytes) {
        eprintln!("Error writing output: {}", e);
        process::exit(1);
    }

    println!();
    println!("Done! Final file: {}", output_path);
}

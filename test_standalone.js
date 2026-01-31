const fs = require('fs');
const path = require('path');
const { clean_pdf_wasm } = require('./sigremove_rs/pkg-node/sigremove_rs.js');

const inputFile = process.argv[2];
const password = process.argv[3] || null;

if (!inputFile) {
    console.error("Usage: bun test_standalone.js <input_pdf> [password]");
    process.exit(1);
}

try {
    console.log(`Reading ${inputFile}...`);
    const fileBuffer = fs.readFileSync(inputFile);
    const uint8Array = new Uint8Array(fileBuffer);

    console.log(`Processing with WASM (Password: ${password})...`);
    const processedBytes = clean_pdf_wasm(uint8Array, password);

    const outputFile = `cleaned_standalone_${path.basename(inputFile)}`;
    fs.writeFileSync(outputFile, processedBytes);
    console.log(`Success! Saved to ${outputFile}`);
} catch (e) {
    console.error("Error:", e);
    process.exit(1);
}

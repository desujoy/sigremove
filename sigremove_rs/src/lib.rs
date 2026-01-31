use lopdf::{Document, Reader, Error};
use std::collections::BTreeMap;
use std::str;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn clean_pdf_wasm(file_data: &[u8], password: Option<String>) -> Result<Vec<u8>, JsValue> {
    console_error_panic_hook::set_once();
    let pass_ref = password.as_deref();
    
    match process_pdf_bytes(file_data, pass_ref) {
        Ok(bytes) => Ok(bytes),
        Err(e) => Err(JsValue::from_str(&format!("PDF Error: {:?}", e))),
    }
}

pub fn process_pdf_bytes(input: &[u8], password: Option<&str>) -> Result<Vec<u8>, Error> {
    // 1. Load PDF with password if provided
    // We use Reader directly to ensure we can pass the password for initial parsing/decryption
    let reader = Reader {
        buffer: input,
        document: Document::new(),
        encryption_state: None,
        raw_objects: BTreeMap::new(),
        password: password.map(|s| s.to_string()),
    };

    let mut doc = reader.read(None)?;

    // 2. Double-check generic decryption if needed (redundant if Reader handled it, but safe)
    if doc.is_encrypted() {
        if let Some(pass) = password {
             if doc.decrypt(pass).is_err() {
                 return Err(Error::InvalidPassword);
             }
        } else {
            // Try empty password
             if doc.decrypt("").is_err() {
                 return Err(Error::InvalidPassword);
             }
        }
    }

    // 3. Remove /Annots from all pages AND collect referenced objects to delete
    let page_ids = doc.page_iter().collect::<Vec<_>>();
    let mut annot_ids = Vec::new();

    for page_id in page_ids {
        if let Ok(content) = doc.get_object_mut(page_id).and_then(|obj| obj.as_dict_mut()) {
            if let Ok(annots) = content.get(b"Annots") {
                if let Ok(arr) = annots.as_array() {
                    for annot_ref in arr {
                        if let Ok(id) = annot_ref.as_reference() {
                            annot_ids.push(id);
                        }
                    }
                } else if let Ok(id) = annots.as_reference() {
                    annot_ids.push(id);
                }
            }
            content.remove(b"Annots");
        }
    }

    // Remove the actual annotation objects
    for id in annot_ids {
        doc.objects.remove(&id);
    }

    // 4. Remove /AcroForm from Catalog
    if let Ok(catalog_id) = doc.trailer.get(b"Root").and_then(|obj| obj.as_reference()) {
         if let Ok(catalog) = doc.get_object_mut(catalog_id).and_then(|obj| obj.as_dict_mut()) {
             catalog.remove(b"AcroForm");
         }
    }

    // 5. Save to bytes
    doc.prune_objects(); // Now safe to prune to remove orphaned kids
    doc.compress();

    let mut output = Vec::new();
    doc.save_to(&mut output)?;
    
    Ok(output)
}


export const SeoSection = () => (
  <section aria-labelledby="pdf-signature-removal" className="seo-section">
    <h2 id="pdf-signature-removal" className="seo-title">
      Remove Digital Signatures from PDF Files
    </h2>

    <p className="seo-text">
      Digital signatures in PDFs are cryptographic objects, not images.
      Most editors can only clear the visual marker, not remove the
      signed structure itself.
    </p>

    <h3 className="seo-subtitle">Why Some PDF Signatures Cannot Be Removed</h3>
    <p className="seo-text">
      Certified PDFs use byte-range hashing. Any modification invalidates
      the document, which is why tools like Adobe Acrobat refuse removal.
    </p>

    <h3 className="seo-subtitle">How SigRemove Is Different</h3>
    <p className="seo-text">
      SigRemove runs entirely in your browser using WebAssembly and
      removes signature objects directly, without uploading your file.
      Unlike "printing to PDF", which often rasterizes text and destroys accessibility,
      SigRemove preserves the document's original vector structure and text layer
      while specifically stripping the cryptographic signature.
    </p>

    <h3 className="seo-subtitle">Frequently Asked Questions</h3>
    <div className="faq-item">
      <h4>Is this the same as "flattening" a PDF?</h4>
      <p>No. Flattening usually merges layers into an image. SigRemove removes the hidden digital signature metadata objects while keeping the rest of the PDF content editable and sharp.</p>
    </div>
    <div className="faq-item">
      <h4>Is my data safe?</h4>
      <p>Yes. Since the processing happens in your browser's memory via WASM, your PDF never leaves your computer. No servers are involved.</p>
    </div>

    <h3 className="seo-subtitle">Important Limitations</h3>
    <ul className="seo-list">
      <li>Removed signatures invalidate document integrity</li>
      <li>This does not preserve legal validity</li>
      <li>Use only on documents you own or are authorized to modify</li>
    </ul>
  </section>
);

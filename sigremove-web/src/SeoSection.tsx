
export const SeoSection = () => (
  <section aria-labelledby="pdf-signature-removal" className="max-w-[600px] mx-auto my-14 mb-10 text-left text-pdf-text-sub opacity-80 text-[0.95rem] px-5 lg:flex-1 lg:m-0 lg:p-0 lg:opacity-100">
    <h2 id="pdf-signature-removal" className="text-2xl text-pdf-text-main mb-4 border-b border-pdf-border pb-2.5 lg:mt-0">
      Remove Digital Signatures from PDF Files
    </h2>

    <p className="leading-relaxed mb-3">
      Digital signatures in PDFs are cryptographic objects, not images.
      Most editors can only clear the visual marker, not remove the
      signed structure itself.
    </p>

    <h3 className="text-lg text-pdf-text-main my-6 mb-2">Why Some PDF Signatures Cannot Be Removed</h3>
    <p className="leading-relaxed mb-3">
      Certified PDFs use byte-range hashing. Any modification invalidates
      the document, which is why tools like Adobe Acrobat refuse removal.
    </p>

    <h3 className="text-lg text-pdf-text-main my-6 mb-2">How SigRemove Is Different</h3>
    <p className="leading-relaxed mb-3">
      SigRemove runs entirely in your browser using WebAssembly and
      removes signature objects directly, without uploading your file.
      Unlike "printing to PDF", which often rasterizes text and destroys accessibility,
      SigRemove preserves the document's original vector structure and text layer
      while specifically stripping the cryptographic signature.
    </p>

    <h3 className="text-lg text-pdf-text-main my-6 mb-2">Frequently Asked Questions</h3>
    <div className="mt-4">
      <h4 className="text-base text-pdf-text-main mb-1">Is this the same as "flattening" a PDF?</h4>
      <p className="text-[0.9rem] leading-relaxed m-0">No. Flattening usually merges layers into an image. SigRemove removes the hidden digital signature metadata objects while keeping the rest of the PDF content editable and sharp.</p>
    </div>
    <div className="mt-4">
      <h4 className="text-base text-pdf-text-main mb-1">Is my data safe?</h4>
      <p className="text-[0.9rem] leading-relaxed m-0">Yes. Since the processing happens in your browser's memory via WASM, your PDF never leaves your computer. No servers are involved.</p>
    </div>

    <h3 className="text-lg text-pdf-text-main my-6 mb-2">Important Limitations</h3>
    <ul className="pl-5 m-0 list-square space-y-1.5">
      <li>Removed signatures invalidate document integrity</li>
      <li>This does not preserve legal validity</li>
      <li>Use only on documents you own or are authorized to modify</li>
    </ul>
  </section>
);

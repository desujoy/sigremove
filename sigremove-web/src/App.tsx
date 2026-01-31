import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import init, { clean_pdf_wasm } from 'sigremove_rs';

function App() {
  const [isWasmReady, setIsWasmReady] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'password_required' | 'success' | 'error'>('idle');
  const [password, setPassword] = useState<string>('');
  const [cleanedPdf, setCleanedPdf] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    init().then(() => setIsWasmReady(true)).catch(console.error);
  }, []);

  const processFile = async (fileToProcess: File, pwd: string | null = null) => {
    setStatus('processing');
    setErrorMsg('');
    
    try {
      const arrayBuffer = await fileToProcess.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const result = clean_pdf_wasm(uint8Array, pwd);
      
      // Create Blob
      const blob = new Blob([result as any], { type: 'application/pdf' });
      setCleanedPdf(window.URL.createObjectURL(blob));
      setStatus('success');
    } catch (e: any) {
      console.error(e);
      // Check if error implies password
      const errStr = String(e);
      if (errStr.includes('InvalidPassword') || errStr.includes('password bound')) {
        setStatus('password_required');
      } else {
        setStatus('error');
        setErrorMsg('Failed to process. ' + errStr);
      }
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      processFile(f, null); // Try without password first
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file && password) {
      processFile(file, password);
    }
  };

  const downloadFile = () => {
    if (cleanedPdf && file) {
      const link = document.createElement('a');
      link.href = cleanedPdf;
      
      let baseName = file.name;
      if (baseName.toLowerCase().endsWith('.pdf')) {
        baseName = baseName.slice(0, -4);
      }
      link.download = `cleaned_${baseName}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="app-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <header>
          <h1>SigRemove</h1>
          <p>Secure, Client-Side PDF Cleaner</p>
        </header>

        {!isWasmReady ? (
          <div className="loading">Initializing Core...</div>
        ) : (
          <main>
            {status === 'idle' || status === 'error' ? (
              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="icon">📄</div>
                {isDragActive ? (
                  <p>Drop to Clean...</p>
                ) : (
                  <p>Drag & drop PDF here, or click to select</p>
                )}
              </div>
            ) : null}

            <AnimatePresence>
              {status === 'processing' && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="status processing"
                >
                  <div className="spinner"></div>
                  <p>Cleaning artifacts...</p>
                </motion.div>
              )}

              {status === 'password_required' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="status password-form"
                >
                  <p>🔒 Encrypted PDF</p>
                  <form onSubmit={handlePasswordSubmit}>
                    <input 
                      type="password" 
                      placeholder="Enter Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                    <button type="submit">Unlock & Clean</button>
                  </form>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="status success"
                >
                  <div className="icon">✨</div>
                  <h2>Cleaned Successfully!</h2>
                  <p className="filename">{file?.name}</p>
                  <div className="actions">
                    <button onClick={downloadFile} className="primary-btn">Download PDF</button>
                    <button onClick={() => { setStatus('idle'); setFile(null); setPassword(''); }} className="secondary-btn">Clean Another</button>
                  </div>
                </motion.div>
              )}
               
               {status === 'error' && (
                <motion.div className="error-msg">
                  <p>❌ {errorMsg}</p>
                   <button onClick={() => setStatus('idle')} className="text-btn">Try again</button>
                </motion.div>
               )}
            </AnimatePresence>
          </main>
        )}
        
        <footer>
          <p>Powered by <b>Rust</b> & <b>WebAssembly</b></p>
          <div className="footer-links">
            <a 
              href="https://github.com/desujoy/sigremove" 
              target="_blank" 
              rel="noopener noreferrer"
              className="github-link"
            >
              ⭐ Star on GitHub
            </a>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}

export default App;

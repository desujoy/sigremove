import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import init, { clean_pdf_wasm } from 'sigremove_rs';
import { SeoSection } from './SeoSection';

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
    <>
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.15),transparent_70%)]" />
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-50 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      <div className="w-full max-w-[440px] my-[5vh] mx-auto px-5 relative z-10 lg:max-w-[1100px] lg:flex lg:flex-row lg:items-start lg:justify-center lg:gap-[60px] lg:p-[60px_40px] lg:min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-pdf-card backdrop-blur-xl rounded-[28px] py-10 px-8 text-center border border-pdf-border relative overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] lg:flex-[0_0_440px] lg:m-0 before:content-[''] before:absolute before:-top-1/2 before:-left-1/2 before:w-[200%] before:h-[200%] before:bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,transparent_60%)] before:pointer-events-none before:z-0"
        >
          <header className="relative z-10 mb-10">
            <h1 className="text-[2.5rem] font-black m-0 bg-linear-to-br from-blue-400 to-violet-400 bg-clip-text text-transparent tracking-tighter">SigRemove</h1>
            <p className="text-pdf-text-sub mt-2">Remove Digital Signatures from PDF Files Locally</p>
          </header>

          <p className="text-[0.95rem] leading-relaxed text-pdf-text-sub -mt-2.5 mb-[30px] px-2.5 opacity-90 relative z-10">
            Remove cryptographic digital signatures and password protection from PDF files securely in your browser. 
            100% private, 100% local processing.
          </p>

          {!isWasmReady ? (
            <div className="text-pdf-text-sub italic">Initializing Core...</div>
          ) : (
            <main className="relative z-10">
              {status === 'idle' || status === 'error' ? (
                <div 
                  {...getRootProps()} 
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[20px] py-[50px] px-5 cursor-pointer transition-all duration-300 relative z-10 bg-white/5 
                    ${isDragActive 
                      ? 'border-pdf-primary bg-blue-500/10 -translate-y-1 scale-[1.01] shadow-xl' 
                      : 'border-pdf-border hover:border-pdf-primary hover:bg-blue-500/10 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl'
                    }`}
                >
                  <input {...getInputProps()} />
                  <div className="text-5xl mb-4">📄</div>
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
                    className="mt-5 relative z-10"
                  >
                    <div className="w-[30px] h-[30px] border-[3px] border-white/10 border-t-pdf-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Cleaning artifacts...</p>
                  </motion.div>
                )}

                {status === 'password_required' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="mt-5 relative z-10"
                  >
                    <p>🔒 Encrypted PDF</p>
                    <form onSubmit={handlePasswordSubmit}>
                      <input 
                        type="password" 
                        placeholder="Enter Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                        className="w-full p-3 rounded-xl border border-pdf-border bg-black/20 text-white mb-3 text-base outline-none focus:border-pdf-primary"
                      />
                      <button type="submit" className="bg-linear-to-br from-pdf-primary to-blue-700 text-white border-none py-3.5 px-7 rounded-[14px] font-bold cursor-pointer w-full text-[1.05rem] transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-xl hover:bg-linear-to-br hover:from-pdf-primary-hover hover:to-pdf-primary">Unlock & Clean</button>
                    </form>
                  </motion.div>
                )}

                {status === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="mt-5 relative z-10"
                  >
                    <div className="text-[4rem] mb-2.5">✨</div>
                    <h2 className="text-2xl font-bold mb-4">Cleaned Successfully!</h2>
                    <p className="font-mono bg-black/30 py-1 px-2 rounded inline-block mb-6">{file?.name}</p>
                    <div className="flex flex-col gap-3.5">
                      <button onClick={downloadFile} className="bg-linear-to-br from-pdf-primary to-blue-700 text-white border-none py-3.5 px-7 rounded-[14px] font-bold cursor-pointer w-full text-[1.05rem] transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-xl hover:bg-linear-to-br hover:from-pdf-primary-hover hover:to-pdf-primary">Download PDF</button>
                      <button onClick={() => { setStatus('idle'); setFile(null); setPassword(''); }} className="bg-white/5 text-pdf-text-sub border border-pdf-border py-3 px-6 rounded-[14px] font-semibold cursor-pointer w-full transition-all duration-200 hover:bg-white/10 hover:text-pdf-text-main">Clean Another</button>
                    </div>
                  </motion.div>
                )}
                 
                 {status === 'error' && (
                  <motion.div className="text-pdf-error mt-4">
                    <p>❌ {errorMsg}</p>
                     <button onClick={() => setStatus('idle')} className="bg-transparent border-none text-pdf-text-sub underline cursor-pointer mt-2">Try again</button>
                  </motion.div>
                 )}
              </AnimatePresence>
            </main>
          )}
          
          <footer className="mt-10 text-[0.85rem] text-pdf-text-sub">
            <p className="opacity-60 mb-3">Powered by <b>Rust</b> & <b>WebAssembly</b></p>
            <div className="mt-2.5">
              <a 
                href="https://github.com/desujoy/sigremove" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pdf-text-main no-underline bg-white/5 py-2 px-[18px] rounded-full font-semibold transition-all duration-300 inline-flex items-center gap-2.5 border border-pdf-border hover:bg-white/10 hover:-translate-y-0.5 hover:border-pdf-primary hover:shadow-lg"
              >
                <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" style={{ verticalAlign: 'middle' }}>
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                <span className="text-[0.9rem]">Star on GitHub</span>
              </a>
            </div>
          </footer>
        </motion.div>

        <SeoSection />
      </div>
    </>
  );
}

export default App;

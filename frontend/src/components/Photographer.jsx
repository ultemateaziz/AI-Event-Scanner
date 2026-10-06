import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function Photographer() {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const handleBulkUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;

    setFiles(selectedFiles);
    setIsUploading(true);
    setProgress(0);

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };

    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        const compressedFile = await imageCompression(selectedFiles[i], options);
        
        const formData = new FormData();
        formData.append('file', compressedFile, selectedFiles[i].name);

        await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
          method: 'POST',
          body: formData
        });

        setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      } catch (e) {
        console.error("Compression error:", e);
      }
    }

    setIsUploading(false);
    setIsDone(true);
    setTimeout(() => {
      setIsDone(false);
      setFiles([]);
      setProgress(0);
    }, 5000);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '12px', fontWeight: '600' }}>Photographer Portal</h1>
        <p style={{ color: 'var(--text-muted)' }}>Bulk upload event photos. They will be automatically compressed and analyzed.</p>
      </div>

      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        
        {!isUploading && !isDone && (
          <div style={{ position: 'relative', transition: 'all 0.3s ease' }} className="upload-zone">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleBulkUpload} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} 
            />
            <div style={{ padding: '80px 20px', border: '2px dashed rgba(0, 229, 255, 0.4)', borderRadius: '16px', background: 'rgba(0, 229, 255, 0.02)' }}>
              <UploadCloud size={64} color="var(--accent)" style={{ marginBottom: '24px' }} />
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Drag & Drop Photos Here</h3>
              <p style={{ color: 'var(--text-muted)' }}>or click to browse from your computer</p>
            </div>
          </div>
        )}

        {isUploading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '40px 20px' }}>
            <h3 style={{ marginBottom: '24px' }}>Uploading & Compressing...</h3>
            <div style={{ height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
              <motion.div 
                style={{ height: '100%', background: 'var(--accent)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <p style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '24px' }}>{progress}%</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Processing {files.length} photos</p>
          </motion.div>
        )}

        <AnimatePresence>
          {isDone && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{ padding: '40px 20px' }}
            >
              <CheckCircle size={64} color="var(--accent)" style={{ margin: '0 auto 24px' }} />
              <h2 style={{ color: 'var(--accent)', marginBottom: '8px' }}>Upload Complete!</h2>
              <p style={{ color: 'var(--text-muted)' }}>All {files.length} photos have been compressed, uploaded, and analyzed.</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, ScanFace, Download, Video, Loader2 } from 'lucide-react';
import Webcam from 'react-webcam';
import imageCompression from 'browser-image-compression';

export default function Scanner() {
  const [image, setImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/generate_video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: results })
      });
      const data = await response.json();
      if (data.video_url) {
        setVideoUrl(`${import.meta.env.VITE_API_URL}${data.video_url}`);
      }
    } catch (err) {
      console.error(err);
    }
    setIsGeneratingVideo(false);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const imageUrl = URL.createObjectURL(compressedFile);
      setImage(imageUrl);
      
      setIsScanning(true);
      
      const formData = new FormData();
      formData.append('file', compressedFile, 'selfie.jpg');

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/scan`, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.matches && data.matches.length > 0) {
          const fullUrls = data.matches.map(path => `${import.meta.env.VITE_API_URL}${path}`);
          setResults(fullUrls);
        } else {
          setResults([]); // No matches found
        }
      } catch (err) {
        console.error('Scan error:', err);
        setResults([]);
      }
      setIsScanning(false);
      
    } catch (error) {
      console.error('Error compressing image:', error);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '12px', fontWeight: '600' }}>Find Your Photos</h1>
        <p style={{ color: 'var(--text-muted)' }}>Scan your face to instantly find all your photos from the event.</p>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        
        {!image ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '60px 0', textAlign: 'center', border: '2px dashed var(--border-light)', borderRadius: '16px', marginBottom: '24px' }}>
              <ScanFace size={64} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)' }}>Ready to scan your face</p>
            </div>

            {showWebcam ? (
              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  style={{ width: '100%', height: 'auto', borderRadius: '16px' }}
                />
                <div style={{ position: 'absolute', bottom: '16px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <button className="premium-button primary" onClick={async () => {
                    const imageSrc = webcamRef.current.getScreenshot();
                    if (imageSrc) {
                      const res = await fetch(imageSrc);
                      const blob = await res.blob();
                      const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });
                      setShowWebcam(false);
                      handleImageUpload({ target: { files: [file] } });
                    }
                  }}>
                    <Camera size={20} /> Capture Face
                  </button>
                  <button className="premium-button" onClick={() => setShowWebcam(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                <button className="premium-button primary" onClick={() => setShowWebcam(true)}>
                  <Camera size={20} /> Use Live Camera
                </button>
                <button className="premium-button" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={20} /> Upload Photo
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* The Image with Scanning Laser Effect */}
            <div className="scanner-container" style={{ position: 'relative', width: '100%', aspectRatio: '3/4', background: '#000' }}>
              <img src={image} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isScanning ? 0.7 : 1 }} />
              
              {isScanning && (
                <>
                  <motion.div 
                    className="scanner-line"
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div 
                    className="scanner-overlay"
                    initial={{ top: '0%', height: '0%' }}
                    animate={{ top: '100%', height: '20%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 20 }}>
                    <p style={{ color: 'var(--accent)', fontWeight: '600', letterSpacing: '4px', textShadow: '0 0 10px rgba(0,229,255,0.8)' }}>ANALYZING</p>
                  </div>
                </>
              )}
            </div>

            {/* Results Section */}
            {!isScanning && results && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '24px' }}
              >
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)' }}>●</span> Found {results.length} Matches
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {results.map((res, idx) => (
                    <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                      <img src={res} alt="Match" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                      
                      {/* Social Share Bar */}
                      <div style={{ position: 'absolute', bottom: '8px', left: '8px', display: 'flex', gap: '6px' }}>
                        <a href={`https://www.instagram.com/?url=${encodeURIComponent(res)}`} target="_blank" rel="noreferrer" style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px', borderRadius: '50%', display: 'flex', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(res)}`} target="_blank" rel="noreferrer" style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px', borderRadius: '50%', display: 'flex', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        </a>
                        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(res)}&text=Found%20my%20event%20photo!`} target="_blank" rel="noreferrer" style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px', borderRadius: '50%', display: 'flex', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                        </a>
                        <a href={`https://api.whatsapp.com/send?text=Found%20my%20event%20photo!%20${encodeURIComponent(res)}`} target="_blank" rel="noreferrer" style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px', borderRadius: '50%', display: 'flex', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        </a>
                      </div>

                      <a href={res} download={`event_photo_${idx}.jpg`} style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'var(--accent)', color: '#000', padding: '6px', borderRadius: '50%', display: 'flex', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,229,255,0.4)' }}>
                        <Download size={14} />
                      </a>
                    </div>
                  ))}
                </div>
                
                {videoUrl ? (
                  <div style={{ marginTop: '32px', width: '100%' }}>
                    <h4 style={{ marginBottom: '12px' }}>Your Video Reel</h4>
                    <video src={videoUrl} controls autoPlay loop style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border-light)' }} />
                    <a href={videoUrl} download="my_event_reel.mp4" className="premium-button primary" style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
                      <Download size={20} /> Download Reel
                    </a>
                  </div>
                ) : (
                  <button className="premium-button primary" style={{ marginTop: '32px', width: '100%', background: 'linear-gradient(45deg, #FF007F, #7928CA)' }} onClick={handleGenerateVideo} disabled={isGeneratingVideo}>
                    {isGeneratingVideo ? <Loader2 className="lucide-spin animate-spin" size={20} /> : <Video size={20} />} 
                    {isGeneratingVideo ? " Creating Reel..." : " Create AI Video Reel"}
                  </button>
                )}
                
                <button className="premium-button" style={{ marginTop: '12px' }} onClick={() => { setImage(null); setResults(null); setVideoUrl(null); }}>
                  Scan Another Face
                </button>
              </motion.div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

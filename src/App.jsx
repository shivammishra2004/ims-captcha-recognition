import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import './App.css';

function App() {
  const [captchaText, setCaptchaText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const recognizeCaptcha = async () => {
    if (!image) return;
  
    setLoading(true);
    setCaptchaText('');
    setError('');
  
    try {
      console.log('🔹 Creating Tesseract worker...');
      const worker = await createWorker({
        langPath: `${window.location.origin}/src/assets/tessdata/`, // Use local custom trained data
        workerPath: 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/2.1.5/worker.min.js',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@2.2.0/tesseract-core.wasm.js', 
        gzip: false,
        logger: m => console.log(m),
      });
  
      console.log('✅ Worker created successfully.');
      await worker.load();
      await worker.loadLanguage('captcha');
      await worker.initialize('captcha');
      
      console.log('✅ Model loaded successfully.');
      console.log('🔹 Recognizing text...');
      
      const { data: { text } } = await worker.recognize(image);
      
      console.log('✅ Recognition complete. Result:', text);
  
      if (!text) {
        throw new Error('Recognition failed: No text detected.');
      }
  
      setCaptchaText(text.trim());
  
      console.log('🔹 Terminating worker...');
      await worker.terminate();
    } catch (error) {
      console.error('❌ Error recognizing captcha:', error);
      setError(`Failed to recognize text: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setImage(null);
    setCaptchaText('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="app-container">
      <h1>IMS Captcha Solver</h1>
      <p>Upload a captcha image and the system will extract the text using your custom trained Tesseract model.</p>
      
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={fileInputRef}
          className="file-input"
        />
        <div className="button-group">
          <button 
            onClick={recognizeCaptcha} 
            disabled={!image || loading}
            className="primary-button"
          >
            {loading ? 'Processing...' : 'Recognize Captcha'}
          </button>
          <button 
            onClick={resetForm} 
            disabled={loading}
            className="secondary-button"
          >
            Reset
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="result-container">
        {image && (
          <div className="preview-section">
            <h2>Uploaded Image</h2>
            <img src={image} alt="Captcha" className="captcha-image" />
          </div>
        )}

        {captchaText && (
          <div className="result-section">
            <h2>Recognized Text:</h2>
            <div className="captcha-text">{captchaText}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
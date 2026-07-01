import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, ShieldCheck, Activity, Search, Eraser } from 'lucide-react';
import './CyberPanel.css';
import { ScanReport } from '../../utils/cyberSecurity';

interface CyberPanelProps {
  originalFile: File | null;
  onEncode: (message: string) => void;
  onDecode: () => void;
  onScan: () => void;
  onAnalyzeELA: () => void;
  onDeepScrub: () => void;
  decodedMessage: string | null;
  scanReport: ScanReport | null;
  isProcessing: boolean;
}

const CyberPanel: React.FC<CyberPanelProps> = ({
  originalFile,
  onEncode,
  onDecode,
  onScan,
  onAnalyzeELA,
  onDeepScrub,
  decodedMessage,
  scanReport,
  isProcessing
}) => {
  const [secretMessage, setSecretMessage] = useState('');

  if (!originalFile) {
    return (
      <div className="cyber-panel empty">
        <ShieldAlert size={48} className="empty-icon" />
        <p>Upload an image to access cybersecurity and forensic tools.</p>
      </div>
    );
  }

  return (
    <div className="cyber-panel">
      
      {/* 1. Payload Scanner */}
      <section className="cyber-section">
        <h3 className="section-title"><Search size={18} /> Malware & Payload Scanner</h3>
        <p className="section-desc">Analyze the raw file buffer for embedded scripts, polyglot headers, and malicious payloads.</p>
        <button 
          className="cyber-btn primary"
          onClick={onScan}
          disabled={isProcessing}
        >
          {isProcessing ? 'Scanning...' : 'Scan Image'}
        </button>

        {scanReport && (
          <div className={`scan-results ${scanReport.isSafe ? 'safe' : 'danger'}`}>
            <div className="scan-header">
              {scanReport.isSafe ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
              <h4>{scanReport.isSafe ? 'File is Safe' : 'Threats Detected!'}</h4>
            </div>
            {!scanReport.isSafe && (
              <ul className="threat-list">
                {scanReport.threats.map((threat, idx) => (
                  <li key={idx}>{threat}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* 2. Steganography */}
      <section className="cyber-section">
        <h3 className="section-title"><Lock size={18} /> Steganography (LSB)</h3>
        <p className="section-desc">Hide or extract secret messages within the image pixels without noticeably changing the visual appearance.</p>
        
        <div className="steg-controls">
          <textarea
            placeholder="Enter secret message to hide..."
            value={secretMessage}
            onChange={(e) => setSecretMessage(e.target.value)}
            className="steg-input"
          />
          <div className="btn-group">
            <button 
              className="cyber-btn primary"
              onClick={() => onEncode(secretMessage)}
              disabled={isProcessing || !secretMessage.trim()}
            >
              <Lock size={16} /> Hide Message
            </button>
            <button 
              className="cyber-btn secondary"
              onClick={onDecode}
              disabled={isProcessing}
            >
              <Unlock size={16} /> Extract Message
            </button>
          </div>
        </div>

        {decodedMessage && (
          <div className="decoded-output">
            <h4>Decoded Message:</h4>
            <div className="decoded-text">{decodedMessage}</div>
          </div>
        )}
      </section>

      {/* 3. Forensics */}
      <section className="cyber-section">
        <h3 className="section-title"><Activity size={18} /> Error Level Analysis (ELA)</h3>
        <p className="section-desc">Detect splicing or manipulation by analyzing differences in JPEG compression error levels.</p>
        <button 
          className="cyber-btn primary"
          onClick={onAnalyzeELA}
          disabled={isProcessing}
        >
          Generate ELA Heatmap
        </button>
      </section>

      {/* 4. Deep Scrub */}
      <section className="cyber-section">
        <h3 className="section-title"><Eraser size={18} /> Forensic Deep Scrub</h3>
        <p className="section-desc">Aggressively wipe all embedded EXIF, ICC profiles, and hidden binary segments by redrawing the image completely.</p>
        <button 
          className="cyber-btn danger"
          onClick={onDeepScrub}
          disabled={isProcessing}
        >
          Deep Scrub Image
        </button>
      </section>

    </div>
  );
};

export default CyberPanel;

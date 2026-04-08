import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle, Loader, ShieldCheck, Zap, Lock, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Determine API base dynamically
const API_BASE = import.meta.env.VITE_API_URL || "";  // empty string = same origin

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${API_BASE}/api/v1/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      localStorage.setItem('latestReport', data.raw_json);
      localStorage.setItem('latestReportUrl', data.report_url);
      navigate('/compliance');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: ShieldCheck, label: 'Compliance Checks', value: '200+' },
    { icon: Zap, label: 'Avg. Analysis Time', value: '< 2 mins' },
    { icon: Lock, label: 'Secure & Private', value: '256-bit' },
    { icon: FileText, label: 'Formats Supported', value: 'PDF · DOCX · TXT' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .up-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center; /* centers content vertically */
          padding: 40px 24px;
        }

        /* ── ambient glows ── */
        .up-root::before {
          content: '';
          position: fixed;
          top: -200px; left: 50%;
          transform: translateX(-50%);
          width: 900px; height: 600px;
          background: radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .up-root::after {
          content: '';
          position: fixed;
          bottom: -150px; right: -100px;
          width: 600px; height: 600px;
          background: radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* animated grid */
        .grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          z-index: 0;
          animation: gridPan 30s linear infinite;
        }
        @keyframes gridPan {
          0%   { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }

        .up-inner {
          position: relative;
          z-index: 1;
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        /* ── header ── */
        .up-header {
          text-align: center;
          animation: fadeUp 0.6s ease both;
        }
        .up-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.25);
          color: #60a5fa;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 100px;
          margin-bottom: 20px;
        }
        .up-badge span { width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; animation: pulse 1.8s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(0.7)} }

        .up-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 800;
          line-height: 1.1;
          background: linear-gradient(135deg, #f8fafc 30%, #93c5fd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 14px;
        }
        .up-sub {
          color: #94a3b8;
          font-size: 1.05rem;
          font-weight: 300;
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.65;
        }

        /* ── stats row ── */
        .up-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          animation: fadeUp 0.6s 0.1s ease both;
        }
        @media (max-width: 640px) { .up-stats { grid-template-columns: repeat(2, 1fr); } }

        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 20px 16px;
          text-align: center;
          transition: border-color 0.25s, transform 0.25s;
        }
        .stat-card:hover { border-color: rgba(59,130,246,0.3); transform: translateY(-2px); }
        .stat-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: rgba(59,130,246,0.12);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 10px;
          color: #60a5fa;
        }
        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #f1f5f9;
          line-height: 1.2;
        }
        .stat-label {
          font-size: 0.72rem;
          color: #64748b;
          margin-top: 3px;
          letter-spacing: 0.02em;
        }

        /* ── drop zone card ── */
        .up-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 40px;
          backdrop-filter: blur(12px);
          animation: fadeUp 0.6s 0.2s ease both;
          position: relative;
          overflow: hidden;
        }
        .up-card::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          height: 1px; width: 60%;
          background: linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent);
        }

        .up-error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5;
          padding: 14px 18px;
          border-radius: 12px;
          margin-bottom: 28px;
          font-size: 0.9rem;
        }

        .drop-zone {
          border: 1.5px dashed rgba(255,255,255,0.12);
          border-radius: 18px;
          padding: 64px 40px;
          text-align: center;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          background: rgba(255,255,255,0.015);
        }
        .drop-zone:hover,
        .drop-zone.active {
          border-color: #3b82f6;
          background: rgba(59,130,246,0.05);
        }
        .drop-zone.active .drop-icon-wrap { background: rgba(59,130,246,0.2); }

        .drop-icon-wrap {
          width: 80px; height: 80px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          transition: all 0.3s;
          color: #60a5fa;
        }
        .drop-zone:hover .drop-icon-wrap { background: rgba(59,130,246,0.15); transform: translateY(-4px); }

        .drop-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 8px;
        }
        .drop-sub { color: #64748b; font-size: 0.88rem; margin-bottom: 24px; }

        .format-pills {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .format-pill {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 4px 12px;
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          font-weight: 600;
          color: #94a3b8;
        }

        .btn-browse {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: #e2e8f0;
          padding: 11px 28px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-browse:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); transform: translateY(-1px); }

        /* ── file selected state ── */
        .file-selected-zone {
          padding: 48px 40px;
          text-align: center;
        }
        .file-icon-wrap {
          width: 80px; height: 80px;
          border-radius: 50%;
          background: rgba(59,130,246,0.15);
          border: 1px solid rgba(59,130,246,0.3);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          color: #60a5fa;
          animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes popIn { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }

        .file-name {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 4px;
          word-break: break-all;
        }
        .file-size { color: #64748b; font-size: 0.85rem; margin-bottom: 28px; }

        .btn-row { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; }

        .btn-remove {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          color: #94a3b8;
          padding: 12px 26px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-remove:hover { border-color: rgba(239,68,68,0.4); color: #fca5a5; }

        .btn-analyze {
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          border: none;
          color: #fff;
          padding: 12px 32px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          transition: all 0.25s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 0 24px rgba(37,99,235,0.35);
          letter-spacing: 0.02em;
        }
        .btn-analyze:hover:not(:disabled) { box-shadow: 0 0 36px rgba(37,99,235,0.55); transform: translateY(-2px); }
        .btn-analyze:disabled { opacity: 0.6; cursor: not-allowed; }

        /* progress bar while loading */
        .progress-bar-wrap {
          width: 100%; max-width: 360px;
          margin: 24px auto 0;
          height: 3px;
          background: rgba(255,255,255,0.06);
          border-radius: 99px;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #818cf8);
          border-radius: 99px;
          animation: shimmer 1.5s ease-in-out infinite;
          background-size: 200% 100%;
        }
        @keyframes shimmer { 0%{background-position:200%} 100%{background-position:-200%} }

        /* ── tip row ── */
        .tip-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          animation: fadeUp 0.6s 0.3s ease both;
        }
        @media (max-width: 540px) { .tip-row { grid-template-columns: 1fr; } }

        .tip-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .tip-icon {
          width: 34px; height: 34px; flex-shrink: 0;
          border-radius: 9px;
          background: rgba(59,130,246,0.1);
          display: flex; align-items: center; justify-content: center;
          color: #60a5fa;
        }
        .tip-title { font-size: 0.82rem; font-weight: 600; color: #cbd5e1; margin-bottom: 3px; }
        .tip-desc  { font-size: 0.78rem; color: #475569; line-height: 1.5; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="up-root">
        <div className="grid-bg" />

        <div className="up-inner">

          {/* Header */}
          <div className="up-header">
            <div className="up-badge">
              <span /> AI-Powered Analysis
            </div>
            <h1 className="up-title">Upload Your Contract</h1>
            <p className="up-sub">
              Drop any legal document and get instant AI-driven risk detection,
              compliance scoring, and actionable insights.
            </p>
          </div>

          {/* Stats */}
          <div className="up-stats">
            {stats.map(({ icon: Icon, label, value }) => (
              <div className="stat-card" key={label}>
                <div className="stat-icon"><Icon size={17} /></div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Main card */}
          <div className="up-card">
            {error && <div className="up-error">{error}</div>}

            {!file ? (
              <div
                className={`drop-zone${dragActive ? ' active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept=".pdf,.txt,.docx"
                  onChange={handleChange}
                />
                <div className="drop-icon-wrap">
                  <UploadCloud size={34} />
                </div>
                <div className="drop-title">Drag & drop your contract here</div>
                <div className="drop-sub">or click anywhere to browse your files</div>
                <div className="format-pills">
                  {['PDF', 'DOCX', 'TXT'].map(f => (
                    <span className="format-pill" key={f}>{f}</span>
                  ))}
                </div>
                <button
                  className="btn-browse"
                  disabled={loading}
                  onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
                >
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="file-selected-zone">
                <div className="file-icon-wrap">
                  <File size={34} />
                </div>
                <div className="file-name">{file.name}</div>
                <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze</div>
                <div className="btn-row">
                  <button className="btn-remove" disabled={loading} onClick={() => setFile(null)}>
                    Remove
                  </button>
                  <button className="btn-analyze" disabled={loading} onClick={handleUpload}>
                    {loading
                      ? <><Loader size={17} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</>
                      : <><CheckCircle size={17} /> Analyze Contract</>
                    }
                  </button>
                </div>
                {loading && (
                  <div className="progress-bar-wrap">
                    <div className="progress-bar" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tip cards */}
          <div className="tip-row">
            {[
              {
                icon: ShieldCheck,
                title: 'End-to-End Encrypted',
                desc: 'Your documents are encrypted in transit and at rest. We never store raw contract files.',
              },
              {
                icon: Zap,
                title: 'Results in Seconds',
                desc: 'Our AI engine processes even complex multi-page contracts in under 2 minutes.',
              },
              {
                icon: FileText,
                title: 'Clause-Level Detail',
                desc: 'Every risky clause is flagged individually with severity scores and remediation tips.',
              },
              {
                icon: Lock,
                title: 'GDPR Ready',
                desc: 'Infrastructure built to enterprise compliance standards so your data stays yours.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div className="tip-card" key={title}>
                <div className="tip-icon"><Icon size={16} /></div>
                <div>
                  <div className="tip-title">{title}</div>
                  <div className="tip-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
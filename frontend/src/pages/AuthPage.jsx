import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Determine API base dynamically
const API_BASE = import.meta.env.VITE_API_URL || "";  // empty string = same origin

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #0a0f1e;
    --navy-card: #111d33;
    --navy-border: #1c2e4a;
    --blue-accent: #2563eb;
    --blue-bright: #3b82f6;
    --text-primary: #e8eef7;
    --text-muted: #7a91b0;
    --text-dim: #4a6080;
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--navy);
    color: var(--text-primary);
    min-height: 100vh;
    overflow-x: hidden;
  }

  .auth-page { display: flex; flex-direction: column; min-height: 100vh; }

  .bg-layer {
  position: fixed; inset: 0; z-index: 0;
  background:
    linear-gradient(rgba(5,10,25,0.82), rgba(5,10,25,0.82)),
    url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80') center/cover no-repeat;
}
  .bg-grid {
    position: fixed; inset: 0; z-index: 0;
    background-image:
      linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 40px; height: 64px;
    border-bottom: 1px solid var(--navy-border);
    background: rgba(10,15,30,0.95);
    backdrop-filter: blur(12px);
  }
  .nav-logo {
    display: flex; align-items: center; gap: 10px;
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem; font-weight: 700; color: var(--text-primary);
    cursor: pointer;
  }
  .nav-logo-icon {
    width: 34px; height: 34px; background: var(--blue-accent);
    border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem;
  }
  .nav-links { display: flex; gap: 8px; list-style: none; }
  .nav-links button {
    background: none; border: none; color: var(--text-muted);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem; font-weight: 500; transition: all 0.2s;
    padding: 6px 14px; border-radius: 7px; cursor: pointer;
  }
  .nav-links button:hover { color: var(--text-primary); background: rgba(59,130,246,0.08); }
  .nav-links button.active { color: var(--text-primary); background: rgba(37,99,235,0.15); border-bottom: 2px solid var(--blue-bright); }

  .page-layout {
    position: relative; z-index: 1;
    display: grid; grid-template-columns: 1fr 1fr;
    min-height: calc(100vh - 64px);
    margin-top: 64px;   /* ← add this */
  }
  .left-side {
    display: flex; flex-direction: column; justify-content: center;
    padding: 50px 32px 40px 40px; gap: 20px;
  }
  .hero-text h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 2.8vw, 2.8rem);
    font-weight: 700; line-height: 1.12; margin-bottom: 12px;
    animation: fadeUp 0.4s ease both;
  }
  .hero-text p {
    font-size: 0.93rem; color: var(--text-muted);
    line-height: 1.65; max-width: 440px;
    animation: fadeUp 0.4s ease both; animation-delay: 0.1s;
  }
  .about-card {
    background: var(--navy-card); border: 1px solid var(--navy-border);
    border-radius: 16px; padding: 24px 24px 20px;
    animation: fadeUp 0.5s ease both; animation-delay: 0.2s;
    position: relative; overflow: hidden;
  }
  .about-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.35), transparent);
  }
  .about-card h3 { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 600; margin-bottom: 6px; }
  .about-card > p { font-size: 0.82rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px; }
  .about-card h4 { font-size: 0.88rem; font-weight: 600; margin-bottom: 4px; }
  .aim-text { font-size: 0.82rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 16px; }
  .features-label { font-size: 0.86rem; font-weight: 600; margin-bottom: 11px; }
  .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .feature-item { display: flex; align-items: flex-start; gap: 9px; }
  .feature-icon { width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.88rem; }
  .fi-blue   { background: rgba(37,99,235,0.15); }
  .fi-orange { background: rgba(240,164,41,0.15); }
  .fi-green  { background: rgba(16,185,129,0.15); }
  .fi-purple { background: rgba(139,92,246,0.15); }
  .feature-text strong { display: block; font-size: 0.79rem; font-weight: 600; color: var(--text-primary); }
  .feature-text span   { font-size: 0.72rem; color: var(--text-dim); }

  .right-side {
    display: flex; align-items: center; justify-content: center;
    padding: 48px 56px 48px 28px;
  }
  .auth-card {
    background: rgba(17,29,51,0.97); border: 1px solid var(--navy-border);
    border-radius: 18px; padding: 30px 30px 26px;
    width: 100%; max-width: 400px;
    box-shadow: 0 0 0 1px rgba(59,130,246,0.07), 0 30px 70px rgba(0,0,0,0.4), 0 0 50px rgba(37,99,235,0.06);
    animation: fadeUp 0.5s ease both; animation-delay: 0.25s;
    position: relative; overflow: hidden;
  }
  .auth-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.55), transparent);
  }
  .auth-header { text-align: center; margin-bottom: 20px; }
  .auth-icon-wrap {
    width: 50px; height: 50px; border-radius: 14px;
    background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.25);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 12px; font-size: 1.4rem;
  }
  .auth-header h2 { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; margin-bottom: 6px; }
  .auth-badge {
    display: inline-block;
    background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.2);
    border-radius: 20px; padding: 3px 10px;
    font-size: 0.62rem; letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--blue-bright); margin-bottom: 7px; font-weight: 500;
  }
  .auth-subtitle { font-size: 0.79rem; color: var(--text-muted); }
  .form-group { margin-bottom: 12px; }
  .form-group label { display: flex; align-items: center; gap: 6px; font-size: 0.79rem; font-weight: 500; color: #8fa5c0; margin-bottom: 5px; }
  .input-wrap { position: relative; }
  .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-dim); font-size: 0.8rem; pointer-events: none; }
  .auth-input {
    width: 100%; background: rgba(10,15,30,0.7); border: 1px solid var(--navy-border);
    border-radius: 9px; padding: 10px 12px 10px 36px;
    font-family: 'DM Sans', sans-serif; font-size: 0.85rem; color: var(--text-primary); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .auth-input::placeholder { color: var(--text-dim); }
  .auth-input:focus { border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .alert { border-radius: 8px; padding: 9px 12px; font-size: 0.79rem; margin-bottom: 12px; text-align: center; }
  .alert.error   { background: rgba(239,68,68,0.08);  border: 1px solid rgba(239,68,68,0.2);  color: #f87171; }
  .alert.success { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); color: #34d399; }
  .btn-submit {
    width: 100%; padding: 11px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    border: none; border-radius: 9px; color: #fff;
    font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: all 0.2s; box-shadow: 0 4px 18px rgba(37,99,235,0.3); margin-top: 4px;
  }
  .btn-submit:hover:not(:disabled) { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 6px 24px rgba(37,99,235,0.45); transform: translateY(-1px); }
  .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-footer { text-align: center; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--navy-border); font-size: 0.79rem; color: var(--text-muted); }
  .auth-footer button { background: none; border: none; color: var(--blue-bright); font-family: 'DM Sans', sans-serif; font-weight: 600; cursor: pointer; font-size: 0.79rem; transition: color 0.2s; }
  .auth-footer button:hover { color: #93c5fd; }

  /* OVERLAY */
  .overlay-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(5,10,20,0.75); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease;
  }
  .overlay-panel {
    background: var(--navy-card); border: 1px solid var(--navy-border);
    border-radius: 20px; width: 80vw; max-width: 820px; max-height: 80vh;
    overflow: hidden; display: flex; flex-direction: column;
    box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1);
    animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1); position: relative;
  }
  .overlay-panel::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent);
  }
  .overlay-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; height: 52px;
    border-bottom: 1px solid var(--navy-border);
    background: rgba(10,15,30,0.6); flex-shrink: 0;
  }
  .overlay-topbar-left { display: flex; align-items: center; gap: 10px; }
  .browser-dots { display: flex; gap: 6px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot-red    { background: #ff5f57; }
  .dot-yellow { background: #febc2e; }
  .dot-green  { background: #28c840; }
  .overlay-url {
    background: rgba(10,15,30,0.8); border: 1px solid var(--navy-border);
    border-radius: 6px; padding: 5px 14px;
    font-size: 0.75rem; color: var(--text-dim); min-width: 260px; text-align: center;
  }
  .overlay-close {
    width: 30px; height: 30px; border-radius: 7px;
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
    color: #f87171; font-size: 1rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  }
  .overlay-close:hover { background: rgba(239,68,68,0.2); }
  .overlay-content {
    overflow-y: auto; flex: 1; padding: 40px 48px;
    scrollbar-width: thin; scrollbar-color: var(--navy-border) transparent;
  }
  .overlay-content::-webkit-scrollbar { width: 5px; }
  .overlay-content::-webkit-scrollbar-thumb { background: var(--navy-border); border-radius: 10px; }
  .section-tag {
    display: inline-block;
    background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.25);
    color: var(--blue-bright); border-radius: 20px;
    padding: 4px 14px; font-size: 0.7rem; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px;
  }
  .section-title { font-family: 'Playfair Display', serif; font-size: 1.9rem; font-weight: 700; margin-bottom: 14px; line-height: 1.2; }
  .section-body  { font-size: 0.9rem; color: var(--text-muted); line-height: 1.75; margin-bottom: 28px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
  .info-box { background: rgba(10,15,30,0.6); border: 1px solid var(--navy-border); border-radius: 12px; padding: 20px; }
  .info-box-icon { font-size: 1.4rem; margin-bottom: 10px; }
  .info-box h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 6px; }
  .info-box p  { font-size: 0.82rem; color: var(--text-muted); line-height: 1.6; }
  .features-big-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .feature-big-card { background: rgba(10,15,30,0.6); border: 1px solid var(--navy-border); border-radius: 14px; padding: 22px; transition: border-color 0.2s, transform 0.2s; }
  .feature-big-card:hover { border-color: rgba(59,130,246,0.35); transform: translateY(-2px); }
  .fbc-icon  { font-size: 1.6rem; margin-bottom: 12px; }
  .fbc-title { font-size: 0.95rem; font-weight: 600; margin-bottom: 6px; }
  .fbc-desc  { font-size: 0.82rem; color: var(--text-muted); line-height: 1.6; }
  .fbc-tag   { display: inline-block; margin-top: 12px; background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.2); color: var(--blue-bright); border-radius: 6px; padding: 3px 10px; font-size: 0.69rem; font-weight: 600; }
  .steps-list { display: flex; flex-direction: column; }
  .step-item  { display: flex; gap: 20px; padding-bottom: 32px; }
  .step-item:last-child { padding-bottom: 0; }
  .step-left  { display: flex; flex-direction: column; align-items: center; }
  .step-num   { width: 40px; height: 40px; border-radius: 50%; background: var(--blue-accent); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; box-shadow: 0 4px 14px rgba(37,99,235,0.4); }
  .step-line  { width: 2px; flex: 1; margin-top: 8px; background: linear-gradient(180deg, rgba(37,99,235,0.4) 0%, transparent 100%); min-height: 30px; }
  .step-right { padding-top: 8px; }
  .step-right h4 { font-size: 0.95rem; font-weight: 600; margin-bottom: 6px; }
  .step-right p  { font-size: 0.83rem; color: var(--text-muted); line-height: 1.65; }

  @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

  @media (max-width: 860px) {
    .page-layout { grid-template-columns: 1fr; }
    .left-side, .right-side { padding: 32px 24px; }
    .overlay-panel { width: 95vw; }
    .overlay-content { padding: 28px 24px; }
    .info-grid, .features-big-grid { grid-template-columns: 1fr; }
  }
`;

// ── Overlay components ──────────────────────────────────────────────

function OverlayWrapper({ url, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="overlay-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="overlay-panel">
        <div className="overlay-topbar">
          <div className="overlay-topbar-left">
            <div className="browser-dots">
              <div className="dot dot-red" /><div className="dot dot-yellow" /><div className="dot dot-green" />
            </div>
            <div className="overlay-url">{url}</div>
          </div>
          <button className="overlay-close" onClick={onClose}>✕</button>
        </div>
        <div className="overlay-content">{children}</div>
      </div>
    </div>
  );
}

function AboutOverlay({ onClose }) {
  return (
    <OverlayWrapper url="aicomplianceauditor.app / about" onClose={onClose}>
      <div className="section-tag">About</div>
      <h2 className="section-title">What is AI Compliance Auditor?</h2>
      <p className="section-body">AI Compliance Auditor is an intelligent legal-tech platform that leverages advanced AI models to analyze contracts and legal documents. It automatically identifies risk clauses, compliance gaps, and legal obligations — saving legal teams hours of manual review.</p>
      <div className="info-grid">
        {[
          { icon: "🏛️", title: "Our Mission", desc: "To democratize access to legal contract intelligence and empower businesses of all sizes with AI-powered compliance tools." },
          { icon: "🎯", title: "Our Vision", desc: "A world where every contract is reviewed with precision, speed, and consistency — eliminating costly legal oversights." },
          { icon: "👥", title: "Who It's For", desc: "Legal teams, compliance officers, startups, and enterprises who need fast, reliable contract risk assessment." },
          { icon: "🔒", title: "Security First", desc: "All documents are processed with end-to-end encryption. Your data is never stored beyond the session without explicit consent." },
        ].map(({ icon, title, desc }) => (
          <div className="info-box" key={title}>
            <div className="info-box-icon">{icon}</div>
            <h4>{title}</h4><p>{desc}</p>
          </div>
        ))}
      </div>
    </OverlayWrapper>
  );
}

function FeaturesOverlay({ onClose }) {
  const features = [
    { icon: "📄", title: "Intelligent Clause Extraction", desc: "Automatically identifies and categorizes every clause — liability, indemnity, termination, payment terms, and more.", tag: "NLP Powered" },
    { icon: "⚠️", title: "Risk Detection & Flagging", desc: "Highlights clauses that pose legal, financial, or operational risks using context-aware AI.", tag: "Real-time" },
    { icon: "📊", title: "Compliance Scoring", desc: "Generates an overall compliance health score and per-section ratings so you can instantly see where your contract stands.", tag: "Quantified" },
    { icon: "📋", title: "Detailed Audit Reports", desc: "Download fully formatted PDF audit reports with annotated findings and remediation recommendations.", tag: "Exportable" },
    { icon: "🔍", title: "Multi-format Support", desc: "Upload PDF, DOCX, or TXT files. Our parser handles scanned documents and complex formatting.", tag: "PDF · DOCX · TXT" },
    { icon: "⚡", title: "Instant Analysis", desc: "Most contracts are fully analyzed within seconds. Results appear in real time as AI processes each section.", tag: "Sub-30s Results" },
  ];
  return (
    <OverlayWrapper url="aicomplianceauditor.app / features" onClose={onClose}>
      <div className="section-tag">Features</div>
      <h2 className="section-title">Everything you need for contract compliance</h2>
      <p className="section-body">Our platform bundles powerful AI-driven capabilities into one seamless workflow — from upload to comprehensive risk report.</p>
      <div className="features-big-grid">
        {features.map(({ icon, title, desc, tag }) => (
          <div className="feature-big-card" key={title}>
            <div className="fbc-icon">{icon}</div>
            <div className="fbc-title">{title}</div>
            <p className="fbc-desc">{desc}</p>
            <span className="fbc-tag">{tag}</span>
          </div>
        ))}
      </div>
    </OverlayWrapper>
  );
}

function HowItWorksOverlay({ onClose }) {
  const steps = [
    { title: "Create Your Account", desc: "Sign up with your company email. Your account is linked to your organization so all audits are securely stored." },
    { title: "Upload Your Contract", desc: "Drag and drop or browse to upload your contract in PDF, DOCX, or TXT format. Files are encrypted in transit and at rest." },
    { title: "AI Analyzes the Document", desc: "Our AI engine parses every clause, cross-references compliance databases, and flags risks — all within seconds." },
    { title: "Review Risk Report", desc: "Get an interactive report with a compliance score, highlighted clauses, and risk categories." },
    { title: "Download & Share", desc: "Export a polished PDF audit report to share with stakeholders or store for compliance records." },
  ];
  return (
    <OverlayWrapper url="aicomplianceauditor.app / how-it-works" onClose={onClose}>
      <div className="section-tag">How It Works</div>
      <h2 className="section-title">From upload to audit in seconds</h2>
      <p className="section-body">Our streamlined workflow takes your contract from raw document to a complete compliance audit with zero manual effort.</p>
      <div className="steps-list">
        {steps.map(({ title, desc }, i) => (
          <div className="step-item" key={title}>
            <div className="step-left">
              <div className="step-num">{i + 1}</div>
              {i < steps.length - 1 && <div className="step-line" />}
            </div>
            <div className="step-right"><h4>{title}</h4><p>{desc}</p></div>
          </div>
        ))}
      </div>
    </OverlayWrapper>
  );
}

// ── Main AuthPage ───────────────────────────────────────────────────

export default function AuthPage() {
  const [overlay, setOverlay] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem("token")) {
      localStorage.getItem("is_admin") === "true" ? navigate("/admin") : navigate("/upload");
    }
  }, [navigate]);

  // ── Real API call (your original logic, unchanged) ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? "/api/v1/auth/login" : "/api/v1/auth/signup";
    const payload = isLogin
      ? { email, password }
      : { email, password, company_name: companyName };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed");

      if (isLogin) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("is_admin", data.is_admin);
        localStorage.setItem("company_name", data.company_name || "");
        localStorage.removeItem("latestReport");
        localStorage.removeItem("latestReportUrl");

        // Force full refresh so Navigation component re-reads localStorage
        window.location.href = data.is_admin ? "/admin" : "/upload";
      } else {
        setIsLogin(true);
        setError("Account created successfully. Please sign in.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = error?.includes("successfully");

  return (
    <>
      <style>{styles}</style>
      <div className="auth-page">
        <div className="bg-layer" />
        <div className="bg-grid" />

        {/* NAV */}
        <nav>
          <div className="nav-logo" onClick={() => setOverlay(null)}>
            <div className="nav-logo-icon">⚖️</div>
            AI Compliance Auditor
          </div>
          <ul className="nav-links">
            <li><button className={!overlay ? "active" : ""} onClick={() => setOverlay(null)}>Home</button></li>
            <li><button className={overlay === "about" ? "active" : ""} onClick={() => setOverlay("about")}>About</button></li>
            <li><button className={overlay === "features" ? "active" : ""} onClick={() => setOverlay("features")}>Features</button></li>
            <li><button className={overlay === "howitworks" ? "active" : ""} onClick={() => setOverlay("howitworks")}>How It Works</button></li>
          </ul>
        </nav>

        {/* MAIN LAYOUT */}
        <div className="page-layout">

          {/* LEFT */}
          <div className="left-side">
            <div className="hero-text">
              <h1>AI Contract<br />Compliance Auditor</h1>
              <p>Upload contracts and let AI automatically detect risks, compliance issues and legal obligations within seconds.</p>
            </div>
            <div className="about-card">
              <h3>About the Project</h3>
              <p>AI Contract Compliance Auditor analyzes legal documents to identify risks, obligations, and compliance issues automatically.</p>
              <h4>Our Aim</h4>
              <p className="aim-text">To simplify legal contract analysis using AI and help individuals and businesses understand risks instantly.</p>
              <div className="features-label">Key Features</div>
              <div className="features-grid">
                {[
                  { cls: "fi-blue", icon: "📄", label: "Clause Extraction", sub: "Intelligent clause extraction" },
                  { cls: "fi-orange", icon: "⚠️", label: "Risk Detection", sub: "Identify compliance issues" },
                  { cls: "fi-green", icon: "📊", label: "Compliance Scoring", sub: "Assess adherence" },
                  { cls: "fi-purple", icon: "📋", label: "Detailed Reports", sub: "Comprehensive insights" },
                ].map(({ cls, icon, label, sub }) => (
                  <div className="feature-item" key={label}>
                    <div className={`feature-icon ${cls}`}>{icon}</div>
                    <div className="feature-text"><strong>{label}</strong><span>{sub}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: AUTH */}
          <div className="right-side">
            <div className="auth-card">
              <div className="auth-header">
                <div className="auth-icon-wrap">🛡️</div>

                <div className="auth-badge">Automated Risk &amp; Compliance Assessment</div>
                <p className="auth-subtitle">{isLogin ? "Sign in to your account" : "Register a new auditor account"}</p>
              </div>

              {error && <div className={`alert ${isSuccess ? "success" : "error"}`}>{error}</div>}

              {/* form uses onSubmit — works with both Enter key and button click */}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="emailInput">✉️ Email Address</label>
                  <div className="input-wrap">
                    <span className="input-icon"></span>
                    <input id="emailInput" className="auth-input" type="email" required
                      placeholder="user@company.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                {!isLogin && (
                  <div className="form-group">
                    <label htmlFor="companyInput">🏢 Company Name</label>
                    <div className="input-wrap">
                      <span className="input-icon"></span>
                      <input id="companyInput" className="auth-input" type="text" required
                        placeholder="Acme Corp" value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="passInput">🔒 Password</label>
                  <div className="input-wrap">
                    <span className="input-icon"></span>
                    <input id="passInput" className="auth-input" type="password" required
                      placeholder="••••••••" value={password}
                      onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  <span>🔐</span>
                  <span>{loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}</span>
                </button>
              </form>

              <div className="auth-footer">
                <span>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
                <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }}>
                  {isLogin ? "Sign up" : "Log in"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* OVERLAYS */}
        {overlay === "about" && <AboutOverlay onClose={() => setOverlay(null)} />}
        {overlay === "features" && <FeaturesOverlay onClose={() => setOverlay(null)} />}
        {overlay === "howitworks" && <HowItWorksOverlay onClose={() => setOverlay(null)} />}
      </div>
    </>
  );
}
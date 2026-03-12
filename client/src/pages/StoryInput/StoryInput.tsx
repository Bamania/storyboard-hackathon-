import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { useStoryStore } from '../../stores/storyStore';
import { useScreenplayStore } from '../../stores/screenplayStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { agents } from '../../theme/tokens';
import { mockScenes } from '../../data/mockScreenplay';


/**
 * Page 1 — Story Input
 * Entry point where the user writes their story idea and generates a screenplay.
 */
const StoryInput = () => {
  const navigate = useNavigate();
  const { storyText, isGenerating, setStoryText, startGenerating } = useStoryStore();
  const { setScenes } = useScreenplayStore();
  const { setCurrentStep, completeStep } = useNavigationStore();

  const handleGenerate = () => {
    if (!storyText.trim()) return;
    startGenerating();
    setTimeout(() => {
      setScenes(mockScenes);
      completeStep(1);
      setCurrentStep(2);
      navigate('/screenplay');
    }, 2000);
  };

  const crewBadges = [
    { key: 'director', ...agents.director },
    { key: 'cinematographer', ...agents.cinematographer },
    { key: 'editor', ...agents.editor },
    { key: 'productionDesigner', ...agents.productionDesigner },
  ];

  // ── Shared styles ──
  const pageWrapper: React.CSSProperties = {
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    position: 'relative',
    background: 'transparent',
  };

  const contentWrapper: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10,
    padding: '32px 16px 48px',
    marginTop: '60px',
    width: '100%',
  };

  const badgeWrapper: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '9999px',
    padding: '6px 20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
    border: '1px solid rgba(255,255,255,0.2)',
    marginBottom: '16px',
  };

  const badgeText: React.CSSProperties = {
    color: '#C4724B',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
  };

  const headline: React.CSSProperties = {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: '3.2rem',
    fontStyle: 'italic',
    color: '#2C2C2C',
    marginBottom: '12px',
    textAlign: 'center',
    lineHeight: 1.15,
  };

  const subtitle: React.CSSProperties = {
    color: '#5A5248',
    fontSize: '15px',
    textAlign: 'center',
    maxWidth: '480px',
    marginBottom: '28px',
    lineHeight: 1.65,
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '640px',
    height: '140px',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '20px',
    padding: '24px',
    fontSize: '15px',
    color: '#2C2C2C',
    fontFamily: '"Inter", system-ui, sans-serif',
    resize: 'none' as const,
    outline: 'none',
    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
    marginBottom: '20px',
  };

  const badgesRow: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '12px',
  };

  const crewPill: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '9999px',
    padding: '8px 18px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
    border: '1px solid rgba(255,255,255,0.2)',
  };

  const crewDot = (color: string): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
  });

  const crewLabel: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#2C2C2C',
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const standbyText: React.CSSProperties = {
    color: '#8A7E72',
    fontSize: '13px',
    fontStyle: 'italic',
    marginBottom: '14px',
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const btnBase: React.CSSProperties = {
    padding: '14px 5px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    border: 'none',
    transition: 'all 0.3s',
    fontFamily: '"Inter", system-ui, sans-serif',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    minWidth: '280px',
  };

  const btnEnabled: React.CSSProperties = {
    ...btnBase,
    backgroundColor: '#bb6d49',
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(196,114,75,0.25)',
  };

  const btnDisabled: React.CSSProperties = {
    ...btnBase,
    backgroundColor: '#bb6d49',
    color: '#FDF8F3',
    cursor: 'not-allowed',
    opacity: 0.85,
  };

  const btnGenerating: React.CSSProperties = {
    ...btnBase,
    backgroundColor: '#F0E2D0',
    color: '#A07856',
    cursor: 'not-allowed',
    border: '1px solid #E0CEB8',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  };

  const spinnerStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    border: '2.5px solid #E0CEB8',
    borderTop: '2.5px solid #A07856',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  };

  const cardsRow: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '48px',
    width: '100%',
    maxWidth: '720px',
  };

  const card: React.CSSProperties = {
    flex: '1 1 200px',
    maxWidth: '230px',
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '20px',
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
    border: '1px solid rgba(255,255,255,0.2)',
  };

  const cardTitle: React.CSSProperties = {
    fontWeight: 700,
    color: '#2C2C2C',
    fontSize: '15px',
    marginBottom: '8px',
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const cardDesc: React.CSSProperties = {
    color: '#5A5248',
    fontSize: '13px',
    lineHeight: 1.55,
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const footer: React.CSSProperties = {
    marginTop: '48px',
    color: '#8A7E72',
    fontSize: '13px',
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const features = [
    { title: 'Instant Visuals', description: 'AI-generated frames for every scene.' },
    { title: 'Collaboration First', description: 'Share and edit live with your team.' },
    { title: 'Cinematic Export', description: 'Direct to PDF, Final Draft, or MOV.' },
  ];

  return (
    <div style={pageWrapper}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes grainShift {
          0%, 100% { transform: translate(0,0); }
          10% { transform: translate(-1px,-1px); }
          30% { transform: translate(2px,1px); }
          50% { transform: translate(-1px,2px); }
          70% { transform: translate(1px,-1px); }
          90% { transform: translate(-2px,1px); }
        }
      `}</style>

      {/* Static paper background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/background.avif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          zIndex: 0,
        }}
      />

      {/* Film grain overlay */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="paperGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div
        style={{
          position: 'fixed',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          filter: 'url(#paperGrain)',
          opacity: 0.03,
          pointerEvents: 'none',
          zIndex: 1,
          animation: 'grainShift 0.4s steps(3) infinite',
        }}
      />

      <Navbar />

      <div style={contentWrapper}>
        {/* PRE-PRODUCTION badge */}
        <div style={badgeWrapper}>
          <span style={badgeText}>PRE-PRODUCTION</span>
        </div>

        {/* Headline */}
        <h1 style={headline}>What's your story?</h1>

        {/* Subtitle */}
        <p style={subtitle}>
          Paste a script, describe your vision, or drop a treatment. Your
          production crew will bring it to life.
        </p>

        {/* Textarea */}
        <textarea
          value={storyText}
          onChange={(e) => setStoryText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          placeholder="A noir detective story set in a rain-soaked city at night..."
          disabled={isGenerating}
          style={textareaStyle}
        />

        {/* Crew badges */}
        <div style={badgesRow}>
          {crewBadges.map((agent) => (
            <div key={agent.key} style={crewPill}>
              <span style={crewDot(agent.color)} />
              <span style={crewLabel}>
                {agent.emoji} {agent.role === 'Production Designer' ? 'Prod. Designer' : agent.role}
              </span>
            </div>
          ))}
        </div>

        {/* Standby text */}
        <p style={standbyText}>Your crew is standing by</p>

        {/* Generate button */}
        {isGenerating ? (
          <button disabled style={btnGenerating}>
            Generating screenplay...
            <span style={spinnerStyle} />
          </button>
        ) : (
          <button
            disabled={!storyText.trim()}
            onClick={handleGenerate}
            style={storyText.trim() ? btnEnabled : btnDisabled}
          >
            Generate Screenplay →
          </button>
        )}

        {/* Feature cards */}
        <div style={cardsRow}>
          {features.map((f) => (
            <div key={f.title} style={card}>
              <h3 style={cardTitle}>{f.title}</h3>
              <p style={cardDesc}>{f.description}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={footer}>© 2024 Storyboard Studio. Built for creators.</p>
      </div>
    </div>
  );
};

export default StoryInput;

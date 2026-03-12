import React from 'react';
import { useNavigationStore } from '../../stores/navigationStore';
import type { AppStep } from '../../types';

interface NavbarProps {
  /** If provided, renders the horizontal stepper navbar instead of landing nav links */
  step?: number;
}

const STEPS = [
  { num: 1, label: 'SCRIPT', path: '/screenplay' },
  { num: 2, label: 'CAST', path: '/cast' },
  { num: 3, label: 'SHOTS', path: '/shots' },
  { num: 4, label: 'EDITOR', path: '/storyboard' },
];

/**
 * Navbar — Fixed top navigation bar.
 * Landing page: logo + Features/Gallery/Pricing + Sign In
 * Workflow pages: logo + horizontal step progress + settings + avatar
 */
const Navbar: React.FC<NavbarProps> = ({ step }) => {
  const { completedSteps } = useNavigationStore();
  const nav: React.CSSProperties = {
    position: 'fixed',
    top: '12px',
    left: '24px',
    right: '24px',
    zIndex: 50,
    height: '52px',
    padding: '0 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const logo: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const logoText: React.CSSProperties = {
    fontSize: step ? '14px' : '18px',
    fontWeight: 700,
    color: '#2C2C2C',
    letterSpacing: step ? '0.06em' : '-0.02em',
    fontFamily: step ? '"Inter", system-ui, sans-serif' : '"Playfair Display", Georgia, serif',
    textTransform: step ? 'uppercase' as const : 'none' as const,
  };

  // ── Landing variant ──
  if (!step) {
    return (
      <nav style={nav}>
        <div style={logo}>
          <span style={{ fontSize: '20px' }}>🎬</span>
          <span style={logoText}>Storyboard Studio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          {['Features', 'Gallery', 'Pricing'].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: '14px', fontWeight: 500, color: '#5A5248', textDecoration: 'none' }}>{l}</a>
          ))}
          <button style={{ backgroundColor: '#C4724B', color: '#FFF', padding: '8px 24px', borderRadius: '9999px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Sign In
          </button>
        </div>
      </nav>
    );
  }

  // ── Workflow stepper variant ──
  const stepperWrap: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
  };

  const circleBase = (s: number): React.CSSProperties => {
    const isActive = s === step;
    const isCompleted = completedSteps.includes(s as AppStep);
    return {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 700,
      flexShrink: 0,
      border: isActive ? '2px solid #C4724B' : isCompleted ? '2px solid #7A8B6F' : '2px solid #D8CDBE',
      backgroundColor: isActive ? '#C4724B' : isCompleted ? '#7A8B6F' : 'transparent',
      color: isActive || isCompleted ? '#FFFFFF' : '#8A7E72',
    };
  };

  const stepLabel = (s: number): React.CSSProperties => {
    const isActive = s === step;
    const isCompleted = completedSteps.includes(s as AppStep);
    return {
      fontSize: '11px',
      fontWeight: isActive ? 700 : 600,
      color: isActive ? '#2C2C2C' : isCompleted ? '#5A5248' : '#B0A696',
      letterSpacing: '0.06em',
      marginLeft: '6px',
      textTransform: 'uppercase',
    };
  };

  const connector = (leftStep: number, rightStep: number): React.CSSProperties => {
    const bothDone = completedSteps.includes(leftStep as AppStep) && completedSteps.includes(rightStep as AppStep);
    return {
      width: '40px',
      height: '2px',
      backgroundColor: bothDone ? '#7A8B6F' : '#D8CDBE',
      margin: '0 8px',
      flexShrink: 0,
    };
  };

  const rightSection: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const gearBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#8A7E72',
    padding: '4px',
  };

  const avatar: React.CSSProperties = {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#F0E2D0',
    border: '2px solid #D8CDBE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    color: '#8A7E72',
  };

  return (
    <nav style={nav}>
      {/* Left — Logo */}
      <div style={logo}>
        <span style={{ fontSize: '20px' }}>🎬</span>
        <span style={logoText}>STORYBOARD STUDIO</span>
      </div>

      {/* Center — Step progress */}
      <div style={stepperWrap}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s.num}>
            <div
              style={{ display: 'flex', alignItems: 'center' }}
              title={s.label}
            >
              <div style={circleBase(s.num)}>
                {completedSteps.includes(s.num as AppStep) && s.num !== step ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  s.num
                )}
              </div>
              <span style={stepLabel(s.num)}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div style={connector(s.num, STEPS[i + 1].num)} />}
          </React.Fragment>
        ))}
      </div>

      {/* Right — Settings + Avatar */}
      <div style={rightSection}>
        <button style={gearBtn} title="Settings">⚙️</button>
        <div style={avatar}>JD</div>
      </div>
    </nav>
  );
};

export default Navbar;

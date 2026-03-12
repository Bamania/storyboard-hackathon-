import React from 'react';

interface NavbarProps {
  /** If provided, renders the horizontal stepper navbar instead of landing nav links */
  step?: number;
}

const STEPS = [
  { num: 1, label: 'SCRIPT' },
  { num: 2, label: 'CAST' },
  { num: 3, label: 'SHOTS' },
  { num: 4, label: 'EXPORT' },
];

/**
 * Navbar — Fixed top navigation bar.
 * Landing page: logo + Features/Gallery/Pricing + Sign In
 * Workflow pages: logo + horizontal step progress + settings + avatar
 */
const Navbar: React.FC<NavbarProps> = ({ step }) => {
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
    backgroundColor: 'transparent',
    backdropFilter: 'blur(10px) saturate(10%)',
    WebkitBackdropFilter: 'blur(10px) saturate(10%)',
    border: '1px solid rgba(255, 255, 255, 0.35)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.4)',
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
    const isCompleted = s < step;
    const isFuture = s > step;
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
    const isCompleted = s < step;
    return {
      fontSize: '11px',
      fontWeight: isActive ? 700 : 600,
      color: isActive ? '#2C2C2C' : isCompleted ? '#5A5248' : '#B0A696',
      letterSpacing: '0.06em',
      marginLeft: '6px',
      textTransform: 'uppercase',
    };
  };

  const connector: React.CSSProperties = {
    width: '40px',
    height: '2px',
    backgroundColor: '#D8CDBE',
    margin: '0 8px',
    flexShrink: 0,
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
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={circleBase(s.num)}>{s.num}</div>
              <span style={stepLabel(s.num)}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div style={connector} />}
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

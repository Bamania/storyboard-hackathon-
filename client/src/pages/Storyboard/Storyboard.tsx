import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { useNavigationStore } from '../../stores/navigationStore';
import { useScreenplayStore } from '../../stores/screenplayStore';
import { mockScenes } from '../../data/mockScreenplay';

/* ── Mock storyboard frames ── */
interface StoryFrame {
  id: string;
  sceneId: string;
  sceneNumber: number;
  frameNumber: number;
  title: string;
  description: string;
  lens: string;
  aperture: string;
  colorTemp: string;
}

const SCENE_COLORS: Record<number, string> = {
  1: '#8B3A2A',
  2: '#2B3D54',
  3: '#4A5A3C',
  4: '#6B5B3C',
  5: '#5A6B5A',
  6: '#3D4B5A',
  7: '#6B4A5A',
  8: '#4A5A3C',
};

const MOCK_FRAMES: StoryFrame[] = [
  { id: 'f1', sceneId: 'scene-1', sceneNumber: 1, frameNumber: 1, title: 'City Wide', description: 'Rain-slicked street, neon...', lens: '24mm', aperture: 'f/2.8', colorTemp: '3200K' },
  { id: 'f2', sceneId: 'scene-1', sceneNumber: 1, frameNumber: 2, title: 'Tracking Entrance', description: 'Protagonist enters frame from left', lens: '35mm', aperture: 'f/2.0', colorTemp: '3200K' },
  { id: 'f3', sceneId: 'scene-2', sceneNumber: 2, frameNumber: 3, title: 'Close Up', description: 'Golden amber backlighting', lens: '85mm', aperture: 'f/1.4', colorTemp: '2800K' },
  { id: 'f4', sceneId: 'scene-2', sceneNumber: 2, frameNumber: 4, title: 'Over the Shoulder', description: 'Barman pouring drink', lens: '50mm', aperture: 'f/1.8', colorTemp: '2800K' },
  { id: 'f5', sceneId: 'scene-5', sceneNumber: 5, frameNumber: 5, title: 'Top Down', description: 'Harsh clinical fluorescent light', lens: '18mm', aperture: 'f/4.0', colorTemp: '5600K' },
  { id: 'f6', sceneId: 'scene-5', sceneNumber: 5, frameNumber: 6, title: 'Extreme CU', description: 'Eye reflecting swinging lamp', lens: '100mm', aperture: 'f/2.8', colorTemp: '5600K' },
  { id: 'f7', sceneId: 'scene-8', sceneNumber: 8, frameNumber: 7, title: 'Establishing Shot', description: 'Sun breaking over horizon', lens: '24mm', aperture: 'f/11', colorTemp: '4500K' },
  { id: 'f8', sceneId: 'scene-8', sceneNumber: 8, frameNumber: 8, title: 'Silhouette', description: 'Walking away into the light', lens: '50mm', aperture: 'f/1.2', colorTemp: '4500K' },
  { id: 'f9', sceneId: 'scene-1', sceneNumber: 1, frameNumber: 9, title: 'Low Angle', description: 'Rain hitting boots on pavement', lens: '35mm', aperture: 'f/4.0', colorTemp: '3200K' },
  { id: 'f10', sceneId: 'scene-2', sceneNumber: 2, frameNumber: 10, title: 'Reaction Shot', description: 'Sudden realization', lens: '85mm', aperture: 'f/1.8', colorTemp: '2800K' },
  { id: 'f11', sceneId: 'scene-5', sceneNumber: 5, frameNumber: 11, title: 'Profile', description: 'Shadow split across face', lens: '50mm', aperture: 'f/2.0', colorTemp: '5600K' },
  { id: 'f12', sceneId: 'scene-8', sceneNumber: 8, frameNumber: 12, title: 'Final Horizon', description: 'Wide sweep of the landscape', lens: '14mm', aperture: 'f/8.0', colorTemp: '4500K' },
];

const Storyboard: React.FC = () => {
  const { completeStep } = useNavigationStore();
  const { scenes } = useScreenplayStore();
  useEffect(() => { completeStep(4); }, []);

  const sceneList = scenes.length > 0 ? scenes : mockScenes;

  /* Derive unique locations for filter pills */
  const locations = Array.from(new Set(sceneList.map((s) => s.location)));

  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredFrames = activeFilter
    ? MOCK_FRAMES.filter((f) => {
        const scene = sceneList.find((s) => s.id === f.sceneId);
        return scene?.location === activeFilter;
      })
    : MOCK_FRAMES;

  const totalFrames = MOCK_FRAMES.length;
  const totalScenes = new Set(MOCK_FRAMES.map((f) => f.sceneNumber)).size;

  /* ── Styles ── */
  const page: React.CSSProperties = {
    minHeight: '100vh',
    backgroundImage: 'url(/images/background.avif)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const contentArea: React.CSSProperties = {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '90px 32px 48px',
  };

  const headerRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: '2.4rem',
    fontStyle: 'italic',
    color: '#2C2C2C',
    margin: '0 0 4px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#5A5248',
    fontWeight: 500,
    margin: 0,
  };

  const exportBtn: React.CSSProperties = {
    padding: '10px 28px',
    backgroundColor: '#C4724B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const pillRow: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '28px',
  };

  const pillStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '7px 20px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: isActive ? '#C4724B' : 'rgba(255,255,255,0.18)',
    backdropFilter: isActive ? 'none' : 'blur(12px)',
    WebkitBackdropFilter: isActive ? 'none' : 'blur(12px)',
    color: isActive ? '#FFFFFF' : '#5A5248',
    transition: 'all 0.15s ease',
    fontFamily: '"Inter", system-ui, sans-serif',
    letterSpacing: '0.02em',
    textTransform: 'capitalize' as const,
  });

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
    gap: '16px',
    marginBottom: '48px',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.2)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };

  const placeholderStyle = (sceneNum: number): React.CSSProperties => ({
    width: '100%',
    height: '120px',
    backgroundColor: SCENE_COLORS[sceneNum] || '#4A5A5A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  });

  const badgeStyle = (sceneNum: number): React.CSSProperties => ({
    position: 'absolute',
    top: '8px',
    left: '8px',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    backgroundColor: SCENE_COLORS[sceneNum] || '#4A5A5A',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
  });

  const frameNumStyle: React.CSSProperties = {
    fontSize: '2.2rem',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const cardBodyStyle: React.CSSProperties = {
    padding: '12px 14px 14px',
  };

  const frameTitleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 700,
    color: '#2C2C2C',
    margin: '0 0 3px',
  };

  const frameDescStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#5A5248',
    margin: '0 0 10px',
    lineHeight: 1.4,
  };

  const techRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    fontSize: '10px',
    fontWeight: 600,
    color: '#8A7E72',
    letterSpacing: '0.02em',
  };

  const footerStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: '11px',
    color: '#8A7E72',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '16px 0 32px',
  };

  return (
    <div style={page}>
      <Navbar step={4} />

      <div style={contentArea}>
        {/* Header */}
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>Storyboard</h1>
            <p style={subtitleStyle}>{totalFrames} frames · {totalScenes} scenes</p>
          </div>
          <button style={exportBtn}>Export</button>
        </div>

        {/* Filter pills */}
        <div style={pillRow}>
          <button
            style={pillStyle(activeFilter === null)}
            onClick={() => setActiveFilter(null)}
          >
            All
          </button>
          {locations.map((loc) => (
            <button
              key={loc}
              style={pillStyle(activeFilter === loc)}
              onClick={() => setActiveFilter(loc)}
            >
              {loc.charAt(0) + loc.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Frame grid */}
        <div style={gridStyle}>
          {filteredFrames.map((frame) => (
            <div
              key={frame.id}
              style={cardStyle}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              {/* Color placeholder */}
              <div style={placeholderStyle(frame.sceneNumber)}>
                <span style={badgeStyle(frame.sceneNumber)}>SC{frame.sceneNumber}</span>
                <span style={frameNumStyle}>
                  {String(frame.frameNumber).padStart(2, '0')}
                </span>
              </div>

              {/* Card body */}
              <div style={cardBodyStyle}>
                <p style={frameTitleStyle}>{frame.title}</p>
                <p style={frameDescStyle}>{frame.description}</p>
                <div style={techRowStyle}>
                  <span>{frame.lens}</span>
                  <span>{frame.aperture}</span>
                  <span>{frame.colorTemp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          © 2024 Storyboard Studio — Cinematic Pre-Production Tool
        </div>
      </div>
    </div>
  );
};

export default Storyboard;

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { useNavigationStore } from '../../stores/navigationStore';
import { useScreenplayStore } from '../../stores/screenplayStore';
import { mockScenes } from '../../data/mockScreenplay';

/* ── Types ── */
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
  characters: string[];
}

/* ── Scene colours ── */
const SC: Record<number, string> = {
  1: '#8B3A2A', 2: '#2B3D54', 3: '#4A5A3C', 4: '#6B5B3C',
  5: '#5A6B5A', 6: '#3D4B5A', 7: '#6B4A5A', 8: '#4A5A3C',
};

/* ── Mock frames ── */
const FRAMES: StoryFrame[] = [
  { id: 'f1',  sceneId: 'scene-1', sceneNumber: 1, frameNumber: 1,  title: 'Opening Wide',      description: 'Rain-slicked street, neon reflections',    lens: '24mm',  aperture: 'f/2.8', colorTemp: '3200K', characters: ['MARCUS'] },
  { id: 'f2',  sceneId: 'scene-1', sceneNumber: 1, frameNumber: 2,  title: 'Detective MCU',     description: 'Protagonist enters frame from left',       lens: '35mm',  aperture: 'f/2.0', colorTemp: '3200K', characters: ['MARCUS'] },
  { id: 'f3',  sceneId: 'scene-2', sceneNumber: 2, frameNumber: 3,  title: 'Meeting Two Shot',  description: 'Golden amber backlighting',                lens: '85mm',  aperture: 'f/1.4', colorTemp: '2800K', characters: ['MARCUS','ELARA'] },
  { id: 'f4',  sceneId: 'scene-3', sceneNumber: 3, frameNumber: 4,  title: 'Glare CU',          description: 'Barman pouring drink',                     lens: '50mm',  aperture: 'f/1.8', colorTemp: '2800K', characters: ['MARCUS'] },
  { id: 'f5',  sceneId: 'scene-5', sceneNumber: 5, frameNumber: 5,  title: 'Interrogation',     description: 'Harsh clinical fluorescent light',          lens: '18mm',  aperture: 'f/4.0', colorTemp: '5600K', characters: ['MARCUS','REYES'] },
  { id: 'f6',  sceneId: 'scene-6', sceneNumber: 6, frameNumber: 6,  title: 'Viktors Tell',      description: 'Eye reflecting swinging lamp',              lens: '100mm', aperture: 'f/2.8', colorTemp: '5600K', characters: ['ASHFORD'] },
  { id: 'f7',  sceneId: 'scene-8', sceneNumber: 8, frameNumber: 7,  title: 'Establishing Shot', description: 'Sun breaking over horizon',                 lens: '24mm',  aperture: 'f/11',  colorTemp: '4500K', characters: ['ELARA'] },
  { id: 'f8',  sceneId: 'scene-8', sceneNumber: 8, frameNumber: 8,  title: 'Silhouette',        description: 'Walking away into the light',               lens: '50mm',  aperture: 'f/1.2', colorTemp: '4500K', characters: ['MARCUS'] },
  { id: 'f9',  sceneId: 'scene-1', sceneNumber: 1, frameNumber: 9,  title: 'Low Angle',         description: 'Rain hitting boots on pavement',            lens: '35mm',  aperture: 'f/4.0', colorTemp: '3200K', characters: ['MARCUS'] },
  { id: 'f10', sceneId: 'scene-2', sceneNumber: 2, frameNumber: 10, title: 'Reaction Shot',     description: 'Sudden realization',                        lens: '85mm',  aperture: 'f/1.8', colorTemp: '2800K', characters: ['ELARA'] },
  { id: 'f11', sceneId: 'scene-5', sceneNumber: 5, frameNumber: 11, title: 'Profile',           description: 'Shadow split across face',                  lens: '50mm',  aperture: 'f/2.0', colorTemp: '5600K', characters: ['REYES'] },
  { id: 'f12', sceneId: 'scene-8', sceneNumber: 8, frameNumber: 12, title: 'Final Horizon',     description: 'Wide sweep of the landscape',               lens: '14mm',  aperture: 'f/8.0', colorTemp: '4500K', characters: ['MARCUS'] },
];

/* ── Glassmorphism helper ── */
const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.18)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.2)',
  ...extra,
});

const Storyboard: React.FC = () => {
  const { completeStep } = useNavigationStore();
  const { scenes } = useScreenplayStore();
  useEffect(() => { completeStep(4); }, []);

  const sceneList = scenes.length > 0 ? scenes : mockScenes;
  const locations = Array.from(new Set(sceneList.map((s) => s.location)));

  /* ── Grid-view state ── */
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  /* ── Frame-editor state ── */
  const [selectedFrame, setSelectedFrame] = useState<StoryFrame | null>(null);
  const [showOverlays, setShowOverlays] = useState(false);
  const [showDeepEdit, setShowDeepEdit] = useState(false);

  /* ── Overlay values ── */
  const [colorTemp, setColorTemp] = useState(4200);
  const [contrast, setContrast] = useState(70);
  const [volumetrics, setVolumetrics] = useState(30);
  const [lightQuality, setLightQuality] = useState('Medium-Hard');
  const [colorGrade, setColorGrade] = useState('Neutral');
  const [motionBlur, setMotionBlur] = useState('None');

  /* ── Deep-edit values ── */
  const [shotSize, setShotSize] = useState('Wide');
  const [camAngle, setCamAngle] = useState('Eye Level');
  const [focalLength, setFocalLength] = useState(35);
  const [apertureVal, setApertureVal] = useState(2);
  const [keyLight, setKeyLight] = useState('Side 45');
  const [era, setEra] = useState('Contemporary');
  const [setCondition, setSetCondition] = useState('Wet streets');
  const [movement, setMovement] = useState('Static');
  const [compGrid, setCompGrid] = useState('Rule of Thirds');
  const [eyeline, setEyeline] = useState('Off-frame left');
  const [headroom, setHeadroom] = useState('Standard');

  /* ── Derived ── */
  const filteredFrames = activeFilter
    ? FRAMES.filter((f) => {
        const scene = sceneList.find((s) => s.id === f.sceneId);
        return scene?.location === activeFilter;
      })
    : FRAMES;
  const totalFrames = FRAMES.length;
  const totalScenes = new Set(FRAMES.map((f) => f.sceneNumber)).size;

  const openEditor = (frame: StoryFrame) => {
    setSelectedFrame(frame);
    setShowOverlays(false);
    setShowDeepEdit(false);
  };

  /* ═══════════════════════════════════════════════════
     FRAME EDITOR VIEW
     ═══════════════════════════════════════════════════ */
  if (selectedFrame) {
    const fr = selectedFrame;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        backgroundImage: 'url(/images/background.avif)',
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
        fontFamily: '"Inter", system-ui, sans-serif',
      }}>
        {/* ── TOP BAR ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px',
          ...glass({ borderRadius: '0 0 14px 14px', borderTop: 'none' }),
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setSelectedFrame(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '18px', color: '#5A5248', padding: '4px 8px',
              }}
              title="Back to grid"
            >&#8592;</button>
            <span style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 700, fontSize: '18px', color: '#2C2C2C', fontStyle: 'italic',
            }}>Frame Editor</span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#5A5248' }}>
              SC{fr.sceneNumber} &#8212; {fr.title}
            </span>
            <span style={{
              width: '24px', height: '24px', borderRadius: '50%',
              backgroundColor: '#C4724B', color: '#FFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700,
            }}>{fr.frameNumber}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              style={{
                padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: 'none', letterSpacing: '0.02em',
                background: showOverlays ? '#7A8B6F' : 'rgba(255,255,255,0.15)',
                color: showOverlays ? '#FFF' : '#5A5248', transition: 'all 0.15s ease',
              }}
            >{showOverlays ? '\u25CF' : '\u25CB'} Overlays</button>
            <button
              onClick={() => setShowDeepEdit(!showDeepEdit)}
              style={{
                padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: 'none', letterSpacing: '0.02em',
                background: showDeepEdit ? '#C4724B' : 'rgba(255,255,255,0.15)',
                color: showDeepEdit ? '#FFF' : '#5A5248', transition: 'all 0.15s ease',
              }}
            >{showDeepEdit ? '\u25CF' : '+'} Deep Edit</button>
          </div>
        </div>

        {/* ── MAIN BODY ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── LEFT SIDEBAR: frame thumbnails ── */}
          <div style={{
            width: '80px', padding: '12px 8px',
            overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px',
            ...glass({ borderRadius: 0, borderLeft: 'none', borderTop: 'none', borderBottom: 'none' }),
          }}>
            {FRAMES.map((f) => (
              <div
                key={f.id}
                onClick={() => openEditor(f)}
                style={{
                  borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
                  border: f.id === fr.id ? '2px solid #C4724B' : '2px solid transparent',
                  transition: 'border 0.15s', flexShrink: 0,
                }}
              >
                <div style={{
                  height: '40px', backgroundColor: SC[f.sceneNumber] || '#4A5A5A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute', top: '3px', left: '3px',
                    fontSize: '7px', fontWeight: 700, color: '#FFF',
                    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: '3px',
                    padding: '1px 4px', letterSpacing: '0.04em',
                  }}>SC{f.sceneNumber}</span>
                  <span style={{
                    position: 'absolute', top: '3px', right: '3px',
                    display: 'flex', gap: '2px',
                  }}>
                    {f.characters.map((_, ci) => (
                      <span key={ci} style={{
                        width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#C4724B',
                      }} />
                    ))}
                  </span>
                </div>
                <div style={{
                  fontSize: '8px', fontWeight: 600, color: '#5A5248',
                  padding: '4px 4px 5px', textAlign: 'center',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                }}>{f.title}</div>
              </div>
            ))}
          </div>

          {/* ── CENTER: preview + overlays ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'auto' }}>
            <div style={{ flex: 1, position: 'relative' }}>

              {/* OVERLAY CONTROLS */}
              {showOverlays && (
                <div style={{
                  position: 'absolute', top: '12px', left: '12px', right: '12px',
                  zIndex: 20, display: 'flex', flexWrap: 'wrap', gap: '12px',
                  padding: '16px', borderRadius: '14px',
                  ...glass({ borderRadius: '14px' }),
                }}>
                  <div style={{
                    width: '100%', fontSize: '10px', fontWeight: 700,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: '#C4724B', marginBottom: '4px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span style={{ color: '#7A8B6F', fontSize: '8px' }}>{'\u25CF'}</span> OVERLAY CONTROLS &#8212; INSTANT
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '80px' }}>Color Temp</span>
                      <input type="range" min={2000} max={8000} value={colorTemp} onChange={(e) => setColorTemp(+e.target.value)} style={{ flex: 1, accentColor: '#C4724B', cursor: 'pointer' }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#2C2C2C', minWidth: '42px', textAlign: 'right' }}>{colorTemp}K</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '80px' }}>Contrast</span>
                      <input type="range" min={0} max={100} value={contrast} onChange={(e) => setContrast(+e.target.value)} style={{ flex: 1, accentColor: '#C4724B', cursor: 'pointer' }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#2C2C2C', minWidth: '42px', textAlign: 'right' }}>{contrast}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '80px' }}>Volumetrics</span>
                      <input type="range" min={0} max={100} value={volumetrics} onChange={(e) => setVolumetrics(+e.target.value)} style={{ flex: 1, accentColor: '#C4724B', cursor: 'pointer' }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#2C2C2C', minWidth: '42px', textAlign: 'right' }}>{volumetrics}%</span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px', borderRadius: '10px',
                    ...glass({ borderRadius: '10px' }),
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Light Quality</span>
                    <select value={lightQuality} onChange={(e) => setLightQuality(e.target.value)} style={{
                      background: 'none', border: 'none', outline: 'none',
                      fontSize: '13px', fontWeight: 600, color: '#2C2C2C', cursor: 'pointer',
                      fontFamily: '"Inter", system-ui, sans-serif',
                    }}>
                      <option>Soft</option><option>Medium-Soft</option><option>Medium-Hard</option><option>Hard</option>
                    </select>
                  </div>
                </div>
              )}

              {/* BOTTOM OVERLAY DROPDOWNS */}
              {showOverlays && (
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '12px', zIndex: 20 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px', borderRadius: '10px',
                    ...glass({ borderRadius: '10px' }),
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Color Grade / LUT</span>
                    <select value={colorGrade} onChange={(e) => setColorGrade(e.target.value)} style={{
                      background: 'none', border: 'none', outline: 'none',
                      fontSize: '13px', fontWeight: 600, color: '#2C2C2C', cursor: 'pointer',
                      fontFamily: '"Inter", system-ui, sans-serif',
                    }}>
                      <option>Neutral</option><option>Cool Noir</option><option>Warm Amber</option><option>Bleach Bypass</option><option>Teal &amp; Orange</option>
                    </select>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px', borderRadius: '10px',
                    ...glass({ borderRadius: '10px' }),
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Motion Blur</span>
                    <select value={motionBlur} onChange={(e) => setMotionBlur(e.target.value)} style={{
                      background: 'none', border: 'none', outline: 'none',
                      fontSize: '13px', fontWeight: 600, color: '#2C2C2C', cursor: 'pointer',
                      fontFamily: '"Inter", system-ui, sans-serif',
                    }}>
                      <option>None</option><option>Low</option><option>Medium</option><option>High</option>
                    </select>
                  </div>
                </div>
              )}

              {/* FULL FRAME PREVIEW */}
              <div style={{
                height: '100%',
                backgroundColor: SC[fr.sceneNumber] || '#3A3A3A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                {/* Placeholder for AI-generated image */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '120px', height: '90px', borderRadius: '10px', margin: '0 auto 14px',
                    backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '36px' }}>{'\uD83D\uDDBC'}</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', fontWeight: 600, letterSpacing: '0.06em' }}>
                    FRAME {fr.frameNumber}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginTop: '6px', maxWidth: '300px' }}>
                    {fr.description}
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM TECH BAR */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '24px', padding: '10px 20px',
              fontSize: '11px', fontWeight: 600, color: '#8A7E72',
              ...glass({ borderRadius: 0 }),
            }}>
              <span>{'\uD83C\uDFAF'} {fr.lens}</span>
              <span>{'\uD83D\uDCF7'} {fr.aperture}</span>
              <span>{'\uD83C\uDF21'} {fr.colorTemp}</span>
              <span>{'\u23F1'} {fr.sceneNumber > 4 ? '3.2s' : '2.8s'}</span>
            </div>
          </div>

          {/* ── DEEP EDIT PANEL ── */}
          {showDeepEdit && (
            <div style={{
              width: '280px', overflowY: 'auto', padding: '20px 16px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              ...glass({ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderRight: 'none' }),
            }}>
              <div>
                <div style={{
                  fontSize: '12px', fontWeight: 700, color: '#C4724B',
                  letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px',
                  marginBottom: '4px',
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C4724B' }} />
                  DEEP EDIT
                </div>
                <p style={{ fontSize: '11px', color: '#8A7E72', lineHeight: 1.5, margin: '0 0 8px' }}>
                  These parameters change the image structure. Edits queue up and regenerate together.
                </p>
              </div>

              {/* Shot Size */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C4724B', flexShrink: 0 }} />
                  #7 Shot Size / Framing
                </div>
                <select value={shotSize} onChange={(e) => setShotSize(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  color: '#2C2C2C', cursor: 'pointer', fontFamily: '"Inter", system-ui, sans-serif',
                  appearance: 'none', paddingRight: '32px',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238A7E72'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                  ...glass({ borderRadius: '8px' }),
                }}>
                  <option>ECU</option><option>CU</option><option>MCU</option><option>MS</option><option>Wide</option><option>EWS</option>
                </select>
              </div>

              {/* Camera Angle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C4724B', flexShrink: 0 }} />
                  #4 Camera Angle
                </div>
                <select value={camAngle} onChange={(e) => setCamAngle(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  color: '#2C2C2C', cursor: 'pointer', fontFamily: '"Inter", system-ui, sans-serif',
                  appearance: 'none', paddingRight: '32px',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238A7E72'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                  ...glass({ borderRadius: '8px' }),
                }}>
                  <option>Birds Eye</option><option>High</option><option>Eye Level</option><option>Low</option><option>Worms Eye</option>
                </select>
              </div>

              {/* Focal Length slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C4724B', flexShrink: 0 }} />
                  #1 Focal Length
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="range" min={14} max={200} value={focalLength} onChange={(e) => setFocalLength(+e.target.value)} style={{ flex: 1, accentColor: '#C4724B', cursor: 'pointer' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#2C2C2C', minWidth: '42px', textAlign: 'right' }}>{focalLength}mm</span>
                </div>
              </div>

              {/* Aperture slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C4724B', flexShrink: 0 }} />
                  #2 Aperture
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="range" min={1} max={22} step={0.1} value={apertureVal} onChange={(e) => setApertureVal(+e.target.value)} style={{ flex: 1, accentColor: '#C4724B', cursor: 'pointer' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#2C2C2C', minWidth: '42px', textAlign: 'right' }}>f/{apertureVal}</span>
                </div>
              </div>

              {/* Key Light Dir */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C4724B', flexShrink: 0 }} />
                  #12 Key Light Dir
                </div>
                <select value={keyLight} onChange={(e) => setKeyLight(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  color: '#2C2C2C', cursor: 'pointer', fontFamily: '"Inter", system-ui, sans-serif',
                  appearance: 'none', paddingRight: '32px',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238A7E72'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                  ...glass({ borderRadius: '8px' }),
                }}>
                  <option>Front</option><option>Side 45</option><option>Side 90</option><option>Back</option><option>Top</option><option>Under</option>
                </select>
              </div>

              {/* Era */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C4724B', flexShrink: 0 }} />
                  #23 Era / Period
                </div>
                <select value={era} onChange={(e) => setEra(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  color: '#2C2C2C', cursor: 'pointer', fontFamily: '"Inter", system-ui, sans-serif',
                  appearance: 'none', paddingRight: '32px',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238A7E72'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                  ...glass({ borderRadius: '8px' }),
                }}>
                  <option>1920s</option><option>1940s Noir</option><option>1960s</option><option>1980s</option><option>Contemporary</option><option>Near Future</option>
                </select>
              </div>

              {/* Set Condition */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C4724B', flexShrink: 0 }} />
                  #22 Set Condition
                </div>
                <select value={setCondition} onChange={(e) => setSetCondition(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  color: '#2C2C2C', cursor: 'pointer', fontFamily: '"Inter", system-ui, sans-serif',
                  appearance: 'none', paddingRight: '32px',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238A7E72'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                  ...glass({ borderRadius: '8px' }),
                }}>
                  <option>Clean</option><option>Wet streets</option><option>Dusty</option><option>Foggy</option><option>Snowy</option><option>Debris</option>
                </select>
              </div>

              {/* Movement */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C4724B', flexShrink: 0 }} />
                  #25 Movement
                </div>
                <select value={movement} onChange={(e) => setMovement(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  color: '#2C2C2C', cursor: 'pointer', fontFamily: '"Inter", system-ui, sans-serif',
                  appearance: 'none', paddingRight: '32px',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238A7E72'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                  ...glass({ borderRadius: '8px' }),
                }}>
                  <option>Static</option><option>Slow Push</option><option>Pull Back</option><option>Pan Left</option><option>Pan Right</option><option>Tracking</option><option>Crane Up</option><option>Crane Down</option>
                </select>
              </div>

              {/* Comp Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C4724B', flexShrink: 0 }} />
                  #8 Comp Grid
                </div>
                <select value={compGrid} onChange={(e) => setCompGrid(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  color: '#2C2C2C', cursor: 'pointer', fontFamily: '"Inter", system-ui, sans-serif',
                  appearance: 'none', paddingRight: '32px',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238A7E72'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                  ...glass({ borderRadius: '8px' }),
                }}>
                  <option>Center</option><option>Rule of Thirds</option><option>Golden Ratio</option><option>Diagonal</option><option>Symmetry</option>
                </select>
              </div>

              {/* Eyeline Vector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C4724B', flexShrink: 0 }} />
                  #10 Eyeline Vector
                </div>
                <select value={eyeline} onChange={(e) => setEyeline(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  color: '#2C2C2C', cursor: 'pointer', fontFamily: '"Inter", system-ui, sans-serif',
                  appearance: 'none', paddingRight: '32px',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238A7E72'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                  ...glass({ borderRadius: '8px' }),
                }}>
                  <option>Direct to Camera</option><option>Off-frame left</option><option>Off-frame right</option><option>Down</option><option>Up</option>
                </select>
              </div>

              {/* Headroom */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#5A5248', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C4724B', flexShrink: 0 }} />
                  #11 Headroom
                </div>
                <select value={headroom} onChange={(e) => setHeadroom(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  color: '#2C2C2C', cursor: 'pointer', fontFamily: '"Inter", system-ui, sans-serif',
                  appearance: 'none', paddingRight: '32px',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238A7E72'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                  ...glass({ borderRadius: '8px' }),
                }}>
                  <option>Extreme Tight</option><option>Tight</option><option>Standard</option><option>Loose</option>
                </select>
              </div>
            </div>
          )}

          {/* ── RIGHT SIDEBAR: agent chat ── */}
          <div style={{
            width: '260px', padding: '16px',
            overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px',
            ...glass({ borderRadius: 0, borderRight: 'none', borderTop: 'none', borderBottom: 'none' }),
          }}>
            <div>
              <div style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#5A5248', marginBottom: '10px',
              }}>Agent Chat</div>
              <p style={{ fontSize: '11px', color: '#8A7E72', lineHeight: 1.6, margin: '0 0 8px' }}>
                @dp @dir @ed @pd &#8212; ask any crew member
              </p>
            </div>

            <div>
              <div style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#5A5248', marginBottom: '10px',
              }}>Characters in Frame</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {fr.characters.map((ch) => (
                  <span key={ch} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                    color: '#2C2C2C',
                    ...glass({ borderRadius: '8px' }),
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C4724B' }} />
                    {ch} {'\uD83D\uDD12'}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ flex: 1 }} />

            <div>
              <p style={{ fontSize: '11px', color: '#8A7E72', lineHeight: 1.6, margin: '0 0 8px' }}>
                Talk to your crew:<br />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#C4724B' }}>@dp</span> for light &amp; lens<br />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B8CA6' }}>@dir</span> for story &amp; framing<br />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#7A8B6F' }}>@ed</span> for pacing &amp; flow<br />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#C4A04B' }}>@pd</span> for world &amp; color
              </p>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', borderRadius: '12px',
              ...glass({ borderRadius: '12px' }),
            }}>
              <input
                type="text"
                placeholder="@dp make the light warmer..."
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: '12px', color: '#2C2C2C',
                  fontFamily: '"Inter", system-ui, sans-serif',
                }}
              />
              <button style={{
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: '#C4724B', border: 'none', cursor: 'pointer',
                color: '#FFF', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{'\u2191'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     GRID VIEW  (default)
     ═══════════════════════════════════════════════════ */
  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/images/background.avif)',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      <Navbar step={4} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '90px 32px 48px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{
              fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2.4rem',
              fontStyle: 'italic', color: '#2C2C2C', margin: '0 0 4px',
            }}>Storyboard</h1>
            <p style={{ fontSize: '13px', color: '#5A5248', fontWeight: 500, margin: 0 }}>
              {totalFrames} frames {'\u00B7'} {totalScenes} scenes
            </p>
          </div>
          <button style={{
            padding: '10px 28px', backgroundColor: '#C4724B', color: '#FFF',
            border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.02em', fontFamily: '"Inter", system-ui, sans-serif',
          }}>Export</button>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
          <button
            onClick={() => setActiveFilter(null)}
            style={{
              padding: '7px 20px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', border: 'none', letterSpacing: '0.02em',
              fontFamily: '"Inter", system-ui, sans-serif',
              textTransform: 'capitalize',
              background: activeFilter === null ? '#C4724B' : 'rgba(255,255,255,0.18)',
              backdropFilter: activeFilter === null ? 'none' : 'blur(12px)',
              color: activeFilter === null ? '#FFF' : '#5A5248',
              transition: 'all 0.15s ease',
            }}
          >All</button>
          {locations.map((loc) => (
            <button
              key={loc}
              onClick={() => setActiveFilter(loc)}
              style={{
                padding: '7px 20px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: 'none', letterSpacing: '0.02em',
                fontFamily: '"Inter", system-ui, sans-serif',
                textTransform: 'capitalize',
                background: activeFilter === loc ? '#C4724B' : 'rgba(255,255,255,0.18)',
                backdropFilter: activeFilter === loc ? 'none' : 'blur(12px)',
                color: activeFilter === loc ? '#FFF' : '#5A5248',
                transition: 'all 0.15s ease',
              }}
            >{loc.charAt(0) + loc.slice(1).toLowerCase()}</button>
          ))}
        </div>

        {/* Frame grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
          gap: '16px', marginBottom: '48px',
        }}>
          {filteredFrames.map((frame) => (
            <div
              key={frame.id}
              onClick={() => openEditor(frame)}
              style={{
                ...glass({ borderRadius: '14px', overflow: 'hidden', cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease' }),
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '100%', height: '120px',
                backgroundColor: SC[frame.sceneNumber] || '#4A5A5A',
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              }}>
                <span style={{
                  position: 'absolute', top: '8px', left: '8px', padding: '2px 8px',
                  borderRadius: '6px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
                  backgroundColor: SC[frame.sceneNumber] || '#4A5A5A', color: '#FFF',
                  border: '1px solid rgba(255,255,255,0.3)', textTransform: 'uppercase',
                }}>SC{frame.sceneNumber}</span>
                <span style={{
                  fontSize: '2.2rem', fontWeight: 300, color: 'rgba(255,255,255,0.35)',
                  fontFamily: '"Inter", system-ui, sans-serif',
                }}>{String(frame.frameNumber).padStart(2, '0')}</span>
              </div>
              <div style={{ padding: '12px 14px 14px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#2C2C2C', margin: '0 0 3px' }}>{frame.title}</p>
                <p style={{ fontSize: '11px', color: '#5A5248', margin: '0 0 10px', lineHeight: 1.4 }}>{frame.description}</p>
                <div style={{ display: 'flex', gap: '8px', fontSize: '10px', fontWeight: 600, color: '#8A7E72', letterSpacing: '0.02em' }}>
                  <span>{frame.lens}</span>
                  <span>{frame.aperture}</span>
                  <span>{frame.colorTemp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          textAlign: 'center', fontSize: '11px', color: '#8A7E72',
          letterSpacing: '0.12em', textTransform: 'uppercase', padding: '16px 0 32px',
        }}>{'\u00A9'} 2024 Storyboard Studio {'\u2014'} Cinematic Pre-Production Tool</div>
      </div>
    </div>
  );
};

export default Storyboard;

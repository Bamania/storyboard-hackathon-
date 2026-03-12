import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { useScreenplayStore } from '../../stores/screenplayStore';
import { useShotStore } from '../../stores/shotStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { agentColors } from '../../theme/tokens';
import type { AgentRole } from '../../types';

/**
 * Page 3 — Shot Design
 * Crew debates per scene: 4 agents analyse each scene and provide
 * shot notes. The user can navigate scenes, highlight agent notes,
 * and add production notes via a chat-style input.
 */

/* ── Mock crew debate data per scene ── */
interface CrewNote {
  agent: AgentRole;
  text: string;
  approved?: boolean;
}

const CREW_NOTES: Record<string, CrewNote[]> = {
  'scene-1': [
    { agent: 'director', text: 'Open on a wide establishing shot — let the city breathe. Then a slow push into Marcus under the street lamp. 3 shots minimum.' },
    { agent: 'cinematographer', text: 'Wide 35mm anamorphic for the opener. Push-in on a 50mm. Neon reflections in puddles — low camera, dolly level.' },
    { agent: 'editor', text: 'Pacing is slow here — let it linger. The V.O. carries the mood. Cut only on the cigarette flick.' },
    { agent: 'productionDesigner', text: 'Wet pavement, neon signage (magenta + cyan). Period-appropriate street lamp. Trash and puddles for texture.' },
  ],
  'scene-2': [
    { agent: 'director', text: 'Intimate scene — shot/reverse-shot for the dialogue. Elara has the power here; frame her slightly higher.' },
    { agent: 'cinematographer', text: '85mm portrait lens for close-ups. Practical lights only — warm candle glow from the table. Shallow depth of field.' },
    { agent: 'editor', text: 'Dialogue-driven. Standard coverage — wide, two mediums, two close-ups. Keep rhythm tight on the banter.' },
    { agent: 'productionDesigner', text: 'Jazz bar interior: dark wood, brass fixtures, red leather booths. Saxophone player staged in soft backlight.' },
  ],
  'scene-3': [
    { agent: 'director', text: 'Transition scene — 2 shots. Tracking Cole through alleys, then static in the car.' },
    { agent: 'cinematographer', text: 'Tracking at 28mm handheld for gritty energy. Car interior at 50mm, dashboard-mounted.' },
    { agent: 'editor', text: 'Quick scene — keeps momentum. Alley tracking can be one continuous take.', approved: true },
    { agent: 'productionDesigner', text: 'Alley: wet brick, single floodlight, steam. Car: dark interior, blue camera screen glow.', approved: true },
  ],
  'scene-4': [
    { agent: 'director', text: 'Dawn light is the character here. Marcus is small against the industrial landscape. One wide, one medium.' },
    { agent: 'cinematographer', text: 'Magic hour shoot. 24mm wide for scale. Let natural light do the heavy lifting — golden backlight.' },
    { agent: 'editor', text: 'Contemplative beat. Hold on the wide for 8+ seconds before cutting to medium.' },
    { agent: 'productionDesigner', text: 'Cargo containers as monoliths. Rust, peeling paint. Seagulls for ambient sound design.' },
  ],
  'scene-5': [
    { agent: 'director', text: 'Office politics scene. Reyes is authority — she stays standing while Marcus sits. Over-the-shoulder coverage.' },
    { agent: 'cinematographer', text: 'Fluorescent overhead — unflattering on purpose. 40mm for OTS. Slight low angle on Reyes.' },
    { agent: 'editor', text: 'Cross-cut tension. Quick cuts between their faces. Build pace toward the reveal.' },
    { agent: 'productionDesigner', text: 'Precinct clutter: papers, coffee cups, old monitors. Reyes office has awards and a dead plant.' },
  ],
  'scene-6': [
    { agent: 'director', text: 'Power scene — Ashford owns the room. Wide reveal of the penthouse, then tight on the scotch glass. Marcus is framed small.' },
    { agent: 'cinematographer', text: '16mm wide for the reveal. Rack focus from skyline to Ashford. City lights as practical bokeh.' },
    { agent: 'editor', text: 'Slow reveal. Hold the wide, then cut to Ashford on his first line. Standard shot/reverse for dialogue.' },
    { agent: 'productionDesigner', text: 'Minimalist penthouse: marble, glass, single sculpture. City view is the set piece. Cool blue palette.' },
  ],
  'scene-7': [
    { agent: 'director', text: 'Isolation shot. Marcus alone with the city. Wide and still — let the wind carry the emotion.' },
    { agent: 'cinematographer', text: 'Drone wide pulling back to reveal the cityscape. 14mm for environmental depth. Wind-noise on audio.' },
    { agent: 'editor', text: 'One shot, one take if possible. No cuts needed. This is the visual thesis of loneliness.' },
    { agent: 'productionDesigner', text: 'Rooftop: water tower, antenna, gravel floor. City lights in every direction — warm amber below, cold sky above.' },
  ],
  'scene-8': [
    { agent: 'director', text: 'Closing mirror to Scene 2. Same bar, now empty. Elara alone — melancholy. End on a sustained wide.' },
    { agent: 'cinematographer', text: 'Same lens as Scene 2 (85mm) but now the bar is empty and cold. Single practical light on the piano.' },
    { agent: 'editor', text: 'Final scene — let it breathe. Piano note is the metronome. Fade to black on her last line.' },
    { agent: 'productionDesigner', text: 'Chairs stacked. House lights off. Single pool of light. Dust motes in the beam.' },
  ],
};

/* ── Agent display config ── */
const AGENT_CONFIG: { key: AgentRole; label: string; icon: string; color: string }[] = [
  { key: 'director', label: 'Director', icon: '🎬', color: agentColors.director },
  { key: 'cinematographer', label: 'Cinematographer', icon: '🎞', color: agentColors.cinematographer },
  { key: 'editor', label: 'Editor', icon: '✂', color: agentColors.editor },
  { key: 'productionDesigner', label: 'Production Designer', icon: '🏗', color: agentColors.productionDesigner },
];

const ShotGeneration: React.FC = () => {
  const { completeStep } = useNavigationStore();
  useEffect(() => { completeStep(3); }, []);
  const { scenes } = useScreenplayStore();
  const {
    currentSceneIndex,
    completedScenes,
    setCurrentScene,
    completeScene,
  } = useShotStore();

  const [selectedAgent, setSelectedAgent] = useState<AgentRole | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [userNotes, setUserNotes] = useState<Record<string, string[]>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // Use mock scenes if store is empty
  const sceneList = scenes.length > 0 ? scenes : [];
  const activeScene = sceneList[currentSceneIndex];
  const sceneId = activeScene?.id || `scene-${currentSceneIndex + 1}`;
  const notes = CREW_NOTES[sceneId] || CREW_NOTES['scene-1'] || [];

  // Auto-complete scenes up to current
  useEffect(() => {
    for (let i = 0; i < currentSceneIndex; i++) {
      if (!completedScenes.includes(i)) completeScene(i);
    }
  }, [currentSceneIndex]);

  const handleSceneClick = (idx: number) => {
    setCurrentScene(idx);
    setSelectedAgent(null);
  };

  const handleNoteSubmit = () => {
    if (!noteInput.trim()) return;
    setUserNotes((prev) => ({
      ...prev,
      [sceneId]: [...(prev[sceneId] || []), noteInput.trim()],
    }));
    setNoteInput('');
  };

  const filteredNotes = selectedAgent
    ? notes.filter((n) => n.agent === selectedAgent)
    : notes;

  const totalScenes = sceneList.length || 8;

  // ── Styles ──
  const page: React.CSSProperties = {
    minHeight: '100vh',
    backgroundImage: 'url(/images/background.avif)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    fontFamily: '"Inter", system-ui, sans-serif',
    paddingTop: 80,
  };

  const layout: React.CSSProperties = {
    display: 'flex',
    gap: 0,
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px 40px',
    minHeight: 'calc(100vh - 80px)',
  };

  /* ── Left sidebar ── */
  const sidebar: React.CSSProperties = {
    width: 220,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingRight: 20,
  };

  const sidebarCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 16,
    padding: '20px 18px',
  };

  /* ── Main content ── */
  const mainArea: React.CSSProperties = {
    flex: 1,
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  return (
    <div style={page}>
      <Navbar step={3} />

      <div style={layout}>
        {/* ════════════════════════════════
            LEFT SIDEBAR
           ════════════════════════════════ */}
        <div style={sidebar}>
          {/* Agent filter panel */}
          <div style={sidebarCard}>
            <h3
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 18,
                fontStyle: 'italic',
                fontWeight: 700,
                color: '#2C2C2C',
                margin: '0 0 4px',
              }}
            >
              Shot Design
            </h3>
            <p
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#8A7E72',
                textTransform: 'uppercase',
                margin: '0 0 16px',
              }}
            >
              CREW DEBATES PER SCENE
            </p>

            {AGENT_CONFIG.map((a) => {
              const isActive = selectedAgent === a.key;
              return (
                <button
                  key={a.key}
                  onClick={() =>
                    setSelectedAgent(isActive ? null : a.key)
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 12px',
                    border: 'none',
                    borderRadius: 10,
                    background: isActive
                      ? 'rgba(107,140,166,0.12)'
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 15 }}>{a.icon}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? a.color : '#5A5248',
                      fontFamily: '"Inter", system-ui, sans-serif',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scene list panel */}
          <div style={{ ...sidebarCard, flex: 1 }}>
            {Array.from({ length: totalScenes }, (_, i) => {
              const scene = sceneList[i];
              const isCompleted = completedScenes.includes(i);
              const isCurrent = i === currentSceneIndex;
              const isFuture = i > currentSceneIndex && !isCompleted;

              return (
                <button
                  key={i}
                  onClick={() => handleSceneClick(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: 8,
                    background: isCurrent
                      ? 'rgba(196,114,75,0.08)'
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    marginBottom: 2,
                  }}
                >
                  {/* Status dot */}
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: isCompleted
                        ? '2px solid #7A8B6F'
                        : isCurrent
                        ? '2px solid #C4724B'
                        : '2px solid #D0C5B4',
                      backgroundColor: isCompleted
                        ? '#7A8B6F'
                        : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted && (
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {isCurrent && (
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#C4724B',
                        }}
                      />
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isCurrent ? 700 : 400,
                      color: isFuture ? '#B0A696' : '#2C2C2C',
                      fontFamily: '"Inter", system-ui, sans-serif',
                      textAlign: 'left',
                    }}
                  >
                    {scene
                      ? `Scene ${scene.number}: ${scene.location.charAt(0) + scene.location.slice(1).toLowerCase()}`
                      : `Scene ${i + 1}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#5A5248',
                textTransform: 'uppercase',
              }}
            >
              PROGRESS
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#C4724B',
              }}
            >
              {completedScenes.length} of {totalScenes}
            </span>
          </div>
        </div>

        {/* ════════════════════════════════
            MAIN CONTENT AREA
           ════════════════════════════════ */}
        <div style={mainArea}>
          {/* Header bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 28px 16px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <h2
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: 13,
                fontWeight: 600,
                color: '#C4724B',
                letterSpacing: '0.04em',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              {activeScene?.slugLine || `SCENE ${currentSceneIndex + 1}`}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  color: '#8A7E72',
                  fontWeight: 500,
                }}
              >
                Scene Index
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fff',
                  backgroundColor: '#C4724B',
                  borderRadius: 6,
                  padding: '3px 10px',
                  letterSpacing: '0.04em',
                }}
              >
                {currentSceneIndex + 1}/{totalScenes}
              </span>
            </div>
          </div>

          {/* Crew notes */}
          <div
            ref={contentRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 28px',
            }}
          >
            {filteredNotes.map((note, idx) => {
              const agentCfg = AGENT_CONFIG.find((a) => a.key === note.agent);
              return (
                <div
                  key={`${note.agent}-${idx}`}
                  style={{
                    marginBottom: 28,
                  }}
                >
                  {/* Agent label */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: agentCfg?.color || '#999',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        color: agentCfg?.color || '#999',
                        textTransform: 'uppercase',
                      }}
                    >
                      {agentCfg?.label || note.agent}
                      {note.approved && (
                        <span style={{ marginLeft: 6, fontSize: 12 }}>✓</span>
                      )}
                    </span>
                  </div>

                  {/* Note text */}
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: '#2C2C2C',
                      margin: 0,
                      paddingLeft: 16,
                      fontFamily: '"Inter", system-ui, sans-serif',
                    }}
                  >
                    {note.text}
                    {note.approved && (
                      <span style={{ marginLeft: 6, color: '#8A7E72', fontSize: 13 }}>✓</span>
                    )}
                  </p>
                </div>
              );
            })}

            {/* User production notes for this scene */}
            {(userNotes[sceneId] || []).map((n, i) => (
              <div
                key={`user-${i}`}
                style={{
                  marginBottom: 20,
                  paddingLeft: 16,
                  borderLeft: '3px solid #D8CCBA',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: '#8A7E72',
                    textTransform: 'uppercase',
                  }}
                >
                  YOUR NOTE
                </span>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: '#2C2C2C',
                    margin: '4px 0 0',
                  }}
                >
                  {n}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShotGeneration;

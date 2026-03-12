import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { useCastStore } from '../../stores/castStore';
import { mockCharacters, getCrewFeedback, getVariants } from '../../data/mockCast';
import type { CrewFeedback, Variant } from '../../data/mockCast';
import { agents } from '../../theme/tokens';

/**
 * Page 3 — Cast Sheet  (3D Cylindrical Carousel Edition)
 *
 * Characters are displayed in a 3D coverflow carousel.
 * The active (front-facing) card's full details are shown in
 * a detail panel below. All regeneration, locking, and editing
 * happens in that panel.
 */

type CharPhase = 'idle' | 'regenerating' | 'feedback' | 'variants';

interface CharUIState {
  phase: CharPhase;
  feedbackMessages: CrewFeedback[];
  feedbackIndex: number;
  variants: Variant[];
  selectedVariant: string | null;
}

const INITIAL_UI: CharUIState = {
  phase: 'idle',
  feedbackMessages: [],
  feedbackIndex: 0,
  variants: [],
  selectedVariant: null,
};

/* ── 3D Carousel constants ── */
const CARD_W = 260;
const CARD_H = 380;
const CYLINDER_RADIUS = 380;
const ANGLE_STEP = 52; // degrees between adjacent cards
const BASE_Z = 80;     // translateZ for the front card

const CastSheet: React.FC = () => {
  const navigate = useNavigate();
  const {
    characters,
    setCharacters,
    updateCharacter,
    addCharacter,
    deleteCharacter,
    lockCharacter,
    unlockCharacter,
  } = useCastStore();
  const allLocked = characters.length > 0 && characters.every((c) => c.isLocked);

  /* ── State ── */
  const [uiState, setUIState] = useState<Record<string, CharUIState>>({});
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState<string | null>(null);
  const [mentionInput, setMentionInput] = useState('');
  const [showMentionFor, setShowMentionFor] = useState<string | null>(null);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [agentHighlight, setAgentHighlight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const mentionRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const wheelCooldown = useRef(false);
  const touchStartX = useRef(0);

  /* ── Init mock data ── */
  useEffect(() => {
    if (characters.length === 0) setCharacters(mockCharacters);
  }, []);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (characters.length <= 1) return;
      if (e.key === 'ArrowLeft')
        setActiveIndex((p) => (p - 1 + characters.length) % characters.length);
      if (e.key === 'ArrowRight')
        setActiveIndex((p) => (p + 1) % characters.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [characters.length]);

  /* ── Clamp activeIndex when characters shrink ── */
  useEffect(() => {
    if (activeIndex >= characters.length && characters.length > 0)
      setActiveIndex(characters.length - 1);
  }, [characters.length]);

  /* ── Mouse-wheel on carousel ── */
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || characters.length <= 1) return;
    const onWheel = (e: WheelEvent) => {
      // Only respond to horizontal scroll — ignore vertical (two-finger up/down)
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (wheelCooldown.current) return;
      wheelCooldown.current = true;
      setTimeout(() => { wheelCooldown.current = false; }, 550);
      if (e.deltaX > 0) setActiveIndex((p) => (p + 1) % characters.length);
      else setActiveIndex((p) => (p - 1 + characters.length) % characters.length);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [characters.length]);

  /* ── Helpers ── */
  const getUI = (id: string): CharUIState => uiState[id] || INITIAL_UI;
  const patchUI = (id: string, patch: Partial<CharUIState>) =>
    setUIState((prev) => ({ ...prev, [id]: { ...(prev[id] || INITIAL_UI), ...patch } }));

  /* ── Regeneration flow ── */
  const startRegenerate = (charId: string, charName: string) => {
    const feedback = getCrewFeedback(charName);
    const variants = getVariants(charName);
    patchUI(charId, {
      phase: 'regenerating', feedbackMessages: feedback,
      feedbackIndex: 0, variants, selectedVariant: null,
    });
    setTimeout(() => {
      patchUI(charId, { phase: 'feedback', feedbackIndex: 1 });
      setTimeout(() => patchUI(charId, { feedbackIndex: 2 }), 700);
      setTimeout(() => {
        patchUI(charId, { feedbackIndex: 3 });
        setTimeout(() => patchUI(charId, { phase: 'variants' }), 600);
      }, 1400);
    }, 1800);
  };

  const selectVariant = (charId: string, variant: Variant | null) => {
    if (variant) updateCharacter(charId, { description: variant.description });
    patchUI(charId, { phase: 'idle', selectedVariant: variant?.label || null });
  };

  const handleAddCharacter = () => {
    const nextNum = characters.length + 1;
    const pool = ['#C4724B', '#6B8CA6', '#C4A04B', '#7A8B6F'];
    addCharacter({
      id: `char-${Date.now()}`, name: `New Character ${nextNum}`,
      age: 'Unknown', description: 'Describe this character…',
      visualTraits: ['Trait 1'], color: pool[nextNum % pool.length], isLocked: false,
    });
    setActiveIndex(characters.length); // jump to new card
  };

  const handleMentionSubmit = (charId: string) => {
    if (!mentionInput.trim()) return;
    const char = characters.find((c) => c.id === charId);
    if (char) startRegenerate(charId, char.name);
    setMentionInput('');
    setShowMentionFor(null);
    setShowAgentDropdown(false);
  };

  /* ── Agent dropdown for @-mentions ── */
  const AGENT_LIST = [
    { key: 'director',           shortcut: '@dir', label: 'Director',         subtitle: 'Story & Emotion',  color: agents.director.color },
    { key: 'cinematographer',    shortcut: '@dp',  label: 'Cinematographer',  subtitle: 'Camera & Light',   color: agents.cinematographer.color },
    { key: 'editor',             shortcut: '@ed',  label: 'Editor',           subtitle: 'Pacing & Flow',    color: agents.editor.color },
    { key: 'productionDesigner', shortcut: '@pd',  label: 'Prod. Designer',   subtitle: 'World & Palette',  color: agents.productionDesigner.color },
  ];

  // Extract the text typed after the last @ to filter agents
  const getMentionQuery = (val: string): string => {
    const lastAt = val.lastIndexOf('@');
    if (lastAt === -1) return '';
    const afterAt = val.slice(lastAt + 1);
    return afterAt.includes(' ') ? '' : afterAt.toLowerCase();
  };

  // Filter agents based on what's typed after @
  const mentionQuery = getMentionQuery(mentionInput);
  const filteredAgents = showAgentDropdown
    ? AGENT_LIST.filter(
        (a) =>
          a.shortcut.toLowerCase().includes('@' + mentionQuery)
          // a.label.toLowerCase().includes(mentionQuery) ||
          // a.key.toLowerCase().includes(mentionQuery)
      )
    : [];

  const handleMentionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMentionInput(val);
    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1) {
      const afterAt = val.slice(lastAt + 1);
      if (!afterAt.includes(' ')) {
        setShowAgentDropdown(true);
        setAgentHighlight(0);
      } else {
        setShowAgentDropdown(false);
      }
    } else {
      setShowAgentDropdown(false);
    }
  };

  const selectAgent = (agent: typeof AGENT_LIST[number]) => {
    const lastAt = mentionInput.lastIndexOf('@');
    const before = lastAt >= 0 ? mentionInput.slice(0, lastAt) : mentionInput;
    setMentionInput(before + agent.shortcut + ' ');
    setShowAgentDropdown(false);
    mentionRef.current?.focus();
  };

  const handleMentionKeyDown = (e: React.KeyboardEvent, charId: string) => {
    if (showAgentDropdown && filteredAgents.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAgentHighlight((p) => (p + 1) % filteredAgents.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAgentHighlight((p) => (p - 1 + filteredAgents.length) % filteredAgents.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectAgent(filteredAgents[agentHighlight]);
        return;
      }
      if (e.key === 'Escape') {
        setShowAgentDropdown(false);
        return;
      }
    }
    if (e.key === 'Enter') handleMentionSubmit(charId);
  };

  /* ═══════════════════════════════════════
     3D Cylindrical Carousel — card style
     ═══════════════════════════════════════ */
  const getCardStyle = useCallback(
    (index: number): React.CSSProperties => {
      const total = characters.length;
      if (total === 0) return { display: 'none' };

      let offset = index - activeIndex;
      if (total > 2) {
        const half = Math.floor(total / 2);
        if (offset > half) offset -= total;
        if (offset < -half) offset += total;
      }
      const absOffset = Math.abs(offset);
      if (absOffset > 3) return { opacity: 0, pointerEvents: 'none' };

      // Cylindrical math
      const theta = offset * ANGLE_STEP;
      const thetaRad = (theta * Math.PI) / 180;
      const translateX = CYLINDER_RADIUS * Math.sin(thetaRad);
      const translateZ = BASE_Z - CYLINDER_RADIUS * (1 - Math.cos(thetaRad));
      const rotateY = -theta;

      const scale = offset === 0 ? 1.1 : Math.max(0.55, 0.82 - (absOffset - 1) * 0.14);
      const opacity = offset === 0 ? 1 : Math.max(0.08, 0.8 - (absOffset - 1) * 0.38);
      const zIndex = 100 - absOffset;

      return {
        transform: `translateX(calc(-50% + ${translateX}px)) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
        opacity,
        zIndex,
        pointerEvents: absOffset > 2 ? 'none' : 'auto',
      };
    },
    [activeIndex, characters.length],
  );

  /* Active character refs */
  const activeChar = characters.length > 0 ? characters[activeIndex] : null;
  const activeUI = activeChar ? getUI(activeChar.id) : INITIAL_UI;

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(180deg, #D8C4A8 0%, #D2BB9C 30%, #CBAF8E 60%, #C4A67E 100%)',
        fontFamily: '"Inter", system-ui, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes avatarSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes panelIn {
          0%   { opacity: 0; transform: translateY(18px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes softPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(196,114,75,0.08); }
          50%      { box-shadow: 0 0 55px rgba(196,114,75,0.18); }
        }
        .carousel-card {
          transition: transform 0.75s cubic-bezier(0.23, 1, 0.32, 1),
                      opacity 0.6s ease,
                      filter 0.5s ease;
        }
        .carousel-card:hover {
          filter: brightness(1.04);
        }
        .detail-panel {
          animation: panelIn 0.45s ease;
        }
        .nav-arrow {
          transition: all 0.2s ease;
        }
        .nav-arrow:hover {
          background: rgba(255,255,255,0.95) !important;
          transform: translateY(-50%) scale(1.12) !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
        }
        .nav-arrow:active {
          transform: translateY(-50%) scale(0.96) !important;
        }
        .dot-btn {
          transition: all 0.35s ease;
        }
        .dot-btn:hover {
          opacity: 1 !important;
          transform: scale(1.3);
        }
      `}</style>

      <Navbar step={2} />

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '100px 24px 60px' }}>
        {/* ═══ Header ═══ */}
        <div
          style={{
            background: 'rgba(255,255,255,0.35)',
            borderRadius: 16,
            padding: '28px 32px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '2rem',
                fontStyle: 'italic',
                color: '#2C2C2C',
                marginBottom: 6,
                fontWeight: 400,
              }}
            >
              Cast Sheet
            </h1>
            <p style={{ fontSize: 13, color: '#5A5248', maxWidth: 420, lineHeight: 1.55 }}>
              Define character archetypes and lock visual identities for your sequence.
            </p>
          </div>
          <button
            style={{
              padding: '10px 22px',
              backgroundColor: allLocked ? '#C4724B' : 'rgba(196,114,75,0.12)',
              color: allLocked ? '#fff' : 'rgba(196,114,75,0.5)',
              border: allLocked ? '1px solid #C4724B' : '1px solid rgba(196,114,75,0.25)',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: allLocked ? 'pointer' : 'not-allowed',
              fontFamily: '"Inter", system-ui, sans-serif',
              whiteSpace: 'nowrap',
              opacity: allLocked ? 1 : 0.6,
              transition: 'all 0.2s',
            }}
            disabled={!allLocked}
            onClick={() => allLocked && navigate('/shots')}
          >
            Begin Shot Design →
          </button>
        </div>

        {/* ═══ Director's Note ═══ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            padding: '20px 24px',
            backgroundColor: 'rgba(255,255,255,0.6)',
            borderRadius: 14,
            borderLeft: '4px solid #C4724B',
            marginBottom: 36,
            backdropFilter: 'blur(6px)',
          }}
        >
          <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>🎬</span>
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#C4724B',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Director's Note
            </p>
            <p
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 14,
                fontStyle: 'italic',
                color: '#5A5248',
                lineHeight: 1.5,
              }}
            >
              "Don't settle — regenerate until you see the right person. The eyes carry the scene."
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            3D CYLINDRICAL CAROUSEL
           ═══════════════════════════════════════ */}
        {characters.length > 0 && (
          <div style={{ position: 'relative', marginBottom: 28 }}>
            {/* Carousel scene — establishes perspective */}
            <div
              ref={carouselRef}
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                if (characters.length > 1 && Math.abs(diff) > 50) {
                  if (diff > 0) setActiveIndex((p) => (p + 1) % characters.length);
                  else setActiveIndex((p) => (p - 1 + characters.length) % characters.length);
                }
              }}
              style={{
                width: '100%',
                height: CARD_H + 80,
                perspective: 1200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: characters.length > 1 ? 'grab' : 'default',
                userSelect: 'none',
              }}
            >
              {/* ◀ Left arrow */}
              {characters.length > 1 && (
                <button
                  className="nav-arrow"
                  onClick={() =>
                    setActiveIndex((p) => (p - 1 + characters.length) % characters.length)
                  }
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                    boxShadow: '0 2px 14px rgba(0,0,0,0.08)',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2C2C2C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}

              {/* Viewport — preserves 3D for children */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                }}
              >
                {characters.map((char, i) => {
                  const ui = getUI(char.id);
                  const isSpinning = ui.phase === 'regenerating';
                  const initial = char.name.charAt(0).toUpperCase();
                  const cardTransform = getCardStyle(i);

                  return (
                    <div
                      key={char.id}
                      className="carousel-card"
                      onClick={() => {
                        if (i !== activeIndex) setActiveIndex(i);
                      }}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        marginTop: -(CARD_H / 2),
                        width: CARD_W,
                        height: CARD_H,
                        borderRadius: 22,
                        overflow: 'hidden',
                        backfaceVisibility: 'hidden',
                        ...cardTransform,
                        /* Card surface */
                        background: char.isLocked
                          ? 'linear-gradient(145deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.88) 100%)'
                          : 'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)',
                        border: char.isLocked
                          ? `2.5px solid ${char.color}`
                          : '1.5px solid rgba(255,255,255,0.65)',
                        boxShadow: char.isLocked
                          ? `0 30px 60px rgba(0,0,0,0.14), 0 0 0 1px ${char.color}33, inset 0 1px 0 rgba(255,255,255,0.7)`
                          : '0 30px 60px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.7)',
                        cursor: i === activeIndex ? 'default' : 'pointer',
                      }}
                    >
                      {/* ✓ Locked badge */}
                      {char.isLocked && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 14,
                            right: 14,
                            zIndex: 3,
                            background: char.color,
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: 20,
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: `0 2px 10px ${char.color}55`,
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Locked
                        </div>
                      )}

                      {/* Portrait area (top 62%) */}
                      <div
                        style={{
                          height: '62%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `linear-gradient(150deg, ${char.color}15 0%, ${char.color}06 50%, transparent 100%)`,
                          position: 'relative',
                        }}
                      >
                        {/* Outer decorative ring */}
                        <div
                          style={{
                            width: 136,
                            height: 136,
                            borderRadius: '50%',
                            border: `3px solid ${char.color}22`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {/* Inner avatar circle */}
                          <div
                            style={{
                              width: 112,
                              height: 112,
                              borderRadius: '50%',
                              border: `4px solid ${char.color}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(255,255,255,0.85)',
                              fontFamily: '"Playfair Display", Georgia, serif',
                              fontSize: 44,
                              fontWeight: 700,
                              color: char.color,
                              animation: isSpinning
                                ? 'avatarSpin 1.2s linear infinite'
                                : 'none',
                              boxShadow: `0 6px 24px ${char.color}20`,
                            }}
                          >
                            {initial}
                          </div>
                        </div>

                        {/* Reimagining label */}
                        {isSpinning && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 10,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              fontSize: 10,
                              fontWeight: 600,
                              color: '#8A7E72',
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              background:
                                'linear-gradient(90deg, #8A7E72, #C4724B, #8A7E72)',
                              backgroundSize: '200% auto',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              animation: 'shimmer 2s linear infinite',
                            }}
                          >
                            ↻ Reimagining…
                          </div>
                        )}
                      </div>

                      {/* Info area (bottom 38%) */}
                      <div
                        style={{
                          height: '38%',
                          padding: '14px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                        }}
                      >
                        <h3
                          style={{
                            fontFamily: '"Playfair Display", Georgia, serif',
                            fontSize: 17,
                            fontWeight: 700,
                            color: '#2C2C2C',
                            marginBottom: 3,
                            letterSpacing: '0.01em',
                          }}
                        >
                          {char.name}
                        </h3>
                        <span
                          style={{
                            fontSize: 10,
                            color: char.color,
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            marginBottom: 10,
                          }}
                        >
                          {char.age}
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            gap: 4,
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                          }}
                        >
                          {char.visualTraits.slice(0, 2).map((trait, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: 9,
                                color: '#8A7E72',
                                backgroundColor: 'rgba(0,0,0,0.04)',
                                padding: '2px 9px',
                                borderRadius: 10,
                              }}
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bottom locked banner */}
                      {char.isLocked && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: char.color,
                            color: '#fff',
                            padding: '7px 16px',
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            textAlign: 'center',
                          }}
                        >
                          Identity Locked Across All Frames
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ▶ Right arrow */}
              {characters.length > 1 && (
                <button
                  className="nav-arrow"
                  onClick={() =>
                    setActiveIndex((p) => (p + 1) % characters.length)
                  }
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                    boxShadow: '0 2px 14px rgba(0,0,0,0.08)',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2C2C2C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>

            {/* Floor shadow / reflection */}
            <div
              style={{
                width: '55%',
                height: 35,
                margin: '0 auto',
                background:
                  'radial-gradient(ellipse at center, rgba(0,0,0,0.09) 0%, transparent 70%)',
                borderRadius: '50%',
                marginTop: -8,
              }}
            />

            {/* Dot indicators */}
            {characters.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 14,
                }}
              >
                {characters.map((_, i) => (
                  <button
                    key={i}
                    className="dot-btn"
                    onClick={() => setActiveIndex(i)}
                    style={{
                      width: i === activeIndex ? 26 : 8,
                      height: 8,
                      borderRadius: 4,
                      border: 'none',
                      backgroundColor:
                        i === activeIndex ? '#C4724B' : 'rgba(0,0,0,0.15)',
                      cursor: 'pointer',
                      opacity: i === activeIndex ? 1 : 0.55,
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════
            DETAIL PANEL — Active Character
           ═══════════════════════════════════════ */}
        {activeChar && (
          <div
            className="detail-panel"
            key={activeChar.id}
            style={{
              background: 'rgba(255,255,255,0.52)',
              borderRadius: 18,
              padding: '28px 32px',
              backdropFilter: 'blur(12px)',
              border: activeChar.isLocked
                ? `2px solid ${activeChar.color}`
                : '1.5px solid rgba(255,255,255,0.55)',
              marginBottom: 22,
              position: 'relative',
              boxShadow: activeChar.isLocked
                ? `0 10px 40px rgba(0,0,0,0.07), 0 0 0 1px ${activeChar.color}22`
                : '0 10px 40px rgba(0,0,0,0.06)',
            }}
          >
            {/* ── Top-right action buttons (Lock + Delete) ── */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 2,
              }}
            >
              {/* Lock / Unlock */}
              {activeUI.phase === 'idle' && (
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 14px',
                    backgroundColor: 'transparent',
                    border: activeChar.isLocked
                      ? `1.5px solid ${activeChar.color}`
                      : '1.5px solid #D8CCBA',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: activeChar.isLocked ? activeChar.color : '#8A7E72',
                    cursor: 'pointer',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    height: 28,
                  }}
                  onClick={() =>
                    activeChar.isLocked
                      ? unlockCharacter(activeChar.id)
                      : lockCharacter(activeChar.id)
                  }
                >
                  {activeChar.isLocked ? (
                    <>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={activeChar.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      ✓ Locked
                    </>
                  ) : (
                    'Lock'
                  )}
                </button>
              )}

              {/* ✕ Delete */}
              {!activeChar.isLocked &&
                activeUI.phase === 'idle' &&
                characters.length > 1 && (
                  <button
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'rgba(0,0,0,0.06)',
                      color: '#8A7E72',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      transition: 'background 0.15s',
                    }}
                    title="Remove character"
                    onClick={() => deleteCharacter(activeChar.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)';
                    }}
                  >
                    ✕
                  </button>
                )}
            </div>

            {/* ── Name row ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 6,
                gap: 14,
                paddingRight: 110,
              }}
            >
              {editingName === activeChar.id ? (
                <input
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#2C2C2C',
                    border: '1px solid #D8CCBA',
                    borderRadius: 6,
                    padding: '2px 10px',
                    outline: 'none',
                    backgroundColor: '#fff',
                    width: '100%',
                    maxWidth: 300,
                  }}
                  value={activeChar.name}
                  autoFocus
                  onChange={(e) =>
                    updateCharacter(activeChar.id, { name: e.target.value })
                  }
                  onBlur={() => setEditingName(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingName(null)}
                />
              ) : (
                <span
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#2C2C2C',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (activeChar.isLocked) unlockCharacter(activeChar.id);
                    setEditingName(activeChar.id);
                  }}
                  title="Click to edit"
                >
                  {activeChar.name}
                </span>
              )}
            </div>

            {/* Age tag */}
            <span
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 600,
                color: '#8A7E72',
                backgroundColor: 'rgba(0,0,0,0.04)',
                padding: '2px 12px',
                borderRadius: 12,
                marginBottom: 18,
                letterSpacing: '0.02em',
              }}
            >
              {activeChar.age}
            </span>

            {/* Description */}
            <p
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#8A7E72',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Description
            </p>
            {editingDesc === activeChar.id ? (
              <textarea
                style={{
                  fontSize: 13.5,
                  color: '#3C3C3C',
                  lineHeight: 1.6,
                  border: '1px solid #D8CCBA',
                  borderRadius: 8,
                  padding: '8px 12px',
                  width: '100%',
                  minHeight: 80,
                  fontFamily: '"Inter", system-ui, sans-serif',
                  resize: 'vertical',
                  outline: 'none',
                  backgroundColor: '#fff',
                  marginBottom: 18,
                  boxSizing: 'border-box',
                }}
                value={activeChar.description}
                autoFocus
                onChange={(e) =>
                  updateCharacter(activeChar.id, { description: e.target.value })
                }
                onBlur={() => setEditingDesc(null)}
              />
            ) : (
              <p
                style={{
                  fontSize: 13.5,
                  color: '#3C3C3C',
                  lineHeight: 1.65,
                  marginBottom: 18,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (activeChar.isLocked) unlockCharacter(activeChar.id);
                  setEditingDesc(activeChar.id);
                }}
                title="Click to edit"
              >
                {activeChar.description}
              </p>
            )}

            {/* Visual Traits */}
            <p
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#8A7E72',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Visual Traits — consistency anchors
            </p>
            <div style={{ marginBottom: 18 }}>
              {activeChar.visualTraits.map((trait, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    fontFamily: '"JetBrains Mono", monospace',
                    color: '#5A5248',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: '3px 10px',
                    borderRadius: 12,
                    marginRight: 6,
                    marginBottom: 6,
                  }}
                >
                  {trait}
                </span>
              ))}
            </div>

            {/* ── Action buttons ── */}
            {!activeChar.isLocked && activeUI.phase === 'idle' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 20px',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    border: '1px solid #D8CCBA',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#5A5248',
                    cursor: 'pointer',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    transition: 'background 0.15s',
                  }}
                  onClick={() =>
                    startRegenerate(activeChar.id, activeChar.name)
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'rgba(255,255,255,1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'rgba(255,255,255,0.8)';
                  }}
                >
                  ↻ Regenerate
                </button>
                <span
                  style={{
                    fontSize: 12,
                    color: '#8A7E72',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  📎 Upload reference
                </span>
                <button
                  style={{
                    fontSize: 11,
                    color: '#8A7E72',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    fontFamily: '"Inter", system-ui, sans-serif',
                  }}
                  onClick={() =>
                    setShowMentionFor(
                      showMentionFor === activeChar.id ? null : activeChar.id,
                    )
                  }
                >
                  💬 Talk to an agent about this character…
                </button>
              </div>
            )}

            {/* @mention input with agent autocomplete dropdown */}
            {showMentionFor === activeChar.id && (
              <div style={{ marginTop: 14, position: 'relative' }}>

                {/* Agent autocomplete dropdown — appears above the input */}
                {showAgentDropdown && filteredAgents.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      right: 0,
                      marginBottom: 6,
                      background: '#FFFFFF',
                      borderRadius: 14,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                      padding: '8px 0',
                      zIndex: 100,
                      overflow: 'hidden',
                    }}
                  >
                    {filteredAgents.map((agent, idx) => (
                      <div
                        key={agent.key}
                        onClick={() => selectAgent(agent)}
                        onMouseEnter={() => setAgentHighlight(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 18px',
                          cursor: 'pointer',
                          background:
                            idx === agentHighlight
                              ? 'rgba(107, 140, 166, 0.08)'
                              : 'transparent',
                          borderLeft:
                            idx === agentHighlight
                              ? `3px solid ${agent.color}`
                              : '3px solid transparent',
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Colored dot */}
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: agent.color,
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#2C2C2C',
                                fontFamily: '"Inter", system-ui, sans-serif',
                              }}
                            >
                              {agent.shortcut}
                              <span style={{ fontWeight: 400, color: '#5A5248' }}>
                                {' — '}
                                {agent.label}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: '#8A7E72',
                                marginTop: 2,
                                fontFamily: '"Inter", system-ui, sans-serif',
                              }}
                            >
                              {agent.subtitle}
                            </div>
                          </div>
                        </div>

                        {/* ENTER badge on highlighted item */}
                        {idx === agentHighlight && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: '#8A7E72',
                              letterSpacing: '0.08em',
                              fontFamily: '"Inter", system-ui, sans-serif',
                            }}
                          >
                            ENTER
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Input row with send button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <input
                    ref={mentionRef}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1.5px solid #D8CCBA',
                      borderRadius: '12px 0 0 12px',
                      fontSize: 14,
                      fontFamily: '"Inter", system-ui, sans-serif',
                      color: '#2C2C2C',
                      outline: 'none',
                      backgroundColor: 'rgba(255,255,255,0.85)',
                      boxSizing: 'border-box',
                    }}
                    placeholder={`Type @ to mention an agent…`}
                    value={mentionInput}
                    onChange={handleMentionInputChange}
                    onKeyDown={(e) => handleMentionKeyDown(e, activeChar.id)}
                    autoFocus
                  />
                  <button
                    onClick={() => handleMentionSubmit(activeChar.id)}
                    style={{
                      padding: '12px 16px',
                      border: '1.5px solid #D8CCBA',
                      borderLeft: 'none',
                      borderRadius: '0 12px 12px 0',
                      backgroundColor: mentionInput.trim()
                        ? '#C4724B'
                        : 'rgba(255,255,255,0.85)',
                      color: mentionInput.trim() ? '#FFF' : '#B8AFA4',
                      cursor: mentionInput.trim() ? 'pointer' : 'default',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}

            {/* ── Crew Feedback ── */}
            {(activeUI.phase === 'feedback' ||
              activeUI.phase === 'variants') && (
              <div
                style={{
                  marginTop: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9,
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#8A7E72',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  Live Crew Feed
                </p>
                {activeUI.feedbackMessages
                  .slice(0, activeUI.feedbackIndex)
                  .map((fb, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontSize: 12,
                        color: '#5A5248',
                        lineHeight: 1.55,
                        animation: 'fadeSlideIn 0.4s ease',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: fb.color,
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                      <p style={{ margin: 0 }}>
                        <span style={{ fontWeight: 700, color: fb.color }}>
                          {fb.agent} {fb.role}:
                        </span>{' '}
                        {fb.message}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            {/* ── Variant Picker ── */}
            {activeUI.phase === 'variants' && (
              <div style={{ marginTop: 18 }}>
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#8A7E72',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  Select a variant
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {activeUI.variants.map((v) => (
                    <div
                      key={v.label}
                      style={{
                        flex: '1 1 0',
                        minWidth: 140,
                        padding: '12px 14px',
                        border:
                          activeUI.selectedVariant === v.label
                            ? '2px solid #C4724B'
                            : '1.5px solid rgba(0,0,0,0.08)',
                        borderRadius: 10,
                        backgroundColor:
                          activeUI.selectedVariant === v.label
                            ? 'rgba(196,114,75,0.06)'
                            : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onClick={() =>
                        patchUI(activeChar.id, { selectedVariant: v.label })
                      }
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#2C2C2C',
                          marginBottom: 4,
                        }}
                      >
                        Variant {v.label}
                      </p>
                      <p
                        style={{
                          fontSize: 11.5,
                          color: '#5A5248',
                          lineHeight: 1.45,
                        }}
                      >
                        {v.description}
                      </p>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginTop: 12,
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    style={{
                      padding: '8px 18px',
                      border: '1.5px solid #D8CCBA',
                      borderRadius: 8,
                      backgroundColor: 'transparent',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#8A7E72',
                      cursor: 'pointer',
                      fontFamily: '"Inter", system-ui, sans-serif',
                    }}
                    onClick={() => selectVariant(activeChar.id, null)}
                  >
                    Keep current
                  </button>
                  {activeUI.selectedVariant && (
                    <button
                      style={{
                        padding: '8px 18px',
                        border: '1.5px solid #C4724B',
                        borderRadius: 8,
                        backgroundColor: 'transparent',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#C4724B',
                        cursor: 'pointer',
                        fontFamily: '"Inter", system-ui, sans-serif',
                      }}
                      onClick={() => {
                        const chosen = activeUI.variants.find(
                          (v) => v.label === activeUI.selectedVariant,
                        );
                        selectVariant(activeChar.id, chosen || null);
                      }}
                    >
                      Apply Variant {activeUI.selectedVariant}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Locked indicator banner */}
            {activeChar.isLocked && (
              <div
                style={{
                  marginTop: 20,
                  backgroundColor: activeChar.color,
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  animation: 'softPulse 3s ease infinite',
                }}
              >
                ✓ Identity Locked Across All Frames
              </div>
            )}
          </div>
        )}

        {/* ═══ Add Character ═══ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '22px 28px',
            border: '2px dashed rgba(0,0,0,0.12)',
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.2)',
            cursor: 'pointer',
            marginBottom: 30,
            transition: 'background 0.15s, border-color 0.15s',
            color: '#8A7E72',
            fontSize: 14,
            fontWeight: 600,
          }}
          onClick={handleAddCharacter}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.35)';
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)';
          }}
        >
          <span style={{ fontSize: 22, opacity: 0.5 }}>+</span>
          Add character
        </div>

        {/* ═══ Footer ═══ */}
        <div
          style={{
            textAlign: 'center',
            paddingTop: 20,
            paddingBottom: 40,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#5A5248',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            {characters.filter((c) => c.isLocked).length} of{' '}
            {characters.length} Characters Locked
          </p>
          <p
            style={{
              fontSize: 11,
              color: '#B8AFA4',
              letterSpacing: '0.04em',
              marginTop: 18,
            }}
          >
            © 2024 Storyboard Studio — Cast Sheet Module
          </p>
        </div>
      </div>
    </div>
  );
};

export default CastSheet;

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { GenUi } from '../../components/genUi';
import { useScreenplayStore } from '../../stores/screenplayStore';
import { useShotStore } from '../../stores/shotStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { useStoryboardStore } from '../../stores/storyboardStore';
import { useStoryStore } from '../../stores/storyStore';
import { useQueueStore } from '../../stores/queueStore';
import { processImageGenerationQueue } from '../../services/imageGenerationService';
import { agentColors } from '../../theme/tokens';
import type { AgentRole, Frame } from '../../types';
import type { DebateMessage } from './types';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

/**
 * Page 3 — Shot Design
 * Crew debates per scene via SSE streaming from /api/debate.
 */

/* ── Agent display config ── */
const AGENT_CONFIG: { key: AgentRole; label: string; icon: string; color: string }[] = [
  { key: 'director', label: 'Director', icon: '🎬', color: agentColors.director },
  { key: 'cinematographer', label: 'Cinematographer', icon: '🎞', color: agentColors.cinematographer },
  { key: 'editor', label: 'Editor', icon: '✂', color: agentColors.editor },
  { key: 'productionDesigner', label: 'Production Designer', icon: '🏗', color: agentColors.productionDesigner },
];

/** Map backend agent names to frontend AgentRole */
function toAgentRole(agent: string): AgentRole | null {
  const map: Record<string, AgentRole> = {
    Director: 'director',
    Cinematographer: 'cinematographer',
    Editor: 'editor',
    ProductionDesigner: 'productionDesigner',
  };
  return map[agent] || null;
}

const ShotGeneration: React.FC = () => {
  const navigate = useNavigate();
  const { completeStep } = useNavigationStore();
  useEffect(() => { completeStep(3); }, []);
  
  // Subscribe to queue store - separate selectors to prevent infinite loop
  const queueItems = useQueueStore((state) => state.queueItems);
  const isProcessing = useQueueStore((state) => state.isProcessing);

  // Auto-start image generation when queue has items and processing isn't already running
  useEffect(() => {
    if (queueItems.length > 0 && !isProcessing) {
      console.log(`[ShotGeneration] Queue has ${queueItems.length} items. Starting image generation...`);
      processImageGenerationQueue().catch((err) => {
        console.error('[ShotGeneration] Image generation error:', err);
      });
    }
  }, [queueItems.length, isProcessing]);

  const { scenes } = useScreenplayStore();
  const {
    currentSceneIndex,
    completedScenes,
    setCurrentScene,
    completeScene,
    isDebating,
    setIsDebating,
    isComplete,
    setComplete,
    reset: resetShotStore,
  } = useShotStore();
  const { setFrames } = useStoryboardStore();
  const { storyboardId, setStoryboardId } = useStoryStore();
  const { addToQueue } = useQueueStore();

  const [selectedAgent, setSelectedAgent] = useState<AgentRole | null>(null);
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([]);
  const [, setSceneParams] = useState<Record<number, Record<string, unknown>>>({});
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const msgIdRef = useRef(0);

  const sceneList = scenes.length > 0 ? scenes : [];
  const activeScene = sceneList[currentSceneIndex];
  const totalScenes = sceneList.length;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [debateMessages]);

  // Messages for the current scene, optionally filtered by agent
  const visibleMessages = debateMessages
    .filter((m) => m.sceneIndex === currentSceneIndex)
    .filter((m) => !selectedAgent || m.agent === selectedAgent);

  /** Start the SSE debate stream */
  const startDebate = useCallback(async () => {
    if (sceneList.length === 0) return;
    resetShotStore();
    setIsDebating(true);
    setError(null);
    setDebateMessages([]);
    setSceneParams({});
    msgIdRef.current = 0;

    const controller = new AbortController();
    abortRef.current = controller;

    // Convert frontend scenes → backend SceneContext[]
    const backendScenes = sceneList.map((s) => ({
      slug: s.slugLine,
      body: s.body || s.blocks.map((b) =>
        b.type === 'action' ? b.text : `${b.dialogue?.character}\n${b.dialogue?.parenthetical ? `(${b.dialogue.parenthetical})\n` : ''}${b.dialogue?.line}`
      ).join('\n\n'),
      characters: s.characters,
      location: s.location,
      timeOfDay: s.timeOfDay,
    }));

    try {
      const res = await fetch(`${API_BASE}/api/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: backendScenes, storyboardId }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Debate failed: HTTP ${res.status}`);
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      // Track the last agent message per agent to append streaming chunks
      const activeAgentMsg: Record<string, string> = {};
      // Track scene index as we process stream (closure's currentSceneIndex is stale)
      let effectiveSceneIndex = 0;
      const accumulatedSceneParams: Record<number, Record<string, unknown>> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event: Record<string, unknown>;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          switch (event.type) {
            case 'storyboard_id': {
              const id = event.storyboardId as number;
              if (typeof id === 'number') setStoryboardId(id);
              break;
            }
            case 'scene_start': {
              const idx = event.scene_index as number;
              effectiveSceneIndex = idx;
              setCurrentScene(idx);
              break;
            }
            case 'debate_chunk': {
              const role = toAgentRole(event.agent as string);
              if (!role) break;
              const chunk = event.chunk as string;
              const isDone = event.done as boolean;
              const eventSceneIndex = typeof event.scene_index === 'number' ? event.scene_index : effectiveSceneIndex;
              const agentKey = `${role}-${eventSceneIndex}`;

              if (activeAgentMsg[agentKey] !== undefined) {
                // Append to existing streaming message
                activeAgentMsg[agentKey] += chunk;
                const currentText = activeAgentMsg[agentKey];
                setDebateMessages((prev) => {
                  const updated = [...prev];
                  let lastIdx = -1;
                  for (let i = updated.length - 1; i >= 0; i--) {
                    const m = updated[i];
                    if (m.agent === role && m.sceneIndex === eventSceneIndex && m.streaming) {
                      lastIdx = i;
                      break;
                    }
                  }
                  if (lastIdx >= 0) {
                    updated[lastIdx] = { ...updated[lastIdx], text: currentText, streaming: !isDone };
                  }
                  return updated;
                });
              } else {
                // Start new message for this agent
                activeAgentMsg[agentKey] = chunk;
                const id = `msg-${++msgIdRef.current}`;
                setDebateMessages((prev) => [
                  ...prev,
                  { id, agent: role, text: chunk, sceneIndex: eventSceneIndex, streaming: !isDone },
                ]);
              }

              if (isDone) {
                delete activeAgentMsg[agentKey];
              }
              break;
            }
            case 'scene_complete': {
              const idx = event.scene_index as number;
              completeScene(idx);
              if (event.shot_parameters) {
                const params = event.shot_parameters as Record<string, unknown>;
                accumulatedSceneParams[idx] = params;
                setSceneParams((prev) => ({ ...prev, [idx]: params }));

                // Extract and push parameters to queue
                const parseParam = (raw: unknown): object => {
                  if (typeof raw === 'string') {
                    try {
                      return JSON.parse(raw) as object;
                    } catch {
                      return {};
                    }
                  }
                  return (raw as object) || {};
                };

                addToQueue({
                  scene: idx + 1, // Convert 0-indexed to 1-indexed scene number
                  storyboardId: storyboardId || 0, // Pass storyboard ID
                  directorParams: parseParam(params['director_parameters']),
                  cinematographerParams: parseParam(params['cinematographer_parameters']),
                  productionDesignerParams: parseParam(params['production_designer_parameters']),
                  editorParams: parseParam(params['editor_parameters']),
                });
              }
              break;
            }
            case 'done': {
              setComplete();
              // Build frames from accumulated params (not stale closure state)
              const frames: Frame[] = [];
              Object.entries(accumulatedSceneParams).forEach(([sceneIdx, params]) => {
                const sIdx = Number(sceneIdx);
                const scene = sceneList[sIdx];
                if (!scene) return;
                const rawCp = (params as Record<string, unknown>)?.['cinematographer_parameters'];
                const cp = typeof rawCp === 'string' ? (() => { try { return JSON.parse(rawCp) as Record<string, unknown>; } catch { return undefined; } })() : (rawCp as Record<string, unknown> | undefined);
                const paramsDisplay = cp
                  ? [cp.focal_length_mm, cp.aperture_fstop, cp.color_temperature_kelvin].filter(Boolean).join(' ')
                  : undefined;
                const rawDp = (params as Record<string, unknown>)?.['director_parameters'];
                const dp = typeof rawDp === 'string' ? (() => { try { return JSON.parse(rawDp) as Record<string, unknown>; } catch { return undefined; } })() : (rawDp as Record<string, unknown> | undefined);
                const title = (dp?.story_beat_action as string) || scene.slugLine;
                const desc = (dp?.directorial_intent as string) || scene.body || '';
                frames.push({
                  id: `frame-${sIdx + 1}`,
                  sceneId: scene.id,
                  sceneNumber: scene.number,
                  frameNumber: sIdx + 1,
                  title: String(title).slice(0, 80) || scene.slugLine,
                  description: String(desc).slice(0, 120) || scene.body || '',
                  characters: scene.characters,
                  duration: '—',
                  instantParams: { colorTemperature: 5600, contrast: 50, haze: 0, colorGrade: 'Neutral' },
                  deepParams: {
                    focalLength: 35, cameraAngle: 'Eye Level', dutchAngle: 0,
                    cameraHeight: 'Standard', shotSize: 'Wide', compGrid: 'Rule of Thirds',
                    eyeline: 'Direct to Camera', headroom: 'Standard', keyLightDir: 'Side 45°',
                    lightQuality: 'Medium-Soft', era: 'Contemporary', setCondition: 'Clean',
                    movement: 'Static', aspectRatio: '2.39:1',
                  },
                  paramsDisplay,
                });
              });
              if (frames.length > 0) setFrames(frames);
              break;
            }
            case 'error': {
              setError(event.message as string || 'Debate error');
              break;
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Debate stream failed');
      }
    } finally {
      setIsDebating(false);
      abortRef.current = null;
    }
  }, [sceneList]);

  // ── Styles ──
  const page: React.CSSProperties = {
    height: '100vh',
    overflow: 'hidden',
    backgroundImage: 'url(/images/background.avif)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    fontFamily: '"Inter", system-ui, sans-serif',
    paddingTop: 80,
    display: 'flex',
    flexDirection: 'column',
  };

  const layout: React.CSSProperties = {
    display: 'flex',
    gap: 0,
    flex: 1,
    minHeight: 0,
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px 40px',
    width: '100%',
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
    minHeight: 0,
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

          {/* Scene list panel — read-only, driven by debate flow */}
          <div className="hide-scrollbar" style={{ ...sidebarCard, flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {Array.from({ length: totalScenes }, (_, i) => {
              const scene = sceneList[i];
              const isCompleted = completedScenes.includes(i);
              const isCurrent = i === currentSceneIndex;
              const isFuture = i > currentSceneIndex && !isCompleted;

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: isCurrent
                      ? 'rgba(196,114,75,0.08)'
                      : 'transparent',
                    transition: 'background 0.15s',
                    marginBottom: 2,
                  }}
                >
                  {/* Status: checkmark when completed, dot when current, empty when pending */}
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
                    {isCompleted ? (
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
                    ) : isCurrent ? (
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#C4724B',
                        }}
                      />
                    ) : null}
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
                </div>
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
              {!isDebating && !isComplete && (
                <button
                  onClick={startDebate}
                  disabled={sceneList.length === 0}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#C4724B',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: sceneList.length === 0 ? 'not-allowed' : 'pointer',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    opacity: sceneList.length === 0 ? 0.5 : 1,
                  }}
                >
                  Begin Crew Debate
                </button>
              )}
              {isDebating && (
                <span style={{ fontSize: 12, color: '#C4724B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#C4724B', animation: 'pulse 1s infinite' }} />
                  Debating…
                </span>
              )}
              {isComplete && totalScenes > 0 && (
                <>
                  <span style={{ fontSize: 12, color: '#7A8B6F', fontWeight: 600 }}>✓ Complete</span>
                  <button
                    onClick={() => navigate('/storyboard')}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: '#C4724B',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: '"Inter", system-ui, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    View Storyboard
                  </button>
                </>
              )}
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

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 28px', color: '#D04040', fontSize: 13, background: 'rgba(208,64,64,0.06)', borderBottom: '1px solid rgba(208,64,64,0.15)' }}>
              {error}
            </div>
          )}

          {/* Debate messages — only this area scrolls (scrollbar hidden) */}
          <div
            ref={contentRef}
            className="hide-scrollbar"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '24px 28px',
            }}
          >
            {visibleMessages.length === 0 && !isDebating && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#8A7E72' }}>
                <p style={{ fontSize: 15, fontStyle: 'italic', fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {sceneList.length === 0
                    ? 'No scenes loaded. Go back and generate a screenplay first.'
                    : 'Press "Begin Crew Debate" to start the shot design process.'}
                </p>
                <p style={{ fontSize: 12, marginTop: 8 }}>
                  4 agents will analyse each scene and debate shot parameters.
                </p>
              </div>
            )}

            {visibleMessages.map((msg) => {
              const agentCfg = AGENT_CONFIG.find((a) => a.key === msg.agent);
              return (
                <div
                  key={msg.id}
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
                      {agentCfg?.icon} {agentCfg?.label || msg.agent}
                      {msg.streaming && (
                        <span style={{ marginLeft: 6, fontSize: 9, opacity: 0.7 }}>streaming…</span>
                      )}
                    </span>
                  </div>

                  {/* Message content — GenUi for params, plain text for discussion */}
                  <div style={{ paddingLeft: 16 }}>
                    {msg.text.startsWith('Set parameters:\n') ? (
                      <GenUi data={{ type: 'params', content: msg.text, sceneNumber: msg.sceneIndex + 1 }} />
                    ) : (
                      <p
                        style={{
                          fontSize: 14,
                          lineHeight: 1.65,
                          color: '#2C2C2C',
                          margin: 0,
                          fontFamily: '"Inter", system-ui, sans-serif',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {msg.text}
                        {msg.streaming && (
                          <span style={{ display: 'inline-block', width: 2, height: '1em', marginLeft: 2, background: agentCfg?.color || '#999', animation: 'blink 0.8s step-end infinite', verticalAlign: 'text-bottom' }} />
                        )}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes blink { 50% { opacity: 0; } }
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default ShotGeneration;

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { useScreenplayStore } from '../../stores/screenplayStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { mockScenes } from '../../data/mockScreenplay';
import type { SceneBlock } from '../../types';

/**
 * Page 2 — Screenplay Review
 * All scenes fully expanded, scrollable, drag-to-reorder.
 */
const Screenplay = () => {
  const navigate = useNavigate();
  const { completeStep } = useNavigationStore();
  useEffect(() => { completeStep(1); }, []);
  const { scenes, setScenes, deleteScene, setEditingScene, editingSceneId, reorderScenes } = useScreenplayStore();
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scenes.length === 0) setScenes(mockScenes);
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    setDragIdx(idx);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Make the drag image slightly transparent
    setTimeout(() => {
      if (dragNode.current) dragNode.current.style.opacity = '0.4';
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIdx !== null && idx !== overIdx) {
      setOverIdx(idx);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      reorderScenes(dragIdx, idx);
    }
    handleDragEnd();
  };

  const handleDragEnd = () => {
    if (dragNode.current) dragNode.current.style.opacity = '1';
    setDragIdx(null);
    setOverIdx(null);
    dragNode.current = null;
  };

  // ── Styles ──
  const page: React.CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    backgroundImage: 'url(/images/background.avif)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const contentArea: React.CSSProperties = {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '100px 24px 80px',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: '1.8rem',
    fontStyle: 'italic',
    color: '#2C2C2C',
    marginBottom: '6px',
    fontWeight: 400,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#8A7E72',
    whiteSpace: 'nowrap',
  };

  const headerRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '4px',
  };

  const regenerateBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 16px',
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#2C2C2C',
    cursor: 'pointer',
    fontFamily: '"Inter", system-ui, sans-serif',
    whiteSpace: 'nowrap',
  };

  const approveBtn: React.CSSProperties = {
    padding: '7px 16px',
    backgroundColor: "#C4724B",
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.5)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: '"Inter", system-ui, sans-serif',
    whiteSpace: 'nowrap',
  };

  const headerCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '14px',
    padding: '20px 24px',
    marginBottom: '28px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
  };

  const sceneCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '36px 40px',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };

  const sceneNumberCircle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1.5px solid #FFFFFF',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontWeight: 700,
    color: '#1A1A1A',
    flexShrink: 0,
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const dragHandle: React.CSSProperties = {
    cursor: 'grab',
    padding: '4px 2px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    color: '#B8AFA4',
    marginRight: '8px',
    userSelect: 'none',
  };

  const dropIndicator: React.CSSProperties = {
    height: '4px',
    borderRadius: '2px',
    backgroundColor: '#C4724B',
    marginBottom: '24px',
    transition: 'opacity 0.15s ease',
  };

  const sceneHeader: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px',
  };

  const sceneLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#C4724B',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '6px',
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const editingLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#C4724B',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '6px',
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const editingCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '16px',
    border: '2px dashed #C4724B',
    padding: '36px 40px',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(196, 114, 75, 0.05)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };

  const doneBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 20px',
    backgroundColor: '#2B8A5E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const slugLineStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: '#2C2C2C',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
  };

  const actionTextStyle: React.CSSProperties = {
    fontSize: '15px',
    color: '#2C2C2C',
    lineHeight: 1.75,
    marginBottom: '24px',
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
  };

  const dialogueCharacterStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 700,
    color: '#2C2C2C',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
  };

  const dialogueParentheticalStyle: React.CSSProperties = {
    fontSize: '14px',
    fontStyle: 'italic',
    color: '#5A5248',
    textAlign: 'center',
    marginBottom: '4px',
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
  };

  const dialogueLineStyle: React.CSSProperties = {
    fontSize: '15px',
    color: '#2C2C2C',
    textAlign: 'center',
    maxWidth: '460px',
    margin: '0 auto 24px',
    lineHeight: 1.65,
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
  };

  const sceneFooter: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid #D8CCBA',
    paddingTop: '16px',
    marginTop: '20px',
  };

  const dotColors = ['#5A5248', '#6B8CA6', '#7A8B6F', '#C4A04B'];

  const charDot = (idx: number): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: dotColors[idx % dotColors.length],
    flexShrink: 0,
  });

  const charLabelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 700,
    color: '#2C2C2C',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
  };

  const locationLabelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#5A5248',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
  };

  const iconBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    color: '#8A7E72',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const floatingSave: React.CSSProperties = {
    position: 'fixed',
    right: '28px',
    bottom: '28px',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 40,
  };

  const renderBlock = (block: SceneBlock, idx: number) => {
    if (block.type === 'action') {
      return <p key={idx} style={actionTextStyle}>{block.text}</p>;
    }
    if (block.type === 'dialogue' && block.dialogue) {
      return (
        <div key={idx} style={{ marginBottom: '20px' }}>
          <p style={dialogueCharacterStyle}>{block.dialogue.character}</p>
          {block.dialogue.parenthetical && (
            <p style={dialogueParentheticalStyle}>({block.dialogue.parenthetical})</p>
          )}
          <p style={dialogueLineStyle}>{block.dialogue.line}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={page}>
      <Navbar step={1} />
      <div style={floatingSave}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      </div>

      <div style={contentArea}>
        {/* Header card */}
        <div style={headerCard}>
          <h1 style={titleStyle}>Screenplay</h1>
          <div style={headerRow}>
            <p style={subtitleStyle}>
              {scenes.length} scenes · Drag to reorder · Click Edit to rewrite
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button style={regenerateBtn}>
                <span style={{ fontSize: '14px' }}>↻</span> Regenerate
              </button>
              <button style={approveBtn} onClick={() => navigate('/cast')}>
                Approve Script →
              </button>
            </div>
          </div>
        </div>

        {/* ALL scene cards — fully expanded, drag to reorder */}
        {scenes.map((scene, idx) => {
          const isEditing = editingSceneId === scene.id;
          return (
          <React.Fragment key={scene.id}>
            {/* Drop indicator line */}
            {overIdx === idx && dragIdx !== null && dragIdx !== idx && (
              <div style={dropIndicator} />
            )}
            <div
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              style={{
                ...(isEditing ? editingCard : sceneCard),
                ...(dragIdx === idx ? { opacity: 0.4, transform: 'scale(0.98)' } : {}),
                ...(overIdx === idx && dragIdx !== idx ? { transform: 'translateY(4px)' } : {}),
              }}
            >
              {/* Scene header */}
              <div style={sceneHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={editingLabelStyle}>EDITING SCENE {scene.number}</span>
                      <span style={slugLineStyle}>{scene.slugLine}</span>
                    </div>
                  ) : (
                    <>
                      <div style={sceneNumberCircle}>{scene.number}</div>
                      <span style={slugLineStyle}>{scene.slugLine}</span>
                    </>
                  )}
                </div>

                {isEditing ? (
                  <button style={doneBtnStyle} onClick={() => setEditingScene(null)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Done
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      style={iconBtnStyle}
                      onClick={() => setEditingScene(scene.id)}
                      title="Edit scene"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button>
                    <button
                      style={iconBtnStyle}
                      onClick={() => deleteScene(scene.id)}
                      title="Delete scene"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Scene body */}
              {isEditing ? (
                <textarea
                  style={{
                    ...actionTextStyle,
                    width: '100%',
                    minHeight: '140px',
                    border: '1px solid #E0CEB8',
                    borderRadius: '8px',
                    padding: '16px',
                    resize: 'vertical' as const,
                    outline: 'none',
                    backgroundColor: '#FEFCF9',
                    caretColor: '#C4724B',
                    boxSizing: 'border-box' as const,
                  }}
                  defaultValue={scene.blocks
                    .map((b) =>
                      b.type === 'action'
                        ? b.text
                        : `${b.dialogue?.character}\n${b.dialogue?.parenthetical ? `(${b.dialogue.parenthetical})\n` : ''}${b.dialogue?.line}`
                    )
                    .join('\n\n')}
                  autoFocus
                />
              ) : (
                scene.blocks.map((block, bi) => renderBlock(block, bi))
              )}

              {/* Scene footer — hidden when editing */}
              {!isEditing && (
                <div style={sceneFooter}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {scene.characters.map((char, ci) => (
                      <div key={char} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={charDot(ci)} />
                        <span style={charLabelStyle}>{char}</span>
                      </div>
                    ))}
                  </div>
                  <span style={locationLabelStyle}>
                    {scene.location} · {scene.timeOfDay}
                  </span>
                </div>
              )}
            </div>
          </React.Fragment>
          );
        })}
        {/* Bottom drop zone */}
        {overIdx !== null && dragIdx !== null && overIdx >= scenes.length - 1 && (
          <div style={dropIndicator} />
        )}
      </div>
    </div>
  );
};

export default Screenplay;

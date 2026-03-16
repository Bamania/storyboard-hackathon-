import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { useNavigationStore } from '../../stores/navigationStore';
import { useScreenplayStore } from '../../stores/screenplayStore';
import { useStoryboardStore } from '../../stores/storyboardStore';
import { useStoryStore } from '../../stores/storyStore';
import { mockScenes } from '../../data/mockScreenplay';
import type { Frame } from '../../types';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface ArtboardData {
  id: number;
  status: string;
  imageUrl: string | null;
  directorParams?: Record<string, unknown>;
  cinematographerParams?: Record<string, unknown>;
  scene?: { slug: string; body: string; position: number };
}

interface SceneWithArtboards {
  id: number;
  slug: string;
  body: string;
  position: number;
  artboards: ArtboardData[];
}

interface StoryboardData {
  id: number;
  scenes: SceneWithArtboards[];
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

const Storyboard: React.FC = () => {
  const { completeStep } = useNavigationStore();
  const { scenes } = useScreenplayStore();
  const { frames } = useStoryboardStore();
  const { storyboardId } = useStoryStore();
  useEffect(() => { completeStep(4); }, []);

  const [storyboard, setStoryboard] = useState<StoryboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const sceneList = scenes.length > 0 ? scenes : mockScenes;

  useEffect(() => {
    if (!storyboardId || !Number.isFinite(storyboardId)) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/storyboards/${storyboardId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch storyboard');
        return res.json();
      })
      .then((data) => {
        setStoryboard(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load storyboard');
      })
      .finally(() => setLoading(false));
  }, [storyboardId]);

  const generateImage = useCallback(async (artboardId: number) => {
    setGeneratingIds((prev) => new Set(prev).add(artboardId));
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/img-gen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artboardId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.imageUrl && storyboard) {
        setStoryboard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map((s) => ({
              ...s,
              artboards: s.artboards.map((a) =>
                a.id === artboardId ? { ...a, imageUrl: data.imageUrl, status: 'DONE' } : a
              ),
            })),
          };
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(artboardId);
        return next;
      });
    }
  }, [storyboard]);

  /* Artboards from fetched storyboard (preferred when storyboardId exists) */
  const artboardCards = storyboard
    ? storyboard.scenes.flatMap((scene, idx) =>
        (scene.artboards ?? []).map((artboard, aIdx) => ({
          artboard,
          scene,
          sceneNumber: scene.position + 1,
          frameNumber: idx * 10 + aIdx + 1,
        }))
      )
    : [];

  /* Derive unique locations for filter pills */
  const locations = storyboard
    ? Array.from(new Set(storyboard.scenes.map((s) => s.slug.split(' - ')[0] || s.slug)))
    : Array.from(new Set(sceneList.map((s) => s.location)));

  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredArtboards = activeFilter
    ? artboardCards.filter((c) => {
        const loc = c.scene.slug.split(' - ')[0] || c.scene.slug;
        return loc === activeFilter;
      })
    : artboardCards;

  /* Fallback: frames from store when no storyboard fetched */
  const filteredFrames: Frame[] = activeFilter
    ? frames.filter((f) => {
        const scene = sceneList.find((s) => s.id === f.sceneId);
        return scene?.location === activeFilter;
      })
    : frames;

  const useArtboards = storyboard && artboardCards.length > 0;
  const totalFrames = useArtboards ? artboardCards.length : frames.length;
  const totalScenes = useArtboards
    ? new Set(artboardCards.map((c) => c.sceneNumber)).size
    : frames.length > 0
      ? new Set(frames.map((f) => f.sceneNumber)).size
      : 0;

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

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '12px 20px',
              marginBottom: 16,
              color: '#D04040',
              fontSize: 13,
              background: 'rgba(208,64,64,0.06)',
              borderRadius: 8,
              border: '1px solid rgba(208,64,64,0.2)',
            }}
          >
            {error}
          </div>
        )}

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
          {loading ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '80px 24px',
                color: '#8A7E72',
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: 'italic',
                fontSize: 16,
              }}
            >
              Loading storyboard…
            </div>
          ) : useArtboards && filteredArtboards.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '80px 24px',
                color: '#8A7E72',
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: 'italic',
                fontSize: 16,
              }}
            >
              No artboards yet. Complete the crew debate on the Shots page first.
            </div>
          ) : useArtboards ? (
            filteredArtboards.map(({ artboard, scene, sceneNumber, frameNumber }) => {
              const toObj = (v: unknown): Record<string, unknown> => {
                if (!v) return {};
                if (typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
                if (typeof v === 'string') {
                  try { return JSON.parse(v) as Record<string, unknown>; } catch { return {}; }
                }
                return {};
              };
              const dp = toObj(artboard.directorParams);
              const cp = toObj(artboard.cinematographerParams);
              const title = (dp.story_beat_action as string) || scene.slug;
              const desc = (dp.directorial_intent as string) || scene.body || '';
              const paramsDisplay = [cp.focal_length_mm, cp.aperture_fstop, cp.color_temperature_kelvin]
                .filter(Boolean)
                .join(' ') || undefined;
              const canGenerate = artboard.status === 'PARAMS_READY';
              const isGenerating = generatingIds.has(artboard.id);
              const hasImage = artboard.status === 'DONE' && artboard.imageUrl;

              return (
                <div
                  key={artboard.id}
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
                  <div style={placeholderStyle(sceneNumber)}>
                    <span style={badgeStyle(sceneNumber)}>SC{sceneNumber}</span>
                    {hasImage ? (
                      <img
                        src={artboard.imageUrl!}
                        alt={title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span style={frameNumStyle}>
                        {String(frameNumber).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div style={cardBodyStyle}>
                    <p style={frameTitleStyle}>{title}</p>
                    <p style={frameDescStyle}>{String(desc).slice(0, 120)}</p>
                    {paramsDisplay && <div style={techRowStyle}>{paramsDisplay}</div>}
                    {canGenerate && (
                      <button
                        onClick={() => generateImage(artboard.id)}
                        disabled={isGenerating}
                        style={{
                          marginTop: 10,
                          padding: '8px 16px',
                          backgroundColor: isGenerating ? '#8A7E72' : '#C4724B',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isGenerating ? 'not-allowed' : 'pointer',
                          fontFamily: '"Inter", system-ui, sans-serif',
                        }}
                      >
                        {isGenerating ? 'Generating…' : 'Generate Image'}
                      </button>
                    )}
                    {artboard.status === 'GENERATING' && (
                      <span style={{ fontSize: 12, color: '#C4724B', fontWeight: 600, marginTop: 8, display: 'block' }}>
                        Generating…
                      </span>
                    )}
                    {artboard.status === 'FAILED' && (
                      <span style={{ fontSize: 12, color: '#D04040', marginTop: 8, display: 'block' }}>
                        Generation failed
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : filteredFrames.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '80px 24px',
                color: '#8A7E72',
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: 'italic',
                fontSize: 16,
              }}
            >
              No storyboard frames yet. Complete the crew debate on the Shots page to generate frames.
            </div>
          ) : (
            filteredFrames.map((frame) => (
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
                <div style={placeholderStyle(frame.sceneNumber)}>
                  <span style={badgeStyle(frame.sceneNumber)}>SC{frame.sceneNumber}</span>
                  <span style={frameNumStyle}>
                    {String(frame.frameNumber).padStart(2, '0')}
                  </span>
                </div>
                <div style={cardBodyStyle}>
                  <p style={frameTitleStyle}>{frame.title}</p>
                  <p style={frameDescStyle}>{frame.description}</p>
                  {frame.paramsDisplay && (
                    <div style={techRowStyle}>{frame.paramsDisplay}</div>
                  )}
                </div>
              </div>
            ))
          )}
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

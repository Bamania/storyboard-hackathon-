import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { useStoryStore } from '../../stores/storyStore';
import { useScreenplayStore } from '../../stores/screenplayStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { mockScenes } from '../../data/mockScreenplay';

/**
 * Genre Selection Page
 * User selects a genre before generating a screenplay
 */

interface Genre {
  id: string;
  title: string;
  description: string;
  video?: string;
}

const genres: Genre[] = [
  {
    id: 'action',
    title: 'Action',
    description: 'Fast-paced, high-stakes scenes with movement and tension.',
    video: '/videos/Action.mp4',
  },
  {
    id: 'animation',
    title: 'Animation',
    description: 'Stylized, imaginative visuals and exaggerated motion.',
    video: '/videos/Animation.mp4',
  },
  {
    id: 'comedy',
    title: 'Comedy',
    description: 'Lighthearted, funny, and driven by timing.',
  },
  {
    id: 'commercial',
    title: 'Commercial',
    description: 'Short, impactful stories that promote a message or product.',
  },
  {
    id: 'documentary',
    title: 'Documentary',
    description: 'Real stories told with interviews and observation.',
  },
  {
    id: 'drama',
    title: 'Drama',
    description: 'Emotional, character-driven storytelling.',
  },
  {
    id: 'educational',
    title: 'Educational',
    description: 'Clear, structured content designed to explain or teach.',
  },
  {
    id: 'fantasy',
    title: 'Fantasy',
    description: 'Magical worlds, mythical creatures, and epic themes.',
  },
  {
    id: 'horror',
    title: 'Horror',
    description: 'Suspenseful, dark, and built to create fear.',
  },
  {
    id: 'musicvideo',
    title: 'Music Video',
    description: 'Visually rhythmic and expressive, led by music.',
  },
  {
    id: 'mystery',
    title: 'Mystery',
    description: 'Twists, clues, and uncovering the unknown.',
  },
  {
    id: 'romance',
    title: 'Romance',
    description: 'Stories of love, connection, and emotion.',
  },
  {
    id: 'scifi',
    title: 'Science Fiction',
    description: 'Futuristic tech, space, or speculative ideas.',
  },
  {
    id: 'thriller',
    title: 'Thriller',
    description: 'Tense, fast-moving plots with danger and suspense.',
  },
  {
    id: 'western',
    title: 'Western',
    description: 'Rugged landscapes, outlaws, and frontier justice.',
  },
];

const GenreSelection = () => {
  const navigate = useNavigate();
  const { setGenre } = useStoryStore();
  const { setScenes } = useScreenplayStore();
  const { completeStep, setCurrentStep } = useNavigationStore();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);

  const handleGenreSelect = (genreId: string) => {
    setSelectedGenre(genreId);
  };

  const handleContinue = () => {
    if (!selectedGenre) return;

    const genre = genres.find((g) => g.id === selectedGenre);
    if (!genre) return;

    setGenre(genre.title);
    setScenes(mockScenes);
    completeStep(2);
    setCurrentStep(3);
    navigate('/screenplay');
  };

  // ── Shared styles (matching StoryInput theme) ──
  const pageWrapper: React.CSSProperties = {
    minHeight: '100vh',
    overflow: 'auto',
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
    position: 'relative',
    zIndex: 10,
    padding: '20px 24px 24px',
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
    marginBottom: '10px',
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
    fontSize: '2.6rem',
    fontStyle: 'italic',
    color: '#2C2C2C',
    marginBottom: '8px',
    textAlign: 'center',
    lineHeight: 1.15,
  };

  const subtitle: React.CSSProperties = {
    color: '#5A5248',
    fontSize: '14px',
    textAlign: 'center',
    maxWidth: '560px',
    marginBottom: '20px',
    lineHeight: 1.55,
    fontFamily: '"Inter", system-ui, sans-serif',
  };

  const gridWrapper: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
    width: '100%',
    maxWidth: '1100px',
    marginBottom: '20px',
  };

  const genreCard = (id: string): React.CSSProperties => {
    const isSelected = selectedGenre === id;
    const isHovered = hoveredGenre === id;
    return {
      position: 'relative',
      background: isSelected
        ? 'rgba(196,114,75,0.10)'
        : 'rgba(255,255,255,0.18)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: '16px',
      padding: '18px 16px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: isSelected
        ? '2px solid #C4724B'
        : isHovered
          ? '1px solid rgba(196,114,75,0.4)'
          : '1px solid rgba(255,255,255,0.2)',
      boxShadow: isSelected
        ? '0 8px 32px rgba(196,114,75,0.15)'
        : isHovered
          ? '0 8px 32px rgba(0,0,0,0.08)'
          : '0 4px 16px rgba(0,0,0,0.04)',
      transform: isSelected ? 'scale(1.02)' : isHovered ? 'translateY(-2px)' : 'none',
    };
  };

  const genreTitle = (id: string): React.CSSProperties => ({
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: '15px',
    fontWeight: 700,
    color: selectedGenre === id ? '#C4724B' : '#2C2C2C',
    marginBottom: '6px',
    transition: 'color 0.3s ease',
  });

  const genreDesc: React.CSSProperties = {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: '13px',
    color: '#5A5248',
    lineHeight: 1.55,
  };

  const checkmarkWrapper: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#C4724B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const btnBase: React.CSSProperties = {
    padding: '14px 36px',
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
    cursor: 'pointer',
  };

  const btnContinueEnabled: React.CSSProperties = {
    ...btnBase,
    backgroundColor: '#bb6d49',
    color: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(196,114,75,0.25)',
    minWidth: '180px',
  };

  const btnContinueDisabled: React.CSSProperties = {
    ...btnBase,
    backgroundColor: '#bb6d49',
    color: '#FDF8F3',
    cursor: 'not-allowed',
    opacity: 0.5,
    minWidth: '180px',
  };

  const btnBack: React.CSSProperties = {
    ...btnBase,
    backgroundColor: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: '#2C2C2C',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
  };

  const footer: React.CSSProperties = {
    color: '#8A7E72',
    fontSize: '12px',
    fontStyle: 'italic',
    marginTop: '12px',
    textAlign: 'center',
    maxWidth: '420px',
    fontFamily: '"Inter", system-ui, sans-serif',
    lineHeight: 1.55,
  };

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
        @media (max-width: 1024px) {
          .genre-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 800px) {
          .genre-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .genre-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Static paper background */}
      <div
        style={{
          position: 'fixed',
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
        {/* Badge */}
        <div style={badgeWrapper}>
          <span style={badgeText}>Select Genre</span>
        </div>

        {/* Headline */}
        <h1 style={headline}>Select your genre</h1>

        {/* Subtitle */}
        <p style={subtitle}>
          Choose a genre that best fits your creative vision. This will guide
          the screenplay generation and visual storytelling.
        </p>

        {/* Genres Grid */}
        <div className="genre-grid" style={gridWrapper}>
          {genres.map((genre) => {
            const isSelected = selectedGenre === genre.id;
            const hasVideo = !!genre.video;

            return (
              <div
                key={genre.id}
                onClick={() => handleGenreSelect(genre.id)}
                onMouseEnter={() => setHoveredGenre(genre.id)}
                onMouseLeave={() => setHoveredGenre(null)}
                style={{
                  ...genreCard(genre.id),
                  ...(hasVideo ? { padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const } : {}),
                }}
              >
                {/* Checkmark for selected */}
                {isSelected && (
                  <div style={{
                    ...checkmarkWrapper,
                    ...(hasVideo ? { top: '8px', right: '8px', zIndex: 2 } : {}),
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {hasVideo ? (
                  /* Video card layout */
                  <>
                    <div style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      overflow: 'hidden',
                      borderBottom: '1px solid rgba(196,114,75,0.2)',
                      position: 'relative',
                      background: '#1a1a1a',
                    }}>
                      <video
                        src={genre.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                      <h3 style={genreTitle(genre.id)}>{genre.title}</h3>
                      <p style={genreDesc}>{genre.description}</p>
                    </div>
                  </>
                ) : (
                  /* Default card layout */
                  <>
                    <h3 style={genreTitle(genre.id)}>{genre.title}</h3>
                    <p style={genreDesc}>{genre.description}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <button onClick={() => navigate('/')} style={btnBack}>
            ← Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedGenre}
            style={selectedGenre ? btnContinueEnabled : btnContinueDisabled}
          >
            Continue →
          </button>
        </div>

        {/* Footer info */}
        <p style={footer}>
          Your genre selection will shape the screenplay structure, visual style, and narrative elements.
        </p>
      </div>
    </div>
  );
};

export default GenreSelection;

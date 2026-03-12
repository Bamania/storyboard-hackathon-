/**
 * Design Tokens — Single source of truth for theme values in JS/TS.
 * Mirrors the CSS custom properties in index.css.
 */

export const colors = {
  terracotta: '#C4724B',
  terracottaLight: '#D4896A',
  terracottaDark: '#A85D3A',
  cream: '#FAF5EF',
  warmBg: '#FDF8F3',
} as const;

export const agentColors = {
  director: '#C4724B',
  cinematographer: '#6B8CA6',
  editor: '#7A8B6F',
  productionDesigner: '#C4A04B',
} as const;

export const textColors = {
  primary: '#2C2C2C',
  secondary: '#5A5248',
  muted: '#8A7E72',
} as const;

export const fonts = {
  heading: '"Playfair Display", Georgia, serif',
  body: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
} as const;

export const agents = {
  director: { role: 'Director', emoji: '🎬', color: agentColors.director, shortcut: '@dir', domain: 'Story, emotion, framing' },
  cinematographer: { role: 'Cinematographer', emoji: '🎞', color: agentColors.cinematographer, shortcut: '@dp', domain: 'Camera, lens, lighting' },
  editor: { role: 'Editor', emoji: '🎛', color: agentColors.editor, shortcut: '@ed', domain: 'Pacing, rhythm, movement' },
  productionDesigner: { role: 'Production Designer', emoji: '🏗', color: agentColors.productionDesigner, shortcut: '@pd', domain: 'World, color, era, environment' },
} as const;

export type AgentKey = keyof typeof agents;

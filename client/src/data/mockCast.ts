import type { Character } from '../types';

export const mockCharacters: Character[] = [
  {
    id: 'char-1',
    name: 'Marcus Cole',
    age: 'Late 40s',
    description: 'Rugged, weathered detective. Permanent five-o\'clock shadow, deep-set eyes that have seen too much. Broad shoulders but slightly hunched — the weight of the city on his back.',
    visualTraits: ['Rugged features', 'Late 40s', 'Tired eyes', 'Broad shoulders', 'Five-o\'clock shadow'],
    color: '#C4724B',
    isLocked: false,
  },
  {
    id: 'char-2',
    name: 'Elara Voss',
    age: 'Early 30s',
    description: 'Sharp, poised femme fatale. High cheekbones, piercing green eyes, dark hair always pulled back. Moves like someone who knows every exit in the room.',
    visualTraits: ['Piercing green eyes', 'Dark hair', 'High cheekbones', 'Early 30s', 'Sharp features'],
    color: '#6B8CA6',
    isLocked: false,
  },
  {
    id: 'char-3',
    name: 'Viktor Ashford',
    age: 'Mid 50s',
    description: 'Silver-haired tech mogul with cold, calculating eyes. Immaculate tailoring, never a crease. The kind of face you see on magazine covers and courtroom sketches.',
    visualTraits: ['Silver hair', 'Cold gaze', 'Mid 50s', 'Impeccable tailoring', 'Sharp jawline'],
    color: '#C4A04B',
    isLocked: false,
  },
];

/* Agent feedback that appears during regeneration — 3 agents weigh in */
export interface CrewFeedback {
  agent: string;
  role: string;
  color: string;
  message: string;
}

export const getCrewFeedback = (charName: string): CrewFeedback[] => [
  {
    agent: '🎬',
    role: 'Director',
    color: '#C4724B',
    message: `"This variant carries more emotional weight for ${charName}. The eyes tell the story."`,
  },
  {
    agent: '🎞',
    role: 'DP',
    color: '#6B8CA6',
    message: `"Better shadow line for split-light setups. The bone structure works with side-key."`,
  },
  {
    agent: '🏗',
    role: 'PD',
    color: '#C4A04B',
    message: `"Adjusted wardrobe — darker layers. Fits the noir palette we established."`,
  },
];

/* Variant descriptions per character */
export interface Variant {
  label: string;
  description: string;
}

export const getVariants = (charName: string): Variant[] => {
  if (charName === 'Marcus Cole') {
    return [
      { label: 'A', description: 'More grizzled — deeper lines, heavier stubble. Trench coat, no tie.' },
      { label: 'B', description: 'Leaner build, sharper jaw. Leather jacket, rolled sleeves. Noir classic.' },
      { label: 'C', description: 'Softer features, tired warmth. Wool overcoat, loosened collar.' },
    ];
  }
  if (charName === 'Elara Voss') {
    return [
      { label: 'A', description: 'Colder, more angular. Platinum streak in dark hair. Silk blouse.' },
      { label: 'B', description: 'Warmer presence, subtle smile. Velvet blazer, dark lipstick.' },
      { label: 'C', description: 'Harder edge, scar above brow. Fitted turtleneck, silver rings.' },
    ];
  }
  return [
    { label: 'A', description: 'Distinguished elder. Wire-rim glasses, charcoal three-piece suit.' },
    { label: 'B', description: 'Tech-forward. No tie, slim-cut navy, titanium watch.' },
    { label: 'C', description: 'Old money. Double-breasted pinstripe, pocket square, signet ring.' },
  ];
};


import type { Scene } from '../types';

/**
 * Mock screenplay data generated from a noir detective story prompt.
 * 8 scenes matching the design reference.
 */
export const mockScenes: Scene[] = [
  {
    id: 'scene-1',
    number: 1,
    slugLine: 'EXT. CITY STREET — NIGHT',
    body: '',
    blocks: [
      {
        type: 'action',
        text: 'The neon lights bleed into the puddles. Rain slicks the pavement like oil. MARCUS COLE stands under a flickering street lamp, collar turned up against the chill.',
      },
      {
        type: 'dialogue',
        dialogue: {
          character: 'MARCUS COLE (V.O.)',
          parenthetical: 'low, gravelly',
          line: 'I thought I was out. But the rain has a way of dragging you back into the gutter. Every drop feels like a debt coming due.',
        },
      },
      {
        type: 'action',
        text: 'He flicks a cigarette butt into the dark. It sizzles in a puddle.',
      },
    ],
    characters: ['MARCUS'],
    location: 'DOWNTOWN',
    timeOfDay: 'NIGHT',
  },
  {
    id: 'scene-2',
    number: 2,
    slugLine: 'INT. JAZZ BAR — NIGHT',
    body: '',
    blocks: [
      {
        type: 'action',
        text: 'Smoke curls around the saxophone player like a dying ghost. The air is thick with bourbon and cheap perfume. ELARA sits at the corner booth, eyes sharp as a switchblade.',
      },
      {
        type: 'dialogue',
        dialogue: {
          character: 'ELARA',
          line: "You're late, Marcus. I was starting to think the city finally swallowed you whole.",
        },
      },
      {
        type: 'action',
        text: "Marcus slides into the booth opposite her. He doesn't take off his coat.",
      },
      {
        type: 'dialogue',
        dialogue: {
          character: 'COLE',
          line: "The city didn't want me to leave. Traffic's a killer tonight.",
        },
      },
    ],
    characters: ['MARCUS', 'ELARA'],
    location: 'JAZZ BAR',
    timeOfDay: 'NIGHT',
  },
  {
    id: 'scene-3',
    number: 3,
    slugLine: 'INT. BACK ALLEY — CONTINUOUS',
    body: '',
    blocks: [
      {
        type: 'action',
        text: 'Marcus pushes through the heavy steel door. The alley is a narrow throat of brick and shadow. He stops, sensing a presence behind him.',
      },
      {
        type: 'dialogue',
        dialogue: {
          character: 'STRANGER (O.S.)',
          line: "Don't turn around, Detective. Stay looking at the trash. It's where you belong.",
        },
      },
      {
        type: 'action',
        text: 'Marcus freezes. The click of a revolver hammer is louder than the rain.',
      },
    ],
    characters: ['MARCUS'],
    location: 'ALLEY',
    timeOfDay: 'NIGHT',
  },
  {
    id: 'scene-4',
    number: 4,
    slugLine: 'EXT. DOCKS — DAWN',
    body: '',
    blocks: [
      {
        type: 'action',
        text: 'The first light of dawn creeps over the water. Cargo containers loom like monoliths. Marcus walks along the pier, hands in pockets.',
      },
    ],
    characters: ['MARCUS'],
    location: 'DOCKS',
    timeOfDay: 'DAWN',
  },
  {
    id: 'scene-5',
    number: 5,
    slugLine: 'INT. PRECINCT — DAY',
    body: '',
    blocks: [
      {
        type: 'action',
        text: "Fluorescent lights hum overhead. The precinct is a maze of desks and coffee stains. Captain REYES leans against the doorframe of her office.",
      },
    ],
    characters: ['MARCUS', 'REYES'],
    location: 'PRECINCT',
    timeOfDay: 'DAY',
  },
  {
    id: 'scene-6',
    number: 6,
    slugLine: 'INT. ASHFORD PENTHOUSE — NIGHT',
    body: '',
    blocks: [
      {
        type: 'action',
        text: 'Floor-to-ceiling windows frame the city skyline. VIKTOR ASHFORD swirls a glass of scotch, his back to the room.',
      },
      {
        type: 'dialogue',
        dialogue: {
          character: 'ASHFORD',
          line: "You must be the detective. I've been expecting you.",
        },
      },
    ],
    characters: ['MARCUS', 'ASHFORD'],
    location: 'PENTHOUSE',
    timeOfDay: 'NIGHT',
  },
  {
    id: 'scene-7',
    number: 7,
    slugLine: 'EXT. ROOFTOP — NIGHT',
    body: '',
    blocks: [
      {
        type: 'action',
        text: 'Wind whips across the rooftop. Marcus stands at the edge, looking down at the street below. The city stretches endlessly in every direction.',
      },
    ],
    characters: ['MARCUS'],
    location: 'ROOFTOP',
    timeOfDay: 'NIGHT',
  },
  {
    id: 'scene-8',
    number: 8,
    slugLine: 'INT. JAZZ BAR — NIGHT',
    body: '',
    blocks: [
      {
        type: 'action',
        text: "The bar is empty now. Chairs stacked on tables. Elara sits alone at the piano, pressing a single key over and over.",
      },
      {
        type: 'dialogue',
        dialogue: {
          character: 'ELARA',
          parenthetical: 'quietly',
          line: "Some stories don't get endings, Marcus. They just stop.",
        },
      },
    ],
    characters: ['ELARA'],
    location: 'JAZZ BAR',
    timeOfDay: 'NIGHT',
  },
];

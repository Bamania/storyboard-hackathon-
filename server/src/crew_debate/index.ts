/**
 * Crew Debate — Runnable demo for the 4-agent shot generation system.
 * Run: npx ts-node --esm src/crew_debate/index.ts
 */

import 'dotenv/config';

import { InMemoryRunner } from '@google/adk';
import { createUserContent } from '@google/genai';
import { sceneOrchestrator } from './scene_orchestrator.js';
import type { SceneContext } from './types.js';

const APP_NAME = 'crew_debate';
const USER_ID = 'user_1';
const SESSION_ID = 'session_shot_gen';

// Sample scenes for a noir detective story (start with 1 scene for reliable demo)
const SAMPLE_SCENES: SceneContext[] = [
  {
    slug: 'EXT. CITY STREET — NIGHT',
    body: 'Rain-slicked pavement. Neon signs reflect in puddles. COLE, a weary detective, walks through the mist.',
    characters: ['Cole'],
    location: 'Downtown',
    timeOfDay: 'Night',
  },
  // Uncomment for multi-scene:
  // {
  //   slug: 'INT. DIVE BAR — NIGHT',
  //   body: 'Smoky interior. Cole sits at the bar. ELARA approaches with a folder.',
  //   characters: ['Cole', 'Elara'],
  //   location: 'Dive Bar',
  //   timeOfDay: 'Night',
  // },
];

async function main() {
  const runner = new InMemoryRunner({
    agent: sceneOrchestrator,
    appName: APP_NAME,
  });

  const initialState = {
    scenes: SAMPLE_SCENES,
    scene_index: 0,
    total_scenes: SAMPLE_SCENES.length,
    debate_round: 0,
    debate_transcript: [] as Array<{ agent: string; message: string }>,
    debate_transcript_formatted: '(No contributions yet)',
    consensus_reached: false,
    shot_parameters: {} as Record<string, unknown>,
    completed_scenes: [] as SceneContext[],
    characters: [
      { name: 'Cole', description: 'Weary detective, 40s', color: '#C4724B' },
      { name: 'Elara', description: 'Mysterious informant', color: '#6B8CA6' },
      { name: 'Viktor', description: 'Shady businessman', color: '#C4A04B' },
    ],
  };

  const session = await runner.sessionService.createSession({
    appName: APP_NAME,
    userId: USER_ID,
    sessionId: SESSION_ID,
    state: initialState,
  });

  console.log('=== Crew Debate Demo ===');
  console.log(`Scenes to debate: ${SAMPLE_SCENES.length}`);
  console.log('Starting shot design...\n');

  for await (const event of runner.runAsync({
    userId: USER_ID,
    sessionId: SESSION_ID,
    newMessage: createUserContent('Begin the crew debate for shot design.'),
  })) {
    if (event.content?.parts?.length) {
      const text = event.content.parts
        .map((p) => (p as { text?: string }).text ?? '')
        .join('');
      if (text && event.author !== 'user') {
        console.log(`[${event.author}]: ${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`);
      }
    }
  }

  const finalSession = await runner.sessionService.getSession({
    appName: APP_NAME,
    userId: USER_ID,
    sessionId: SESSION_ID,
  });

  console.log('\n=== Final State ===');
  console.log('Completed scenes:', (finalSession?.state['completed_scenes'] as SceneContext[])?.length ?? 0);
  console.log('Shot parameters:', JSON.stringify(finalSession?.state['shot_parameters'], null, 2));
}

main().catch(console.error);

import type { AgentRole } from '../../types';

export interface DebateMessage {
  id: string;
  agent: AgentRole;
  text: string;
  sceneIndex: number;
  streaming?: boolean;
}

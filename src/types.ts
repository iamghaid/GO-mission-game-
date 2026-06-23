/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Player {
  teamId: 'blue' | 'red';
  role: 1 | 2 | 3;
}

export interface DrawPoint {
  x: number;
  y: number;
  isStart: boolean;
}

export interface TeamState {
  teamId: 'blue' | 'red';
  name: string;
  players: {
    [role: number]: boolean; // True if player slot is occupied
  };
  score: number;
  timeUsed: number; // in seconds, if succeeded
  status: 'idle' | 'joined' | 'playing' | 'completed' | 'failed';
  technicalGrid: number[]; // Role 3's current selections
  drawPoints: DrawPoint[]; // Drawing streaming from Role 1 to Role 2
}

export interface Mission {
  id: string;
  type: 'technical' | 'physical';
  difficulty: 'easy' | 'medium' | 'hard';
  title: string;
  role1_instruction: string; // Detail seen ONLY by Role 1
  role3_interface: 'grid_3' | 'grid_4' | 'none'; // Technical interfaces or physical (none)
  gridSize?: number; // 3 or 4
  solutionGrid?: number[]; // Grid answers (length 9 or 16)
  solutionNotes?: string; // Information for host verification
}

export interface GameState {
  currentRound: number;
  maxRounds: number;
  difficulty: 'easy' | 'medium' | 'hard';
  missionType: 'technical' | 'physical';
  theme: string;
  currentMission: Mission | null;
  activeTeamId: 'blue' | 'red' | null;
  roundTimer: number; // in seconds
  maxTimer: number; // initial allocation, e.g., 90s
  timerRunning: boolean;
  teams: {
    blue: TeamState;
    red: TeamState;
  };
  winner: 'blue' | 'red' | 'draw' | null;
  lastUpdated: number;
}

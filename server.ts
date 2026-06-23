/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { GameState, Mission, DrawPoint } from "./src/types";

dotenv.config();

// Initialize express app
const app = express();
const PORT = 3000;

app.use(express.json());

// Multi-role game state in memory
let gameState: GameState = {
  currentRound: 1,
  maxRounds: 3,
  difficulty: "easy",
  missionType: "technical",
  theme: "Sci-Fi Space",
  currentMission: null,
  activeTeamId: null,
  roundTimer: 90,
  maxTimer: 120,
  timerRunning: false,
  teams: {
    blue: {
      teamId: "blue",
      name: "Cyber Foxes 🦊",
      players: { 1: false, 2: false, 3: false },
      score: 0,
      timeUsed: 0,
      status: "idle",
      technicalGrid: Array(9).fill(0),
      drawPoints: []
    },
    red: {
      teamId: "red",
      name: "Space Phoenixes 🐦‍🔥",
      players: { 1: false, 2: false, 3: false },
      score: 0,
      timeUsed: 0,
      status: "idle",
      technicalGrid: Array(9).fill(0),
      drawPoints: []
    }
  },
  winner: null,
  lastUpdated: Date.now()
};

// CURATED FALLBACK CHALLENGES (If Gemini key is missing or fails, we have zero-crash instant play)
const PRESET_MISSIONS: Mission[] = [
  // --- EASY TECHNICAL (3x3 GRIDS) ---
  {
    id: "tech_easy_1",
    type: "technical",
    difficulty: "easy",
    title: "Space Teleportation Bridge",
    role1_instruction: "Recreate the teleporter pad layout. It is a 3x3 grid. Turn ON only the top-left, center, and bottom-right diagonals (from top-left to bottom-right). Explain this diagonal line pattern using only silent sketches or face expressions.",
    role3_interface: "grid_3",
    gridSize: 3,
    solutionGrid: [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ],
    solutionNotes: "Diagonal line pattern of 3 nodes: top-left to bottom-right."
  },
  {
    id: "tech_easy_2",
    type: "technical",
    difficulty: "easy",
    title: "Aegis Shield Wall",
    role1_instruction: "The defense shielding must be activated. On your 3x3 grid, turn ON all 3 tiles of the bottom row. Convey this line silently.",
    role3_interface: "grid_3",
    gridSize: 3,
    solutionGrid: [
      0, 0, 0,
      0, 0, 0,
      1, 1, 1
    ],
    solutionNotes: "Entire bottom row activated (3 tiles)."
  },
  {
    id: "tech_easy_3",
    type: "technical",
    difficulty: "easy",
    title: "Pillar of Light",
    role1_instruction: "A core power beam is rising! On the 3x3 grid, turn ON only the entire middle vertical column of tiles (nodes 2, 5, 8). Sketch this pillar silently.",
    role3_interface: "grid_3",
    gridSize: 3,
    solutionGrid: [
      0, 1, 0,
      0, 1, 0,
      0, 1, 0
    ],
    solutionNotes: "Entire middle column activated (3 tiles)."
  },
  {
    id: "tech_easy_4",
    type: "technical",
    difficulty: "easy",
    title: "The Letter T",
    role1_instruction: "The energy flow forms a capital 'T'. On the 3x3 grid, turn ON the entire top row and the center tile of the bottom row. Convey this classic geometry.",
    role3_interface: "grid_3",
    gridSize: 3,
    solutionGrid: [
      1, 1, 1,
      0, 1, 0,
      0, 1, 0
    ],
    solutionNotes: "Capital 'T' shape. Row 1: all ON. Middle and bottom center: ON."
  },

  // --- MEDIUM TECHNICAL (4x4 GRIDS) ---
  {
    id: "tech_med_1",
    type: "technical",
    difficulty: "medium",
    title: "Smiley Generator Core",
    role1_instruction: "Recreate a smiling face on the 4x4 coordinate shield. Row 1: no active tiles. Row 2: column 1 and column 4 active (the eyes). Row 3: column 1 and column 4 active (the cheeks). Row 4: Column 2 and Column 3 active (the mouth center). Tell Role 2 silently.",
    role3_interface: "grid_4",
    gridSize: 4,
    solutionGrid: [
      0, 0, 0, 0,
      1, 0, 0, 1,
      1, 0, 0, 1,
      0, 1, 1, 0
    ],
    solutionNotes: "Smiling face matrix. Eyes at row 2 col 1/4; mouth bottom-middle."
  },
  {
    id: "tech_med_2",
    type: "technical",
    difficulty: "medium",
    title: "Quantum Border Walls",
    role1_instruction: "The core is under attack! Protect the borders. On the 4x4 grid, turn ON only the four corners of the grid. All internal and side cells must remain OFF. Explain the four pins.",
    role3_interface: "grid_4",
    gridSize: 4,
    solutionGrid: [
      1, 0, 0, 1,
      0, 0, 0, 0,
      0, 0, 0, 0,
      1, 0, 0, 1
    ],
    solutionNotes: "Only the four corners (indices 0, 3, 12, 15) are turned ON."
  },
  {
    id: "tech_med_3",
    type: "technical",
    difficulty: "medium",
    title: "Double Diagonals",
    role1_instruction: "Generate a giant 'X' on top of your grid! On the 4x4 grid, turn ON the two main diagonal tracks crossing from corner to corner. Draw a giant 'X' on the canvas.",
    role3_interface: "grid_4",
    gridSize: 4,
    solutionGrid: [
      1, 0, 0, 1,
      0, 1, 1, 0,
      0, 1, 1, 0,
      1, 0, 0, 1
    ],
    solutionNotes: "A perfect 4x4 'X' shape containing exactly 8 ON nodes."
  },

  // --- HARD TECHNICAL (4x4 GRIDS) ---
  {
    id: "tech_hard_1",
    type: "technical",
    difficulty: "hard",
    title: "Nuclear Core Ring",
    role1_instruction: "Recreate the high-level containment ring. On the 4x4 grid, turn ON the outer ring of cells BUT keep the center 2x2 cells completely deactivated. Draw an empty box.",
    role3_interface: "grid_4",
    gridSize: 4,
    solutionGrid: [
      1, 1, 1, 1,
      1, 0, 0, 1,
      1, 0, 0, 1,
      1, 1, 1, 1
    ],
    solutionNotes: "Continuous box frame of 12 cells. Center 4 cells are OFF."
  },
  {
    id: "tech_hard_2",
    type: "technical",
    difficulty: "hard",
    title: "Binary Crosshairs",
    role1_instruction: "Align the cosmic sights! On the 4x4 grid, turn ON the middle two columns and the middle two rows, leaving only the four outer corner quadrants completely OFF. Show a crosshair silhouette.",
    role3_interface: "grid_4",
    gridSize: 4,
    solutionGrid: [
      0, 1, 1, 0,
      1, 1, 1, 1,
      1, 1, 1, 1,
      0, 1, 1, 0
    ],
    solutionNotes: "Plus-sign / target crosshair. 12 active central/cross tiles; 4 corners are OFF."
  },

  // --- EASY PHYSICAL (FIELD GOOFY ACTIONS) ---
  {
    id: "phys_easy_1",
    type: "physical",
    difficulty: "easy",
    title: "The Royal Coronation",
    role1_instruction: "Describe this royal mission: Role 3 must sit strictly erect on a classroom chair while holding a water bottle like a royal golden scepter, while Role 2 bows dramatically to them three times. No speech allowed from Role 1!",
    role3_interface: "none",
    solutionNotes: "Confirm Role 3 sits on a throne-chair holding a bottle upright like a scepter while Role 2 bows down three separate times."
  },
  {
    id: "phys_easy_2",
    type: "physical",
    difficulty: "easy",
    title: "The Super Secret Spy",
    role1_instruction: "Guide your agents: Role 3 must put hands around their eyes pretending to wear cool tech spy glasses, and stand facing a corner wall completely frozen with legs crossed.",
    role3_interface: "none",
    solutionNotes: "Confirm Role 3 has hands in a circle outline around eyes like goggled spectacles and stands facing the classroom corner in frozen silence."
  },
  {
    id: "phys_easy_3",
    type: "physical",
    difficulty: "easy",
    title: "Zen Master Meditation",
    role1_instruction: "Zen state activated! Role 3 must sit cross-legged flat on the classroom floor, keep both eyes fully closed, and keep their thumbs and index fingers touching together in a classic Zen pose above their knees.",
    role3_interface: "none",
    solutionNotes: "Confirm Role 3 sits cross-legged on the ground, has eyes shut, and maintains a traditional Zen finger-circle mudra pose."
  },

  // --- MEDIUM PHYSICAL (FIELD GOOFY ACTIONS) ---
  {
    id: "phys_med_1",
    type: "physical",
    difficulty: "medium",
    title: "The Solar Sail Probe",
    role1_instruction: "Wacky cosmic antenna! Role 3 must stand on one foot on a student chair, fully extending their left arm straight up to the sky. Meanwhile, Role 2 must kneel besides the chair holding a textbook above their own head as a communicator panel.",
    role3_interface: "none",
    solutionNotes: "Confirm Role 3 stands balanced on one leg on a chair with their arm pointing to the sky, and Role 2 is kneeling on the floor holding a book above head."
  },
  {
    id: "phys_med_2",
    type: "physical",
    difficulty: "medium",
    title: "Sleeping Space Overlord",
    role1_instruction: "The commander is hyper-sleeping! Role 3 must lay their head down entirely flat on a desk. Role 2 must sit right next to them on a chair, using a folder or notebook to gently fan them repeatedly.",
    role3_interface: "none",
    solutionNotes: "Confirm Role 3's head is down flat as if asleep on a desk, and Role 2 is fanning them continuously with a folder or notepad."
  },
  {
    id: "phys_med_3",
    type: "physical",
    difficulty: "medium",
    title: "Matrix Laser Dodge",
    role1_instruction: "A laser grid is passing through! Role 3 must achieve a slow-motion dramatic back-bend as if avoiding bullets or laser beams, while Role 2 holds a long ruler or stick 5 inches above them as the laser.",
    role3_interface: "none",
    solutionNotes: "Confirm Role 3 is doing a back-bend to dodge, and Role 2 is holding a textbook, ruler or stick horizontally over their torso."
  },

  // --- HARD PHYSICAL (FIELD GOOFY ACTIONS) ---
  {
    id: "phys_hard_1",
    type: "physical",
    difficulty: "hard",
    title: "Silent Android Recharge",
    role1_instruction: "Robot recharging protocol! Role 3 must walk in high-contrast robotic, stiff angular movements with zero sound. They must locate any pencil, pick it up stiffly, and slide it down into a desk cup without causing any clink or noise.",
    role3_interface: "none",
    solutionNotes: "Confirm Role 3 moves rigidly like an android/robot, retrieve a pencil, and puts it in a desk mug/holder in absolute silence."
  },
  {
    id: "phys_hard_2",
    type: "physical",
    difficulty: "hard",
    title: "Space Fighter Cabin Assembly",
    role1_instruction: "The ship cabin is assembling! Align two student chairs so their backrests touch. Role 3 must sit on one facing backward. Role 2 must stand tall behind them, holding their own smartphone pointing forward with the flashlight turned ON as the main navigation rocket beam.",
    role3_interface: "none",
    solutionNotes: "Confirm two chairs are back-to-back. Role 3 sitting facing backwards on one. Role 2 stands behind holding their phone light shining forward."
  },
  {
    id: "phys_hard_3",
    type: "physical",
    difficulty: "hard",
    title: "Gravity Control Generator",
    role1_instruction: "Gravity lock has failed! Role 3 must lean their hips sideways against a study desk, supporting their weight on only one hand. Their feet must remain glued together on the floor. While holding this post, they must raise their other arm high in the air while looking directly up at the ceiling.",
    role3_interface: "none",
    solutionNotes: "Confirm Role 3 is leaning against a desk on one palm, feet side-by-side, other arm pointing straight up to the ceiling while staring open-mouthed upwards."
  }
];

// Server-side synced countdown timer
setInterval(() => {
  if (gameState.timerRunning && gameState.currentMission) {
    if (gameState.roundTimer > 0) {
      gameState.roundTimer -= 1;
      gameState.lastUpdated = Date.now();
    } else {
      // Timer ran out! Active team fails
      gameState.timerRunning = false;
      const tId = gameState.activeTeamId;
      if (tId) {
        gameState.teams[tId].status = "failed";
        gameState.teams[tId].timeUsed = gameState.maxTimer;
      }
      gameState.activeTeamId = null;
      gameState.lastUpdated = Date.now();
    }
  }
}, 1000);

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
  }
  return aiClient;
}

// AI Generation Logic
async function generateMissionWithAI(type: 'technical' | 'physical', difficulty: 'easy' | 'medium' | 'hard', theme: string): Promise<Mission> {
  const ai = getGemini();
  const timestamp = Date.now();
  
  if (!ai) {
    console.log("No Gemini API Key found. Using creative presets for absolute reliability.");
    // Choose randomly from matching preset difficulty + type
    const matches = PRESET_MISSIONS.filter(m => m.type === type && m.difficulty === difficulty);
    const chosen = matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : PRESET_MISSIONS[0];
    return {
      ...chosen,
      id: `${chosen.id}_fallback_${timestamp}`,
      title: `${chosen.title} (${theme || "Standard"})`
    };
  }

  const gridSpec = type === "technical" 
    ? (difficulty === "easy" ? "3x3 tiles grid (array of length 9 containing strictly 0s and 1s)" : "4x4 tiles grid (array of length 16 containing strictly 0s and 1s)")
    : "No grid needed";

  const systemInstruction = `You are a creative, fun game master for 'The Silent Mission' - a classroom icebreaker team game.
Teams of three students must perform silent tasks. Role 1 knows the mission, can only gesture or draw. Role 2 translates verbally. Role 3 carries it out.
Generate a brand new, hilarious, incredibly distinct mission matching the parameters:
Type: ${type}
Difficulty: ${difficulty}
Theme/Topic: ${theme || "Standard Classic Icebreaker"}

Return a JSON object that strictly respects this TypeScript structure:
{
  "id": "ai_gen_${difficulty}_${timestamp}",
  "type": "${type}",
  "difficulty": "${difficulty}",
  "title": "Clear, fun sci-fi or funny game name matching core theme and action",
  "role1_instruction": "Deeply descriptive secrets. Explain what they must do. E.g. for Technical, tell them which cells are 1 (ON) and 0 (OFF). For Physical, explain the wacky room layout, poses, or drawing details. Make it VERY funny and engaging!",
  "role3_interface": "${type === 'technical' ? (difficulty === 'easy' ? 'grid_3' : 'grid_4') : 'none'}",
  "gridSize": ${type === 'technical' ? (difficulty === 'easy' ? 3 : 4) : 0},
  "solutionGrid": Array of 0 and 1, length 9 (for gridSize 3) or 16 (for gridSize 4). ONLY if type is technical. Ensure the count of '1's matches the explanation! E.g. for a smile, arrow, heart, cross, or initials.,
  "solutionNotes": "Teacher/Host guide explaining how they can check if the team finished correctly."
}`;

  try {
    const prompt = `Create a brand new and unique ${difficulty} ${type} mission with the flavor of theme: ${theme}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            title: { type: Type.STRING },
            role1_instruction: { type: Type.STRING },
            role3_interface: { type: Type.STRING },
            gridSize: { type: Type.INTEGER },
            solutionGrid: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER }
            },
            solutionNotes: { type: Type.STRING }
          },
          required: ["id", "type", "difficulty", "title", "role1_instruction", "role3_interface", "solutionNotes"]
        }
      }
    });

    const bodyText = response.text?.trim() || "";
    const parsed = JSON.parse(bodyText) as Mission;
    console.log("Successfully generated AI Mission:", parsed.title);
    return parsed;
  } catch (error) {
    console.error("Gemini AI generation error, building fallback mission:", error);
    const matches = PRESET_MISSIONS.filter(m => m.type === type && m.difficulty === difficulty);
    const chosen = matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : PRESET_MISSIONS[0];
    return {
      ...chosen,
      id: `${chosen.id}_fallback_err_${timestamp}`,
      title: `${chosen.title} (${theme || "AI Rescued Workspace"}) (AI Fallback)`
    };
  }
}

// ----- REST API ENDPOINTS -----

// Fetch complete central game state
app.get("/api/game-state", (req, res) => {
  res.json(gameState);
});

// Configure and reset game settings, select/generate a mission
app.post("/api/game-state/init", async (req, res) => {
  const { difficulty, missionType, theme, maxRounds, clearScores } = req.body;
  
  if (difficulty) gameState.difficulty = difficulty;
  if (missionType) gameState.missionType = missionType;
  if (theme) gameState.theme = theme;
  if (maxRounds) gameState.maxRounds = maxRounds;

  // Set initial timer duration based on difficulty
  const baseTime = difficulty === "easy" ? 90 : (difficulty === "medium" ? 120 : 180);
  gameState.maxTimer = baseTime;
  gameState.roundTimer = baseTime;
  gameState.timerRunning = false;
  gameState.activeTeamId = null;
  gameState.winner = null;

  // Option to completely sweep team configurations
  if (clearScores) {
    gameState.currentRound = 1;
    gameState.teams.blue.score = 0;
    gameState.teams.blue.timeUsed = 0;
    gameState.teams.blue.status = "idle";
    gameState.teams.red.score = 0;
    gameState.teams.red.timeUsed = 0;
    gameState.teams.red.status = "idle";
  } else {
    // Keep score but clear active play state
    gameState.teams.blue.status = "idle";
    gameState.teams.red.status = "idle";
  }

  // Clear drawings and interactive grids
  gameState.teams.blue.drawPoints = [];
  gameState.teams.red.drawPoints = [];
  
  const gSize = difficulty === "easy" ? 3 : 4;
  gameState.teams.blue.technicalGrid = Array(gSize * gSize).fill(0);
  gameState.teams.red.technicalGrid = Array(gSize * gSize).fill(0);

  // Trigger generator for the mission
  try {
    gameState.currentMission = await generateMissionWithAI(
      gameState.missionType,
      gameState.difficulty,
      gameState.theme
    );
  } catch (err) {
    gameState.currentMission = PRESET_MISSIONS[0];
  }

  gameState.lastUpdated = Date.now();
  res.json({ success: true, gameState });
});

// Trigger new AI mission with existing settings
app.post("/api/game-state/trigger-ai", async (req, res) => {
  try {
    const mission = await generateMissionWithAI(
      gameState.missionType,
      gameState.difficulty,
      gameState.theme
    );
    gameState.currentMission = mission;
    
    // Clear grids/sketches
    const gSize = mission.gridSize || (gameState.difficulty === "easy" ? 3 : 4);
    gameState.teams.blue.technicalGrid = Array(gSize * gSize).fill(0);
    gameState.teams.red.technicalGrid = Array(gSize * gSize).fill(0);
    gameState.teams.blue.drawPoints = [];
    gameState.teams.red.drawPoints = [];
    
    // Stop timers
    gameState.timerRunning = false;
    gameState.roundTimer = gameState.maxTimer;

    gameState.lastUpdated = Date.now();
    res.json({ success: true, mission });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate AI mission" });
  }
});

// Join a specific team's player slot
app.post("/api/game-state/join", (req, res) => {
  const { teamId, role } = req.body;
  if (teamId !== "blue" && teamId !== "red") {
    return res.status(400).json({ error: "Invalid team" });
  }
  const rNum = parseInt(role);
  if (rNum !== 1 && rNum !== 2 && rNum !== 3) {
    return res.status(400).json({ error: "Invalid role" });
  }

  // Check if taken
  if (gameState.teams[teamId].players[rNum]) {
    // If user claims they are already in, it's fine (non-exclusive lobby slot refresh helper)
    // For local ease-of-use we let them seize it, which is perfect for debug or reset
  }

  gameState.teams[teamId].players[rNum] = true;
  gameState.lastUpdated = Date.now();
  res.json({ success: true, gameState });
});

// Leave slot
app.post("/api/game-state/leave", (req, res) => {
  const { teamId, role } = req.body;
  if (teamId === "blue" || teamId === "red") {
    const rNum = parseInt(role);
    if (rNum === 1 || rNum === 2 || rNum === 3) {
      gameState.teams[teamId].players[rNum] = false;
    }
  }
  gameState.lastUpdated = Date.now();
  res.json({ success: true, gameState });
});

// Start mission countdown for a team
app.post("/api/game-state/start", (req, res) => {
  const { teamId } = req.body;
  if (teamId !== "blue" && teamId !== "red") {
    return res.status(400).json({ error: "Invalid team selection" });
  }

  gameState.activeTeamId = teamId;
  gameState.roundTimer = gameState.maxTimer;
  gameState.timerRunning = true;
  gameState.teams[teamId].status = "playing";
  gameState.teams[teamId].drawPoints = [];

  const gSize = gameState.currentMission?.gridSize || (gameState.difficulty === "easy" ? 3 : 4);
  gameState.teams[teamId].technicalGrid = Array(gSize * gSize).fill(0);

  gameState.lastUpdated = Date.now();
  res.json({ success: true, gameState });
});

// Draw points streamer (Role 1 to Role 2 visual canvas stream)
app.post("/api/game-state/draw", (req, res) => {
  const { teamId, points, isClear } = req.body;
  if (teamId !== "blue" && teamId !== "red") {
    return res.status(400).json({ error: "Invalid team" });
  }

  if (isClear) {
    gameState.teams[teamId].drawPoints = [];
  } else if (Array.isArray(points)) {
    gameState.teams[teamId].drawPoints.push(...points);
  }
  
  gameState.lastUpdated = Date.now();
  res.json({ success: true });
});

// Submit/modify active cell grids by Role 3
app.post("/api/game-state/grid", (req, res) => {
  const { teamId, gridIndex, value } = req.body;
  if (teamId !== "blue" && teamId !== "red") {
    return res.status(400).json({ error: "Invalid team" });
  }

  const team = gameState.teams[teamId];
  if (gridIndex >= 0 && gridIndex < team.technicalGrid.length) {
    team.technicalGrid[gridIndex] = value ? 1 : 0;
  }

  // Automated checker for technical mission success!
  if (gameState.currentMission && gameState.currentMission.type === "technical" && gameState.timerRunning && gameState.activeTeamId === teamId) {
    const solution = gameState.currentMission.solutionGrid;
    const current = team.technicalGrid;
    
    let matches = true;
    if (solution && solution.length === current.length) {
      for (let i = 0; i < solution.length; i++) {
        if (solution[i] !== current[i]) {
          matches = false;
          break;
        }
      }
    } else {
      matches = false;
    }

    if (matches) {
      // MATCH FOUND! Auto stop timer & win
      gameState.timerRunning = false;
      team.status = "completed";
      // Score calculation: remaining timer value + difficulty bonus
      const diffBonus = gameState.difficulty === "easy" ? 100 : (gameState.difficulty === "medium" ? 200 : 350);
      team.score = gameState.roundTimer + diffBonus;
      team.timeUsed = gameState.maxTimer - gameState.roundTimer;
      gameState.activeTeamId = null;
      
      // Auto check overall metrics if both rounds completed
      checkFinalScores();
    }
  }

  gameState.lastUpdated = Date.now();
  res.json({ success: true, isMatched: team.status === "completed", currentGrid: team.technicalGrid });
});

// Host manually stamps a physical mission result
app.post("/api/game-state/manual-score", (req, res) => {
  const { teamId, outcome } = req.body; // 'success' or 'fail'
  if (teamId !== "blue" && teamId !== "red") {
    return res.status(400).json({ error: "Invalid team" });
  }

  const team = gameState.teams[teamId];
  gameState.timerRunning = false;
  gameState.activeTeamId = null;

  if (outcome === "success") {
    team.status = "completed";
    const diffBonus = gameState.difficulty === "easy" ? 100 : (gameState.difficulty === "medium" ? 200 : 350);
    // Score based on speed remaining
    team.score = gameState.roundTimer + diffBonus;
    team.timeUsed = gameState.maxTimer - gameState.roundTimer;
  } else {
    team.status = "failed";
    team.score = 0;
    team.timeUsed = gameState.maxTimer;
  }

  // Check absolute final round metrics
  checkFinalScores();

  gameState.lastUpdated = Date.now();
  res.json({ success: true, gameState });
});

// Helper: Calculate if round finished and choose winner
function checkFinalScores() {
  const blue = gameState.teams.blue;
  const red = gameState.teams.red;

  // Let's decide winner if both squads have run
  if (blue.status !== "idle" && blue.status !== "playing" && red.status !== "idle" && red.status !== "playing") {
    // Both done playing this round!
    if (blue.status === "completed" && red.status !== "completed") {
      gameState.winner = "blue";
    } else if (red.status === "completed" && blue.status !== "completed") {
      gameState.winner = "red";
    } else if (blue.status === "completed" && red.status === "completed") {
      // Both succeeded, compare timer speed
      if (blue.timeUsed < red.timeUsed) {
        gameState.winner = "blue";
      } else if (red.timeUsed < blue.timeUsed) {
        gameState.winner = "red";
      } else {
        gameState.winner = "draw";
      }
    } else {
      // Both failed
      gameState.winner = "draw";
    }
  }
}

// Vite integration / Static production assets pipeline setup
async function startServer() {
  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Silent Mission Full-Stack Server booted successfully!`);
    console.log(`Port: ${PORT}`);
    console.log(`Network Mode: Host-Centric Ingress Active`);
  });
}

startServer();

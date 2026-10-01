/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createStateMiddleware, currentGame } from "./backend/state-store.js";
import dotenv from "dotenv";
import { GameState, Mission, DrawPoint } from "./src/types";

dotenv.config();

// Initialize express app
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Multi-role game state in memory
const initialState: GameState = {
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

// CURATED BILINGUAL CLASSROOM CHALLENGES
const PRESET_MISSIONS: Mission[] = [
  // --- EASY ---
  {
    id: "class_easy_1",
    type: "physical",
    difficulty: "easy",
    title: "Line Shortest to Tallest",
    title_ar: "طابور الأطوال",
    role1_instruction: "Instruct your team to make a straight line in the classroom from shortest to tallest.",
    role1_instruction_ar: "وجّه فريقك لتشكيل صف مستمر في الفصل من الأقصر قامة إلى الأطول قامة.",
    role3_interface: "none",
    solutionNotes: "Verify students have stood in a perfect height order from shortest to tallest.",
    solutionNotes_ar: "تأكد من وقوف الطلاب في صف مرتب تصاعديًا حسب الطول."
  },
  {
    id: "class_easy_2",
    type: "physical",
    difficulty: "easy",
    title: "Find Red & Black Shirts",
    title_ar: "أصحاب اللون الأسود",
    role1_instruction: "Instruct Executor to find and stand next to 3 students in the classroom wearing black.",
    role1_instruction_ar: "وجّه المنفذ للبحث عن ٣ طلاب يرتدون اللون الأسود والوقوف بجانبهم.",
    role3_interface: "none",
    solutionNotes: "Verify the student stands next to exactly 3 classmates wearing black shirts.",
    solutionNotes_ar: "تأكد من وقوف الطالب بجانب ٣ طلاب يرتدون ملابس سوداء."
  },
  {
    id: "class_easy_3",
    type: "physical",
    difficulty: "easy",
    title: "Form Groups of Four",
    title_ar: "مجموعات من أربعة",
    role1_instruction: "Instruct Executor to quickly form a group of exactly four students in the room.",
    role1_instruction_ar: "وجّه المنفذ لتشكيل مجموعة مكونة من ٤ طلاب فورًا في الصف.",
    role3_interface: "none",
    solutionNotes: "Verify they have successfully gathered in a group of four.",
    solutionNotes_ar: "تأكد من تجمعهم في مجموعة متكاملة من ٤ طلاب."
  },
  {
    id: "class_easy_4",
    type: "physical",
    difficulty: "easy",
    title: "Birthday Order Stand up",
    title_ar: "ترتيب تاريخ الميلاد",
    role1_instruction: "Instruct your team participants to stand in order of their birthday months (January to December).",
    role1_instruction_ar: "وجّه فريقك للوقوف بالترتيب الصحيح حسب أشهر ميلادهم من يناير إلى ديسمبر.",
    role3_interface: "none",
    solutionNotes: "Verify students have lined up correctly by birthday months.",
    solutionNotes_ar: "تأكد من ترتيب وقوفهم الصحيح حسب أشهر الميلاد المتتابعة."
  },

  // --- MEDIUM ---
  {
    id: "class_med_1",
    type: "physical",
    difficulty: "medium",
    title: "Organize Shoes Cleanliness",
    title_ar: "ترتيب نظافة الأحذية",
    role1_instruction: "Instruct your teammates to organize themselves in a line from cleanest shoes to least clean shoes.",
    role1_instruction_ar: "وجّه زملائك لتشكيل صف مرتب من الأكثر نظافة في الحذاء إلى الأقل نظافة.",
    role3_interface: "none",
    solutionNotes: "Verify the order of cleanest to muddiest shoes in the line.",
    solutionNotes_ar: "تأكد من صحة الترتيب من الحذاء الأنظف إلى الأقل نظافة."
  },
  {
    id: "class_med_2",
    type: "physical",
    difficulty: "medium",
    title: "Sequence Verbal Instructions",
    title_ar: "سلسلة الحركات اللفظية",
    role1_instruction: "Teammate must: 1. Touch a window, 2. Clap high twice, and 3. Raise both hands.",
    role1_instruction_ar: "يجب على زميلك: ١. لمس النافذة، ٢. التصفيق عاليًا مرتين، ٣. رفع كلتا اليدين للأعلى.",
    role3_interface: "none",
    solutionNotes: "Verify they performed all 3 verbal instructions in the correct sequence.",
    solutionNotes_ar: "تأكد من تأديتهم للخطوات الثلاث بالترتيب الصحيح تمامًا."
  },
  {
    id: "class_med_3",
    type: "physical",
    difficulty: "medium",
    title: "Organize by Category Bags",
    title_ar: "تصنيف الحقائب",
    role1_instruction: "Group students on your team by their school bag colors in separate parts of the classroom.",
    role1_instruction_ar: "صنّف طلاب فريقك في مجموعات منفصلة في الفصل بناءً على ألوان حقائبهم المدرسية.",
    role3_interface: "none",
    solutionNotes: "Verify they have grouped themselves correctly by bag colors.",
    solutionNotes_ar: "تأكد من تجمع كل لون حقيبة في جهة مخصصة للفصل."
  },

  // --- HARD ---
  {
    id: "class_hard_1",
    type: "physical",
    difficulty: "hard",
    title: "Arrange Alphabetical Names",
    title_ar: "الترتيب الأبجدي للأسماء",
    role1_instruction: "Sequence the team in a straight line alphabetically by their first names in total silence.",
    role1_instruction_ar: "رتّب أعضاء فريقك في خط مستقيم أبجديًا حسب الحرف الأول من أسمائهم الأول بالكامل في صمت تام.",
    role3_interface: "none",
    solutionNotes: "Verify the team is arranged perfectly in alphabetical order by first names.",
    solutionNotes_ar: "تأكد من صحة الترتيب الأبجدي للأسماء من البداية للنهاية."
  },
  {
    id: "class_hard_2",
    type: "physical",
    difficulty: "hard",
    title: "Pass Book No Hands Circle",
    title_ar: "تمرير الكتاب بلا أيدي",
    role1_instruction: "Form a tight circle and pass a textbook around to everyone without anyone using their hands!",
    role1_instruction_ar: "شكلوا دائرة ضيقة ومرروا كتابًا مدرسيًا بينكم جميعًا دون أن يستخدم أي شخص يديه أبدًا!",
    role3_interface: "none",
    solutionNotes: "Verify they passed the book in a circle to everyone using only forearms/elbows/etc without hands.",
    solutionNotes_ar: "تأكد من تمرير الكتاب بنجاح بين الطلاب دون لمسه بالأيدي."
  },
  {
    id: "class_hard_3",
    type: "physical",
    difficulty: "hard",
    title: "Multi-Step Mirror Defense",
    title_ar: "مهمة الدفاع المتتابع",
    role1_instruction: "Executor must: 1. Put hands on head, 2. Stand on one leg on a chair, 3. Point other hand high.",
    role1_instruction_ar: "يجب على المنفذ: ١. وضع يديه على رأسه، ٢. الوقوف على رجل واحدة على الكرسي، ٣. توجيه اليد الأخرى للأعلى.",
    role3_interface: "none",
    solutionNotes: "Verify Executor has hands on head while standing on one leg on a chair with the other arm pointed high.",
    solutionNotes_ar: "تأكد من وقوف المنفذ على كرسي على ساق واحدة ممثلاً هذه الوضعية بدقة."
  }
];

app.use("/api/game-state", createStateMiddleware(initialState));

// Select a bilingual classroom mission without an external AI service.
async function generateMission(type: 'technical' | 'physical', difficulty: 'easy' | 'medium' | 'hard', theme: string): Promise<Mission> {
  const matches = PRESET_MISSIONS.filter(m => m.difficulty === difficulty);
  const chosen = matches[Math.floor(Math.random() * matches.length)] || PRESET_MISSIONS[0];
  return { ...chosen, id: `${chosen.id}_${Date.now()}`, title: `${chosen.title} (${theme || "Standard"})` };
}

// ----- REST API ENDPOINTS -----

// Fetch complete central game state
app.get("/api/game-state", (req, res) => {
  res.json(currentGame().state);
});

// Configure and reset game settings, select/generate a mission
app.post("/api/game-state/init", async (req, res) => {
  const { difficulty, missionType, theme, maxRounds, clearScores } = req.body;
  
  if (difficulty) currentGame().state.difficulty = difficulty;
  if (missionType) currentGame().state.missionType = missionType;
  if (theme) currentGame().state.theme = theme;
  if (maxRounds) currentGame().state.maxRounds = maxRounds;

  // Set initial timer duration based on difficulty
  const baseTime = difficulty === "easy" ? 90 : (difficulty === "medium" ? 120 : 180);
  currentGame().state.maxTimer = baseTime;
  currentGame().state.roundTimer = baseTime;
  currentGame().state.timerRunning = false;
  currentGame().state.activeTeamId = null;
  currentGame().state.winner = null;

  // Option to completely sweep team configurations
  if (clearScores) {
    currentGame().state.currentRound = 1;
    currentGame().state.teams.blue.score = 0;
    currentGame().state.teams.blue.timeUsed = 0;
    currentGame().state.teams.blue.status = "idle";
    currentGame().state.teams.red.score = 0;
    currentGame().state.teams.red.timeUsed = 0;
    currentGame().state.teams.red.status = "idle";
  } else {
    // Keep score but clear active play state
    currentGame().state.teams.blue.status = "idle";
    currentGame().state.teams.red.status = "idle";
  }

  // Clear drawings and interactive grids
  currentGame().state.teams.blue.drawPoints = [];
  currentGame().state.teams.red.drawPoints = [];
  
  const gSize = difficulty === "easy" ? 3 : 4;
  currentGame().state.teams.blue.technicalGrid = Array(gSize * gSize).fill(0);
  currentGame().state.teams.red.technicalGrid = Array(gSize * gSize).fill(0);

  // Trigger generator for the mission
  try {
    currentGame().state.currentMission = await generateMission(
      currentGame().state.missionType,
      currentGame().state.difficulty,
      currentGame().state.theme
    );
  } catch (err) {
    currentGame().state.currentMission = PRESET_MISSIONS[0];
  }

  currentGame().state.lastUpdated = Date.now();
  res.json({ success: true, gameState: currentGame().state });
});

// Trigger new AI mission with existing settings
app.post("/api/game-state/new-mission", async (req, res) => {
  try {
    const mission = await generateMission(
      currentGame().state.missionType,
      currentGame().state.difficulty,
      currentGame().state.theme
    );
    currentGame().state.currentMission = mission;
    
    // Clear grids/sketches
    const gSize = mission.gridSize || (currentGame().state.difficulty === "easy" ? 3 : 4);
    currentGame().state.teams.blue.technicalGrid = Array(gSize * gSize).fill(0);
    currentGame().state.teams.red.technicalGrid = Array(gSize * gSize).fill(0);
    currentGame().state.teams.blue.drawPoints = [];
    currentGame().state.teams.red.drawPoints = [];
    
    // Stop timers
    currentGame().state.timerRunning = false;
    currentGame().state.roundTimer = currentGame().state.maxTimer;

    currentGame().state.lastUpdated = Date.now();
    res.json({ success: true, mission });
  } catch (error) {
    res.status(500).json({ error: "Failed to select mission" });
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
  if (currentGame().state.teams[teamId].players[rNum]) {
    // If user claims they are already in, it's fine (non-exclusive lobby slot refresh helper)
    // For local ease-of-use we let them seize it, which is perfect for debug or reset
  }

  currentGame().state.teams[teamId].players[rNum] = true;
  currentGame().state.lastUpdated = Date.now();
  res.json({ success: true, gameState: currentGame().state });
});

// Leave slot
app.post("/api/game-state/leave", (req, res) => {
  const { teamId, role } = req.body;
  if (teamId === "blue" || teamId === "red") {
    const rNum = parseInt(role);
    if (rNum === 1 || rNum === 2 || rNum === 3) {
      currentGame().state.teams[teamId].players[rNum] = false;
    }
  }
  currentGame().state.lastUpdated = Date.now();
  res.json({ success: true, gameState: currentGame().state });
});

// Start mission countdown for a team
app.post("/api/game-state/start", (req, res) => {
  const { teamId } = req.body;
  if (teamId !== "blue" && teamId !== "red") {
    return res.status(400).json({ error: "Invalid team selection" });
  }

  currentGame().state.activeTeamId = teamId;
  currentGame().state.roundTimer = currentGame().state.maxTimer;
  currentGame().state.timerRunning = true;
  currentGame().state.teams[teamId].status = "playing";
  currentGame().state.teams[teamId].drawPoints = [];

  const gSize = currentGame().state.currentMission?.gridSize || (currentGame().state.difficulty === "easy" ? 3 : 4);
  currentGame().state.teams[teamId].technicalGrid = Array(gSize * gSize).fill(0);

  currentGame().state.lastUpdated = Date.now();
  res.json({ success: true, gameState: currentGame().state });
});

// Draw points streamer (Role 1 to Role 2 visual canvas stream)
app.post("/api/game-state/draw", (req, res) => {
  const { teamId, points, isClear } = req.body;
  if (teamId !== "blue" && teamId !== "red") {
    return res.status(400).json({ error: "Invalid team" });
  }

  if (isClear) {
    currentGame().state.teams[teamId].drawPoints = [];
  } else if (Array.isArray(points)) {
    currentGame().state.teams[teamId].drawPoints.push(...points);
  }
  
  currentGame().state.lastUpdated = Date.now();
  res.json({ success: true });
});

// Submit/modify active cell grids by Role 3
app.post("/api/game-state/grid", (req, res) => {
  const { teamId, gridIndex, value } = req.body;
  if (teamId !== "blue" && teamId !== "red") {
    return res.status(400).json({ error: "Invalid team" });
  }

  const team = currentGame().state.teams[teamId];
  if (gridIndex >= 0 && gridIndex < team.technicalGrid.length) {
    team.technicalGrid[gridIndex] = value ? 1 : 0;
  }

  // Automated checker for technical mission success!
  if (currentGame().state.currentMission && currentGame().state.currentMission.type === "technical" && currentGame().state.timerRunning && currentGame().state.activeTeamId === teamId) {
    const solution = currentGame().state.currentMission.solutionGrid;
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
      currentGame().state.timerRunning = false;
      team.status = "completed";
      // Score calculation: remaining timer value + difficulty bonus
      const diffBonus = currentGame().state.difficulty === "easy" ? 100 : (currentGame().state.difficulty === "medium" ? 200 : 350);
      team.score = currentGame().state.roundTimer + diffBonus;
      team.timeUsed = currentGame().state.maxTimer - currentGame().state.roundTimer;
      currentGame().state.activeTeamId = null;
      
      // Auto check overall metrics if both rounds completed
      checkFinalScores();
    }
  }

  currentGame().state.lastUpdated = Date.now();
  res.json({ success: true, isMatched: team.status === "completed", currentGrid: team.technicalGrid });
});

// Host manually stamps a physical mission result
app.post("/api/game-state/manual-score", (req, res) => {
  const { teamId, outcome } = req.body; // 'success' or 'fail'
  if (teamId !== "blue" && teamId !== "red") {
    return res.status(400).json({ error: "Invalid team" });
  }

  const team = currentGame().state.teams[teamId];
  currentGame().state.timerRunning = false;
  currentGame().state.activeTeamId = null;

  if (outcome === "success") {
    team.status = "completed";
    const diffBonus = currentGame().state.difficulty === "easy" ? 100 : (currentGame().state.difficulty === "medium" ? 200 : 350);
    // Score based on speed remaining
    team.score = currentGame().state.roundTimer + diffBonus;
    team.timeUsed = currentGame().state.maxTimer - currentGame().state.roundTimer;
  } else {
    team.status = "failed";
    team.score = 0;
    team.timeUsed = currentGame().state.maxTimer;
  }

  // Check absolute final round metrics
  checkFinalScores();

  currentGame().state.lastUpdated = Date.now();
  res.json({ success: true, gameState: currentGame().state });
});

// Helper: Calculate if round finished and choose winner
function checkFinalScores() {
  const blue = currentGame().state.teams.blue;
  const red = currentGame().state.teams.red;

  // Let's decide winner if both squads have run
  if (blue.status !== "idle" && blue.status !== "playing" && red.status !== "idle" && red.status !== "playing") {
    // Both done playing this round!
    if (blue.status === "completed" && red.status !== "completed") {
      currentGame().state.winner = "blue";
    } else if (red.status === "completed" && blue.status !== "completed") {
      currentGame().state.winner = "red";
    } else if (blue.status === "completed" && red.status === "completed") {
      // Both succeeded, compare timer speed
      if (blue.timeUsed < red.timeUsed) {
        currentGame().state.winner = "blue";
      } else if (red.timeUsed < blue.timeUsed) {
        currentGame().state.winner = "red";
      } else {
        currentGame().state.winner = "draw";
      }
    } else {
      // Both failed
      currentGame().state.winner = "draw";
    }
  }
}

// Vite integration / Static production assets pipeline setup
async function startServer() {
  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
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

if (!process.env.VERCEL) startServer();

export default app;

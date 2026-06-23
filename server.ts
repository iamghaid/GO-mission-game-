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
    const matches = PRESET_MISSIONS.filter(m => m.difficulty === difficulty);
    const chosen = matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : PRESET_MISSIONS[0];
    return {
      ...chosen,
      id: `${chosen.id}_fallback_${timestamp}`,
      title: `${chosen.title} (${theme || "Standard"})`
    };
  }

  const systemInstruction = `You are a creative, fun game master for 'GO mission' - a classroom icebreaker team game in the style of Kahoot and Blooket.
Generate a brand new, hilarious, incredibly distinct classroom communication mission.
Generate ONLY physical or spoken icebreaker tasks that require communication.
CRITICAL: Do NOT generate drawings, canvas activities, shape puzzles, or grids. This is an active classroom game.
The mission text MUST be understood in less than 5 seconds, use simple English, and be suitable for children and students. Avoid complicated or rare wording.

CRITICAL CONSTRAINT: You must write BOTH English and Arabic translations for the fields title, role1_instruction, and solutionNotes.

Return a JSON object that strictly respects this TypeScript structure:
{
  "id": "ai_gen_${difficulty}_${timestamp}",
  "type": "physical",
  "difficulty": "${difficulty}",
  "title": "Clear, fun game name (In simple English, e.g. 'Silent Mirror Pose')",
  "title_ar": "اسم اللعبة باللغة العربية (سهل، بسيط، وممتع)",
  "role1_instruction": "Deeply descriptive secrets in simple, clear, easy English. Explain what they must do clearly so kids can easily follow. Keep it short (max 2 sentences)!",
  "role1_instruction_ar": "تعليمات سرية باللغة العربية البسيطة والمفهومة للطلاب. اشرح المطلوب بأسلوب سهل وشيق ومختصر جدًا (جملتين كحد أقصى)!",
  "role3_interface": "none",
  "gridSize": 0,
  "solutionGrid": [],
  "solutionNotes": "Teacher/Host guide explaining how they can check if the team finished correctly (In simple English).",
  "solutionNotes_ar": "دليل المعلم باللغة العربية للتأكد من صحة الحل"
}`;

  let attempts = 3;
  for (let i = 0; i < attempts; i++) {
    try {
      const prompt = `Create a brand new and unique ${difficulty} classroom communication mission with the flavor of theme: ${theme}`;
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
              title_ar: { type: Type.STRING },
              role1_instruction: { type: Type.STRING },
              role1_instruction_ar: { type: Type.STRING },
              role3_interface: { type: Type.STRING },
              gridSize: { type: Type.INTEGER },
              solutionNotes: { type: Type.STRING },
              solutionNotes_ar: { type: Type.STRING }
            },
            required: [
              "id", "type", "difficulty", "title", "title_ar", 
              "role1_instruction", "role1_instruction_ar", 
              "role3_interface", "solutionNotes", "solutionNotes_ar"
            ]
          }
        }
      });

      const bodyText = response.text?.trim() || "";
      const parsed = JSON.parse(bodyText) as Mission;
      parsed.type = "physical"; // enforce
      parsed.role3_interface = "none"; // enforce
      console.log("Successfully generated AI Mission:", parsed.title);
      return parsed;
    } catch (error) {
      console.warn(`Gemini AI generation attempt ${i + 1} failed:`, error);
      if (i === attempts - 1) {
        console.error("All Gemini AI generation attempts failed, using fallback mission.");
        const matches = PRESET_MISSIONS.filter(m => m.difficulty === difficulty);
        const chosen = matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : PRESET_MISSIONS[0];
        return {
          ...chosen,
          id: `${chosen.id}_fallback_err_${timestamp}`,
          title: `${chosen.title} (${theme || "AI Classroom Theme"}) (AI Fallback)`
        };
      }
      // Wait before next attempt (exponential backoff: 500ms, then 1000ms)
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
    }
  }
  // Fallback signature to satisfy typescript return-type check
  const matches = PRESET_MISSIONS.filter(m => m.difficulty === difficulty);
  const chosen = matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : PRESET_MISSIONS[0];
  return {
    ...chosen,
    id: `${chosen.id}_fallback_err_unreachable_${timestamp}`,
    title: `${chosen.title} (${theme || "AI Classroom Theme"}) (AI Fallback)`
  };
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

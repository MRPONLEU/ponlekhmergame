import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini SDK server-side only
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables.");
}

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// ========================================================
// Tug of War Real-time Remote Controller Sync Store & APIs
// ========================================================
interface TugSubmission {
  id: string;
  team: 1 | 2;
  answer: string;
  timestamp: number;
}

interface TugRoomState {
  roomId: string;
  gameMode: 'math' | 'quiz';
  t1Question: any;
  t2Question: any;
  t1Connected: boolean;
  t2Connected: boolean;
  t1LastPing: number;
  t2LastPing: number;
  submissions: TugSubmission[];
  updatedAt: number;
}

const tugRooms = new Map<string, TugRoomState>();

// Create or update room state
app.post("/api/tug/state", (req, res) => {
  const { roomId, gameMode, t1Question, t2Question } = req.body;
  if (!roomId) {
    return res.status(400).json({ error: "roomId is required" });
  }

  let room = tugRooms.get(roomId);
  const now = Date.now();

  if (!room) {
    room = {
      roomId,
      gameMode: gameMode || 'math',
      t1Question: t1Question || null,
      t2Question: t2Question || null,
      t1Connected: false,
      t2Connected: false,
      t1LastPing: 0,
      t2LastPing: 0,
      submissions: [],
      updatedAt: now,
    };
    tugRooms.set(roomId, room);
  } else {
    if (gameMode !== undefined) room.gameMode = gameMode;
    if (t1Question !== undefined) room.t1Question = t1Question;
    if (t2Question !== undefined) room.t2Question = t2Question;
    room.updatedAt = now;
  }

  room.t1Connected = now - room.t1LastPing < 8000;
  room.t2Connected = now - room.t2LastPing < 8000;

  res.json({
    success: true,
    room: {
      roomId: room.roomId,
      gameMode: room.gameMode,
      t1Question: room.t1Question,
      t2Question: room.t2Question,
      t1Connected: room.t1Connected,
      t2Connected: room.t2Connected,
      submissionsCount: room.submissions.length,
    }
  });
});

// Ping endpoint for controllers
app.post("/api/tug/ping", (req, res) => {
  const { roomId, team } = req.body;
  if (!roomId || (team !== 1 && team !== 2)) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  let room = tugRooms.get(roomId);
  const now = Date.now();

  if (!room) {
    room = {
      roomId,
      gameMode: 'math',
      t1Question: null,
      t2Question: null,
      t1Connected: false,
      t2Connected: false,
      t1LastPing: now,
      t2LastPing: now,
      submissions: [],
      updatedAt: now,
    };
    tugRooms.set(roomId, room);
  }

  if (team === 1) {
    room.t1LastPing = now;
    room.t1Connected = true;
  } else {
    room.t2LastPing = now;
    room.t2Connected = true;
  }

  res.json({
    success: true,
    gameMode: room.gameMode,
    question: team === 1 ? room.t1Question : room.t2Question,
  });
});

// Submit answer endpoint for Tablet controllers
app.post("/api/tug/submit", (req, res) => {
  const { roomId, team, answer } = req.body;
  if (!roomId || (team !== 1 && team !== 2) || answer === undefined) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  let room = tugRooms.get(roomId);
  if (!room) {
    room = {
      roomId,
      gameMode: 'math',
      t1Question: null,
      t2Question: null,
      t1Connected: false,
      t2Connected: false,
      t1LastPing: Date.now(),
      t2LastPing: Date.now(),
      submissions: [],
      updatedAt: Date.now(),
    };
    tugRooms.set(roomId, room);
  }

  const sub: TugSubmission = {
    id: Math.random().toString(36).substring(2, 9),
    team,
    answer: String(answer),
    timestamp: Date.now(),
  };

  room.submissions.push(sub);
  if (room.submissions.length > 50) {
    room.submissions.shift();
  }

  res.json({ success: true, submissionId: sub.id });
});

// Main screen fetches pending submissions
app.get("/api/tug/submissions", (req, res) => {
  const { roomId, since } = req.query;
  if (!roomId) {
    return res.status(400).json({ error: "roomId is required" });
  }

  const room = tugRooms.get(String(roomId));
  if (!room) {
    return res.json({ submissions: [], t1Connected: false, t2Connected: false });
  }

  const sinceTime = Number(since) || 0;
  const newSubs = room.submissions.filter(s => s.timestamp > sinceTime);

  const now = Date.now();
  res.json({
    submissions: newSubs,
    t1Connected: now - room.t1LastPing < 8000,
    t2Connected: now - room.t2LastPing < 8000,
  });
});

// API: Generate Word list based on a topic or query
app.post("/api/ai/generate-words", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: "Gemini API key is not configured on the server." });
  }

  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  try {
    const prompt = `Generate a list of exactly 6 Khmer vocabulary words related to the topic: "${topic}".
For each word, provide:
1. The Khmer word itself.
2. The word type (ប្រភេទពាក្យ) in Khmer (e.g. នាម, កិរិយាសព្ទ, គុណនាម).
3. An array of logical parts/graphemes of the word to be used for a scrambling spelling game (e.g. for "សត្វ" it could be ["ស", "ត", "្វ"], or for "តោ" it is ["ត", "ោ"]). Split the word into separate letter/vowel/sub-consonant blocks that can be arranged to reconstruct the word.
4. A simple Khmer definition suited for primary school students.
5. An example sentence in Khmer using that word.

Ensure all outputs are in Khmer.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of Khmer vocabulary words",
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              wordType: { type: Type.STRING, description: "The grammatical type of the word in Khmer (e.g. នាម)" },
              parts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Separate letters, sub-consonants, and vowels that combine to form the word"
              },
              definition: { type: Type.STRING },
              example: { type: Type.STRING }
            },
            required: ["word", "wordType", "parts", "definition", "example"]
          }
        },
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response content from Gemini.");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.error("Error generating words:", error);
    res.status(500).json({ error: error.message || "Failed to generate words from Gemini." });
  }
});

// API: Generate multiple choice quiz based on word list
app.post("/api/ai/generate-quiz", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: "Gemini API key is not configured on the server." });
  }

  const { words } = req.body;
  if (!words || !Array.isArray(words) || words.length === 0) {
    return res.status(400).json({ error: "A valid list of words is required" });
  }

  try {
    const wordListString = words.map(w => `${w.word}: ${w.definition}`).join("\n");
    const prompt = `Generate a multiple choice quiz of exactly 5 questions based on these Khmer words and definitions:
${wordListString}

For each question:
1. Provide a clear question in Khmer testing either the meaning or the spelling of one of the words.
2. Provide exactly 4 options in Khmer.
3. Provide the index of the correct answer (0 to 3).
4. Provide a simple explanation in Khmer explaining why that option is correct.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "Multiple choice quiz questions",
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              answerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "answerIndex", "explanation"]
          }
        },
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response content from Gemini.");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.error("Error generating quiz:", error);
    res.status(500).json({ error: error.message || "Failed to generate quiz from Gemini." });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

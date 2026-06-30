// src/utils/geminiAgent.js
// Requires: npm install @google/generative-ai

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export async function analyzeTask({ name, deadline, category, notes, userPriority }) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursLeft = Math.max(
    0,
    Math.round((deadlineDate - now) / (1000 * 60 * 60))
  );

  const nowString = now.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const priorityHint = userPriority
    ? `The user set this as "${userPriority}" priority — still provide subtasks and timing, but respect their urgency level in suggestedStart.`
    : "";

  const prompt = `
You are a proactive productivity AI. A user has a task they need to complete.

Current Time: "${nowString}"
Task: "${name}"
Category: "${category}"
Deadline: "${deadline}" (${hoursLeft} hours from now)
Notes: "${notes || "None"}"
${priorityHint}

Analyze this task and respond ONLY with valid JSON, no markdown, no explanation:
{
  "priority": <integer 1-10, where 10 is most critical>,
  "priorityLevel": "<one of: critical | high | medium | low>",
  "reason": "<1 sentence explaining the priority score>",
  "timeEstimate": "<e.g. 3 hours>",
  "suggestedStart": "<e.g. Start today by 4 PM>",
  "subtasks": [
    "<concrete actionable step 1>",
    "<concrete actionable step 2>",
    "<concrete actionable step 3>",
    "<concrete actionable step 4>"
  ]
}

Rules:
- priority 9-10 = less than 6 hours left OR extremely high stakes
- priority 7-8 = 6-24 hours left OR high stakes
- priority 4-6 = 1-3 days left
- priority 1-3 = 3+ days and low stakes
- subtasks must be specific and actionable, not generic
- suggestedStart must be concrete with a time and date in the future relative to the Current Time (today is ${nowString}). Under no circumstances suggest a starting date or year in the past.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Gemini error:", err);
    // Fallback so the app doesn't crash
    return {
      priority: 5,
      priorityLevel: "medium",
      reason: "Could not reach AI — using default priority.",
      timeEstimate: "Unknown",
      suggestedStart: "Start as soon as possible",
      subtasks: [
        "Break the task into smaller pieces",
        "Set a timer and start working",
        "Review progress halfway through",
        "Final check before submitting",
      ],
    };
  }
}

export async function rescueTask({ name, hoursLeft, remainingSubtasks, notes }) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are a last-minute emergency rescue agent for a student/professional. The user has a critical deadline approaching in ONLY ${hoursLeft} hours and is overwhelmed.

Task Name: "${name}"
Remaining Steps:
${remainingSubtasks.map((s) => `- ${s}`).join("\n")}
Context Notes: "${notes || "None"}"

Reprioritize, trim, and optimize these remaining steps for a quick emergency crunch.
Provide a simplified, hyper-focused list of 2-3 essential steps they can actually finish in the remaining time.
Also provide a short, motivating, direct sentence of encouragement (e.g. "Focus up, you can still pull this off!").

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "reason": "<encouragement and brief explanation of what was simplified>",
  "subtasks": [
    "<essential crunch step 1>",
    "<essential crunch step 2>",
    "<optional crunch step 3>"
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Gemini rescue error:", err);
    return {
      reason: "Emergency mode activated: Simplify your remaining steps and focus on finishing a minimal version!",
      subtasks: remainingSubtasks.slice(0, 2),
    };
  }
}

# Vibe2Ship Hackathon — Context File

## Event
**Vibe2Ship** — organized by Coding Ninjas x Google for Developers

## Timeline
- Build phase: 22nd June, 3:00 PM → 29th June, 2:00 PM (per original guidelines doc)
- **Actual deadline confirmed by Aryan: 30th June, 11:59 PM**
- Mentor session: 24th June 2026, 4:00–6:00 PM (problem walkthroughs, AI Studio guidance)
- Late entries will not be accepted

## Problem Statement Chosen
**"The Last-Minute Life Saver"**

### Background
Students, professionals, and entrepreneurs frequently miss deadlines, assignments, meetings, bill payments, interviews, and important commitments. Existing productivity tools rely on passive reminders that are easy to ignore.

### Challenge
Build an AI-powered productivity companion that proactively assists users in planning, prioritizing, and completing tasks before deadlines are missed — moving beyond traditional reminders toward meaningful action.

### Example features suggested by organizers
- Intelligent task prioritization
- AI-powered scheduling assistance
- Personalized productivity recommendations
- Context-aware reminders
- Calendar integration
- Goal and habit tracking
- Voice-enabled assistance
- Autonomous task planning and execution

### Evaluation focus
Demonstrate how AI can improve productivity by helping users make better decisions and complete tasks more effectively.

## Mandatory Rules
1. Choose one of two problem statements and build a functional solution within the timeline.
2. **Final deployable link must be on Google Cloud** (tools like AI Studio, Antigravity etc. are optional aids, not required).
3. Submissions accepted **only through the BlocksBlock platform** (the platform used for hackathon registration).
4. Use of AI tools, open-source libraries, and public resources is allowed and encouraged — but submission must reflect the participant's own work, understanding, and implementation.

## Mandatory Submission Requirements
1. **Deployed Application Link**
   - Publicly accessible, fully functional, deployed on Google Cloud
   - Must remain live throughout the evaluation period
   - Reference: https://ai.google.dev/gemini-api/docs/aistudio-deploying
2. **GitHub Repository Link**
   - Source code + documentation
3. **Project Description (Google Doc, shared/accessible link)** containing:
   - Problem Statement Selected
   - Solution Overview
   - Key Features
   - Technologies Used
   - Google Technologies Utilized
   - Doc must remain accessible throughout evaluation; organizers may check version history

## Evaluation Matrix (Weightage)
| Criteria | Weight |
|---|---|
| Problem Solving & Impact | 20% |
| Agentic Depth | 20% |
| Innovation & Creativity | 20% |
| Usage of Google Technologies | 15% |
| Product Experience & Design | 10% |
| Technical Implementation | 10% |
| Completeness & Usability | 5% |

Organizers reserve the right to verify originality/functionality and request additional evidence. Jury decisions on shortlisting, rankings, and winners are final and binding.

## Tech Stack Decided
- **Frontend:** React
- **AI model:** Gemini 2.5 Flash (via Google AI Studio API key) — *switched from Gemini 2.0 Flash after discovering it was shut down June 1, 2026*
- **Deployment target:** Google Cloud Run (via Docker + nginx, or `gcloud builds submit`)
- **Design system:** Dark navy (#080C18) background, amber (#F5A623) accent, Space Grotesk + Inter + JetBrains Mono typography

## Project Built: "The Last-Minute Life Saver"
A task management dashboard where:
- User adds a task with name, deadline, category, and optional notes
- Gemini analyzes the task and returns: priority score (1–10), priority level (critical/high/medium/low), reasoning, time estimate, suggested start time, and 4 actionable subtasks
- Each task card shows a **live, ticking countdown** to the deadline (signature feature — turns red and pulses under 6 hours remaining)
- Tasks auto-sort by priority; completed tasks move to a separate section

### Key files
- `src/utils/geminiAgent.js` — Gemini API call + prompt logic
- `src/hooks/useCountdown.js` — live countdown timer hook
- `src/components/AddTaskPanel.js`, `TaskCard.js`, `Dashboard.js`, `Header.js`
- `Dockerfile` + `nginx.conf` — for Cloud Run deployment
- `.env` (not committed) — holds `REACT_APP_GEMINI_API_KEY`

## Known Issues / Gotchas Hit So Far
- Forgot `public/index.html` initially — React build failed without it (fixed)
- Used deprecated `gemini-2.0-flash` model — caused silent fallback to default data (fixed, switched to `gemini-2.5-flash`)
- `.env` file was never created (only `.env.example` existed) — caused "API key not valid" error until `cp .env.example .env` was run and dev server restarted

## Remaining To-Do (as of last check-in)
1. Deploy to Google Cloud Run
2. Push code to GitHub
3. Write the Google Doc project description (problem statement, solution, features, tech used, Google tech used)
4. Submit via BlocksBlock platform before **30th June, 11:59 PM**

## Strategic Notes
- Using Gemini (not Claude) as the AI engine specifically to score well on "Usage of Google Technologies" (15% of grade)
- The live countdown ticker is positioned as the "agentic depth" / "innovation" differentiator vs generic to-do apps
- Given time pressure, deployment should be tackled before further design polish

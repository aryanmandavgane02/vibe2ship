# Project Submission: The Last-Minute Life Saver

## 1. Problem Statement Selected
**The Last-Minute Life Saver (Urgency-Aware Deadline Triaging)**
Students, professionals, and creators frequently miss critical deadlines, assignments, bill payments, and commitments. Existing productivity tools rely on passive, easily ignored push notifications and static lists. They fail to assist the user in taking immediate, structured, and manageable action when a crunch deadline approaches.

---

## 2. Solution Overview
Our solution is **The Last-Minute Life Saver**, a high-fidelity, ambient dark-mode web application that serves as an active, AI-powered deadline copilot. 

Instead of simple alerts, it uses the **Google Gemini API** to analyze tasks, assign objective urgency scores (1–10), and autonomously generate structured checklists (roadmaps) based on the remaining time. 

If a deadline becomes critical, the user can activate **AI Emergency Rescue Mode**, which uses Gemini to dynamically rewrite and compress the roadmap to fit the remaining time. It bridges the gap between passive reminders and real-world execution with ambient visual feedback, circular habit tracking rings, local calendar synchronization, and screen-free voice accessibility.

---

## 3. Key Features

1. **Intelligent Task Prioritization & Urgency-Glows**:
   - Objective AI score scale (1–10) combined with 4-level semantic ranking (Critical, High, Medium, Low).
   - Dashboard card borders display color-matched ambient glowing halos (Red, Orange, Yellow, Green) reflecting task criticality on hover.

2. **Autonomous Task Planning (AI Breakdown)**:
   - Uses Gemini to analyze task scope and decompose complex goals into a custom, manageable subtask checklist.

3. **⚡ AI Emergency Rescue Mode**:
   - If a task timeline enters a critical crunch phase, the AI refactors the roadmap steps in real-time, removing non-essential friction to fit the urgent runway.

4. **🚨 Context-Aware Runway Alert Ticker**:
   - A prominent alert marquee banner at the top of the dashboard highlighting the closest approaching deadline and extracting the immediate next actionable checklist step.

5. **🔊 Accessibility Voice briefings**:
   - Synthesizes and reads aloud task deadlines, AI reasoning, and checklist steps using native speech synthesis for eyes-free task triage.

6. **📅 Google/Local Calendar Sync**:
   - Generates and downloads standardized client-side iCalendar (`.ics`) files on-the-fly to allow seamless imports into Google Calendar or Apple Calendar.

7. **🔥 Runway Streak & Habit widgets**:
   - Tracks daily task completion check-ins to build a consistent habit streak alongside a circular progress-ring showing real-time subtask clearance rates.

8. **🎛 Scroll-Wrapping Time Selectors**:
   - Custom deadline time dials that wrap continuously (scrolling up past `00` wraps to `59`) mimicking premium hardware control wheels.

---

## 4. Technologies Used
- **Frontend Core**: React.js (JavaScript, JSX)
- **Design System & Styling**: Vanilla CSS (Mesh gradients, CSS custom variables, custom SVG radial masks, responsive grid structures)
- **Integrations & Web APIs**:
  - **Web Speech API** (`window.speechSynthesis` for interactive audio briefings)
  - **iCalendar Exporter** (Dynamic `.ics` blob creation and download)
  - **HTML5 Drag/Scroll/Wheel Listeners** (For scroll-wrapping time selectors)
  - **Canvas Confetti** (Interactive gamification animations)
  - **LocalStorage API** (Persistent local task storage & habit tracking)

---

## 5. Google Technologies Utilized

1. **Google Gemini API (`gemini-2.5-flash`)**:
   - Serves as the cognitive engine behind the application.
   - Used to parse task inputs, determine priority level and priority scores (1-10), write custom reasonings, and generate dynamic roadmap step structures.
   - Used to dynamically compress and restructure roadmaps in **AI Emergency Rescue Mode**.

2. **Google Cloud Platform (GCP)**:
   - For deploying the live web application on Google Cloud's Firebase Hosting infrastructure to ensure high availability and fast delivery.

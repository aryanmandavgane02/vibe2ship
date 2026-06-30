import React, { useState, useEffect } from "react";
import { useCountdown } from "../hooks/useCountdown";
import { PRIORITY_LEVELS, scoreFromLevel } from "../utils/priority";

const CATEGORY_ICONS = {
  Work: "💼",
  Study: "📚",
  Personal: "🏠",
  Finance: "💰",
  Health: "❤️",
  Project: "🚀",
  Meeting: "📅",
  Other: "📌",
};

function getProgress(deadline, createdAt) {
  const end = new Date(deadline).getTime();
  const start = createdAt
    ? new Date(createdAt).getTime()
    : end - 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const total = end - start;
  if (total <= 0) return 100;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export default function TaskCard({ task, onRemove, onDone, onRestore, onUpdatePriority, onToggleSubtask, onRescue, style }) {
  const timeLeft = useCountdown(task.deadline);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const progress = getProgress(task.deadline, task.createdAt);
  const isOverdue = task.completedAt
    ? new Date(task.completedAt) > new Date(task.deadline)
    : new Date() > new Date(task.deadline);
  const icon = CATEGORY_ICONS[task.category] || "📌";

  const dateObj = new Date(task.deadline);
  const month = dateObj.toLocaleString("en-IN", { month: "short" }).toUpperCase();
  const day = dateObj.getDate();
  const dayName = dateObj.toLocaleString("en-IN", { weekday: "short" }).toUpperCase();
  const time = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const priorityLabel = task.priorityLevel
    ? task.priorityLevel.charAt(0).toUpperCase() + task.priorityLevel.slice(1)
    : "Priority";

  const handlePriorityChange = (level) => {
    if (level === task.priorityLevel) return;
    onUpdatePriority(task.id, scoreFromLevel(level), level);
  };

  const normalizedSubtasks = (task.subtasks || []).map((s) => {
    if (typeof s === "string") {
      return { text: s, completed: false };
    }
    return s;
  });

  const completedCount = normalizedSubtasks.filter((s) => s.completed).length;
  const totalSubtasks = normalizedSubtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedCount / totalSubtasks) * 100 : 0;

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakTask = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const diff = new Date(task.deadline) - new Date();
    let timeText = "";
    if (task.done) {
      timeText = "This task is completed.";
    } else if (diff <= 0) {
      timeText = "This task is overdue!";
    } else {
      const totalSecs = Math.floor(diff / 1000);
      const days = Math.floor(totalSecs / 86400);
      const hrs = Math.floor((totalSecs % 86400) / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      
      const parts = [];
      if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
      if (hrs > 0) parts.push(`${hrs} hour${hrs > 1 ? "s" : ""}`);
      if (mins > 0) parts.push(`${mins} minute${mins > 1 ? "s" : ""}`);
      if (parts.length === 0) {
        parts.push("less than a minute");
      }
      timeText = `You have ${parts.join(" and ")} remaining.`;
    }

    const textToSpeak = `Task Briefing for: ${task.name}. ${timeText} This is a ${task.priorityLevel} priority task. ${task.reason ? `AI reasoning: ${task.reason}` : ""} Estimated duration is ${task.timeEstimate || "unknown"}. Suggested starting time: ${task.suggestedStart || "as soon as possible"}.`;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    const voices = window.speechSynthesis.getVoices();
    const synthVoice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || voices.find(v => v.lang.startsWith("en"));
    if (synthVoice) utterance.voice = synthVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const exportCalendar = () => {
    const formatICSDate = (date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const start = new Date(task.createdAt || Date.now());
    const end = new Date(task.deadline);
    
    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//The Last-Minute Life Saver//AI Productivity Companion//EN",
      "BEGIN:VEVENT",
      `UID:${task.id}@vibe2ship`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${task.name} [Priority: ${task.priorityLevel.toUpperCase()}]`,
      `DESCRIPTION:${(task.notes || "").replace(/\n/g, "\\n")}\\n\\nAI Reasoning: ${(task.reason || "").replace(/\n/g, "\\n")}\\nTime Estimate: ${task.timeEstimate || "N/A"}\\nSuggested Start: ${task.suggestedStart || "N/A"}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR"
    ];

    const icsContent = icsLines.join("\r\n");
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${task.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <article
      className={`task-card priority-accent-${task.priorityLevel} ${task.done ? "done" : ""}`}
      style={style}
    >
      <div className="card-top">
        <div className="task-identity">
          <span className="category-chip">
            {icon} {task.category}
          </span>
          <p className="task-name">{task.name}</p>
        </div>
        <div className="card-top-right-group" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="card-utilities" style={{ display: "flex", gap: "6px" }}>
            <button
              className={`btn-utility ${isSpeaking ? "btn-utility--speaking" : ""}`}
              onClick={speakTask}
              title={isSpeaking ? "Stop Voice Briefing" : "Listen to Voice Briefing"}
              type="button"
            >
              {isSpeaking ? "⏹ Stop" : "🔊 Listen"}
            </button>
            <button
              className="btn-utility"
              onClick={exportCalendar}
              title="Export Event to Calendar (.ics)"
              type="button"
            >
              📅 Sync
            </button>
          </div>
          <span className={`priority-badge priority-${task.priorityLevel}`}>
            P{task.priority}
          </span>
        </div>
      </div>

      {!task.done && (
        <div className="priority-editor">
          <span className="priority-editor-label">Priority</span>
          <div className="priority-editor-options">
            {PRIORITY_LEVELS.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                className={`priority-option priority-option--${id} ${task.priorityLevel === id ? "priority-option--active" : ""}`}
                onClick={() => handlePriorityChange(id)}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {task.done ? (
        <div className="countdown-block countdown-block--done">
          <div className="countdown-inner-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <div className="countdown-time-side">
              <p className={`countdown done-label ${isOverdue ? "done-label--overdue" : ""}`}>
                {isOverdue ? "✓ Completed Late" : "✓ Completed"}
              </p>
              <span className={`priority-badge priority-${task.priorityLevel}`} style={{ alignSelf: "flex-start", marginTop: "8px", display: "inline-block" }}>
                {priorityLabel} priority
              </span>
            </div>
            <div className="calendar-sheet">
              <div className="calendar-sheet-header">{month}</div>
              <div className="calendar-sheet-body">
                <span className="calendar-sheet-day">{day}</span>
                <span className="calendar-sheet-weekday">{dayName}</span>
              </div>
              <div className="calendar-sheet-time">{time}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`countdown-block ${timeLeft.urgent ? "countdown-block--urgent" : ""}`}>
          <div className="countdown-inner-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <div className="countdown-time-side" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span className="countdown-badge" style={{ alignSelf: "flex-start" }}>
                {timeLeft.overdue ? "Overdue" : timeLeft.urgent ? "Soon" : "Remaining"}
              </span>
              <p className={`countdown ${timeLeft.urgent ? "urgent" : ""}`}>
                {timeLeft.display}
              </p>
            </div>
            
            <div className="calendar-sheet">
              <div className="calendar-sheet-header">{month}</div>
              <div className="calendar-sheet-body">
                <span className="calendar-sheet-day">{day}</span>
                <span className="calendar-sheet-weekday">{dayName}</span>
              </div>
              <div className="calendar-sheet-time">{time}</div>
            </div>
          </div>
          
          <div className="card-progress-section">
            <div className="progress-track-wrapper">
              <div className="progress-label-row">
                <span>Timeline Elapsed</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill progress-bar-fill--time"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {totalSubtasks > 0 && (
              <div className="progress-track-wrapper">
                <div className="progress-label-row">
                  <span>Roadmap Progress</span>
                  <span>{completedCount}/{totalSubtasks} completed</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill progress-bar-fill--tasks"
                    style={{ width: `${subtaskProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="ai-section">
        <div className="ai-section-label">
          <span className="ai-spark">✦</span> AI breakdown
          {task.prioritySource === "manual" && (
            <span className="priority-source-tag">Manual priority</span>
          )}
        </div>

        <div className="ai-meta">
          <div className="ai-meta-item">
            <span className="label">Est. time</span>
            <span className="value">{task.timeEstimate}</span>
          </div>
          <div className="ai-meta-item">
            <span className="label">Start by</span>
            <span className="value">{task.suggestedStart}</span>
          </div>
        </div>

        <ul className="subtasks">
          {normalizedSubtasks.map((step, i) => (
            <li
              className={`subtask ${step.completed ? "subtask--completed" : ""}`}
              key={i}
              onClick={() => onToggleSubtask && onToggleSubtask(task.id, i)}
            >
              <div className="subtask-checkbox">✓</div>
              <span className="subtask-text">{step.text}</span>
            </li>
          ))}
        </ul>

        {task.reason && <p className="ai-reason">{task.reason}</p>}
      </div>

      <div className="card-actions">
        {confirmRemove ? (
          <div className="confirm-remove-row" style={{ display: "flex", width: "100%", alignItems: "center", gap: "10px" }}>
            <span className="confirm-remove-text" style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--red)", flex: 1 }}>
              Are you sure?
            </span>
            <button className="btn-done btn-restore" style={{ flex: "none", width: "80px", padding: "8px 0" }} onClick={() => setConfirmRemove(false)}>
              Cancel
            </button>
            <button className="btn-remove" style={{ flex: "none", width: "100px", padding: "8px 0", background: "rgba(239, 68, 68, 0.18)", borderColor: "var(--red)", color: "#FF8F9C" }} onClick={() => onRemove(task.id)}>
              Yes, delete
            </button>
          </div>
        ) : task.done ? (
          <>
            <button className="btn-done btn-restore" onClick={() => onRestore(task.id)}>
              Restore task
            </button>
            <button className="btn-remove" onClick={() => setConfirmRemove(true)}>
              Remove
            </button>
          </>
        ) : (
          <>
          <button className="btn-done" onClick={() => onDone(task.id)}>
            ✓ Mark done
          </button>
          {normalizedSubtasks.filter((s) => !s.completed).length > 0 && (
            <button
              className="btn-rescue"
              onClick={() => onRescue(task.id)}
              disabled={task.loadingRescue}
            >
              {task.loadingRescue ? "Rescuing…" : "⚡ AI Rescue"}
            </button>
          )}
          <button className="btn-remove" onClick={() => setConfirmRemove(true)}>
            Remove
          </button>
          </>
        )}
      </div>
    </article>
  );
}

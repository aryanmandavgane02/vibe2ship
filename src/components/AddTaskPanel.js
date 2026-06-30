import React, { useState, useRef, useEffect } from "react";
import { analyzeTask } from "../utils/geminiAgent";
import {
  PRIORITY_LEVELS,
  PRIORITY_AUTO,
  scoreFromLevel,
  normalizePriority,
} from "../utils/priority";

const CATEGORIES = [
  { id: "Work", icon: "💼" },
  { id: "Study", icon: "📚" },
  { id: "Personal", icon: "🏠" },
  { id: "Finance", icon: "💰" },
  { id: "Health", icon: "❤️" },
  { id: "Project", icon: "🚀" },
  { id: "Meeting", icon: "📅" },
  { id: "Other", icon: "📌" },
];

const padTime = (num) => String(num).padStart(2, "0");

function calculateStreak(tasks) {
  const uniqueDates = Array.from(
    new Set(
      tasks
        .filter((t) => t.completedAt)
        .map((t) => new Date(t.completedAt).toLocaleDateString())
    )
  ).map((d) => new Date(d));

  if (uniqueDates.length === 0) return 0;

  uniqueDates.sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecent = uniqueDates[0];
  mostRecent.setHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceMostRecent = Math.round((today - mostRecent) / msPerDay);

  if (daysSinceMostRecent > 1) {
    return 0;
  }

  let streak = 1;
  let prevDate = mostRecent;

  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = uniqueDates[i];
    currentDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((prevDate - currentDate) / msPerDay);

    if (diffDays === 1) {
      streak++;
      prevDate = currentDate;
    } else if (diffDays > 1) {
      break;
    }
  }
  return streak;
}

export default function AddTaskPanel({ onAdd, tasks = [] }) {
  const [name, setName] = useState("");
  const [dateVal, setDateVal] = useState("");
  const [timeVal, setTimeVal] = useState("12:00");
  const [clockMode, setClockMode] = useState("24h");
  const [periodVal, setPeriodVal] = useState("PM");
  const [category, setCategory] = useState("Work");
  const [notes, setNotes] = useState("");
  const [priorityMode, setPriorityMode] = useState(PRIORITY_AUTO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const minDate = new Date().toISOString().split("T")[0];
  const [selectedHour = "12", selectedMinute = "00"] = timeVal.split(":");
  const hourOptions =
    clockMode === "24h"
      ? Array.from({ length: 24 }, (_, i) => padTime(i))
      : Array.from({ length: 12 }, (_, i) => padTime(i + 1));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => padTime(i));

  const hourSelectRef = useRef(null);
  const minuteSelectRef = useRef(null);

  useEffect(() => {
    const hourEl = hourSelectRef.current;
    const minuteEl = minuteSelectRef.current;

    const handleHourWheel = (e) => {
      e.preventDefault();
      const currentIndex = hourOptions.indexOf(selectedHour);
      if (currentIndex === -1) return;
      let newIndex;
      if (e.deltaY < 0) {
        newIndex = (currentIndex - 1 + hourOptions.length) % hourOptions.length;
      } else if (e.deltaY > 0) {
        newIndex = (currentIndex + 1) % hourOptions.length;
      } else {
        return;
      }
      handleHourChange(hourOptions[newIndex]);
    };

    const handleMinuteWheel = (e) => {
      e.preventDefault();
      const currentIndex = minuteOptions.indexOf(selectedMinute);
      if (currentIndex === -1) return;
      let newIndex;
      if (e.deltaY < 0) {
        newIndex = (currentIndex - 1 + minuteOptions.length) % minuteOptions.length;
      } else if (e.deltaY > 0) {
        newIndex = (currentIndex + 1) % minuteOptions.length;
      } else {
        return;
      }
      handleMinuteChange(minuteOptions[newIndex]);
    };

    if (hourEl) hourEl.addEventListener("wheel", handleHourWheel, { passive: false });
    if (minuteEl) minuteEl.addEventListener("wheel", handleMinuteWheel, { passive: false });

    return () => {
      if (hourEl) hourEl.removeEventListener("wheel", handleHourWheel);
      if (minuteEl) minuteEl.removeEventListener("wheel", handleMinuteWheel);
    };
  }, [selectedHour, selectedMinute, hourOptions, minuteOptions]);

  const toDeadlineTime = () => {
    const timePattern = clockMode === "24h"
      ? /^([01]\d|2[0-3]):[0-5]\d$/
      : /^(0?[1-9]|1[0-2]):[0-5]\d$/;

    if (!timePattern.test(timeVal)) return "";

    if (clockMode === "24h") return timeVal;

    const [hourRaw, minutes] = timeVal.split(":");
    let hours = parseInt(hourRaw, 10);
    if (periodVal === "PM" && hours !== 12) hours += 12;
    if (periodVal === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  };

  const getCombinedDeadline = () => {
    const deadlineTime = toDeadlineTime();
    if (!dateVal || !deadlineTime) return "";
    return `${dateVal}T${deadlineTime}`;
  };

  const handleClockModeChange = (mode) => {
    setClockMode(mode);
    if (mode === "12h" && !/^(0?[1-9]|1[0-2]):[0-5]\d$/.test(timeVal)) {
      setTimeVal(`12:${selectedMinute}`);
    }
  };

  const handleHourChange = (hour) => {
    setTimeVal(`${hour}:${selectedMinute}`);
  };

  const handleMinuteChange = (minute) => {
    setTimeVal(`${selectedHour}:${minute}`);
  };

  const handleSubmit = async () => {
    const deadline = getCombinedDeadline();
    if (!name.trim() || !deadline) {
      setError("Task name, deadline date, and deadline time are required.");
      return;
    }

    if (!toDeadlineTime()) {
      setError(
        clockMode === "24h"
          ? "Enter time in 24-hour HH:MM format, like 23:59."
          : "Enter time in 12-hour HH:MM format, like 11:59."
      );
      return;
    }

    if (new Date(deadline) <= new Date()) {
      setError("Deadline must be in the future.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const ai = await analyzeTask({
        name,
        deadline,
        category,
        notes,
        userPriority: priorityMode !== PRIORITY_AUTO ? priorityMode : null,
      });

      const manual = priorityMode !== PRIORITY_AUTO;
      const { priority, priorityLevel } = manual
        ? normalizePriority(scoreFromLevel(priorityMode), priorityMode)
        : normalizePriority(ai.priority, ai.priorityLevel);

      onAdd({
        id: Date.now(),
        name: name.trim(),
        deadline,
        category,
        notes: notes.trim(),
        priority,
        priorityLevel,
        prioritySource: manual ? "manual" : "ai",
        reason: manual
          ? `Set to ${priorityLevel} priority manually. ${ai.reason}`
          : ai.reason,
        timeEstimate: ai.timeEstimate,
        suggestedStart: ai.suggestedStart,
        subtasks: ai.subtasks,
        done: false,
        createdAt: new Date().toISOString(),
      });

      setName("");
      setDateVal("");
      setTimeVal("12:00");
      setClockMode("24h");
      setPeriodVal("PM");
      setNotes("");
      setCategory("Work");
      setPriorityMode(PRIORITY_AUTO);
    } catch (e) {
      setError("Something went wrong. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="add-panel">
      <div className="panel-header">
        <p className="panel-title">New task</p>
        <p className="panel-desc">
          Set a deadline and priority — AI still breaks it into steps.
        </p>
      </div>

      <div className="field">
        <label htmlFor="task-name">What needs doing?</label>
        <input
          id="task-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Submit your report…"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      <div className="field">
        <div className="field-header">
          <label>Deadline</label>
          <div className="clock-mode-toggle" aria-label="Clock format">
            <button
              type="button"
              className={clockMode === "24h" ? "clock-mode-btn clock-mode-btn--active" : "clock-mode-btn"}
              onClick={() => handleClockModeChange("24h")}
            >
              24h
            </button>
            <button
              type="button"
              className={clockMode === "12h" ? "clock-mode-btn clock-mode-btn--active" : "clock-mode-btn"}
              onClick={() => handleClockModeChange("12h")}
            >
              12h
            </button>
          </div>
        </div>
        <div className="deadline-picker-row">
          <div className="date-control">
            <input
              id="task-deadline"
              type="date"
              value={dateVal}
              min={minDate}
              onChange={(e) => setDateVal(e.target.value)}
              className="deadline-date-input"
            />
          </div>
          <div className="time-control">
            <div className="time-select-row">
              <div className="time-select-wrapper" data-hint="Scroll ↕">
                <select
                  ref={hourSelectRef}
                  value={selectedHour}
                  onChange={(e) => handleHourChange(e.target.value)}
                  className="deadline-select time-select"
                  aria-label="Deadline hour"
                >
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>
              <span className="deadline-colon">:</span>
              <div className="time-select-wrapper" data-hint="Scroll ↕">
                <select
                  ref={minuteSelectRef}
                  value={selectedMinute}
                  onChange={(e) => handleMinuteChange(e.target.value)}
                  className="deadline-select time-select"
                  aria-label="Deadline minute"
                >
                  {minuteOptions.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
              </div>
              {clockMode === "12h" && (
                <div className="time-select-wrapper">
                  <select
                    value={periodVal}
                    onChange={(e) => setPeriodVal(e.target.value)}
                    className="deadline-select period-select"
                    aria-label="Deadline AM or PM"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              )}
            </div>
            <p className="clock-mode-hint">
              {clockMode === "24h" ? "00-23 hours" : "01-12 hours with AM/PM"}
            </p>
          </div>
        </div>
      </div>

      <div className="field">
        <label>Priority</label>
        <div className="priority-grid">
          <button
            type="button"
            className={`priority-pill priority-pill--auto ${priorityMode === PRIORITY_AUTO ? "priority-pill--active" : ""}`}
            onClick={() => setPriorityMode(PRIORITY_AUTO)}
          >
            <span>✦</span>
            AI decides
          </button>
          {PRIORITY_LEVELS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              className={`priority-pill priority-pill--${id} ${priorityMode === id ? "priority-pill--active" : ""}`}
              onClick={() => setPriorityMode(id)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Category</label>
        <div className="category-grid">
          {CATEGORIES.map(({ id, icon }) => (
            <button
              key={id}
              type="button"
              className={`category-pill ${category === id ? "category-pill--active" : ""}`}
              onClick={() => setCategory(id)}
            >
              <span>{icon}</span>
              {id}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="task-notes">Notes <span className="label-optional">(optional)</span></label>
        <textarea
          id="task-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Context helps the AI prioritize better…"
          rows={3}
        />
      </div>

      {error && <p className="field-error">{error}</p>}

      <button
        className="btn-analyze"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="analyzing-spinner" />
            Analyzing…
          </>
        ) : (
          <>
            <span className="btn-icon">⚡</span>
            Analyze &amp; Add
          </>
        )}
      </button>

      {tasks.length > 0 && (() => {
        const allSubtasks = tasks.flatMap((t) => t.subtasks || []);
        const completedSubtasksCount = allSubtasks.filter((s) => typeof s === "string" ? false : s.completed).length;
        const totalSubtasksCount = allSubtasks.length;
        const completionRate = totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0;
        const runwayStreak = calculateStreak(tasks);

        return (
          <div className="runway-stats-card">
            <p className="runway-stats-title">Runway Metrics</p>
            <div className="runway-stats-grid">
              <div className="runway-stat-item">
                <div className="runway-stat-icon">🔥</div>
                <div className="runway-stat-info">
                  <span className="runway-stat-val">{runwayStreak} {runwayStreak === 1 ? "Day" : "Days"}</span>
                  <span className="runway-stat-label">Daily Streak</span>
                </div>
              </div>

              <div className="runway-stat-item">
                <div className="runway-stat-progress-ring">
                  <span className="progress-ring-label">{completionRate}%</span>
                  <svg className="progress-ring-svg" viewBox="0 0 44 44">
                    <circle className="progress-ring-circle-bg" cx="22" cy="22" r="18" />
                    <circle
                      className="progress-ring-circle"
                      cx="22"
                      cy="22"
                      r="18"
                      strokeDasharray="113"
                      strokeDashoffset={113 - (113 * completionRate) / 100}
                    />
                  </svg>
                </div>
                <div className="runway-stat-info">
                  <span className="runway-stat-val">{completedSubtasksCount}/{totalSubtasksCount}</span>
                  <span className="runway-stat-label">Subtasks Cleared</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </aside>
  );
}

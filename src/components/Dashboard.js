import React from "react";
import TaskCard from "./TaskCard";
import { PRIORITY_LEVELS } from "../utils/priority";

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  ...PRIORITY_LEVELS.map(({ id, label }) => ({ id, label })),
];

function filterTasks(tasks, filter) {
  if (filter === "all") return tasks;
  return tasks.filter((t) => t.priorityLevel === filter);
}

export default function Dashboard({
  tasks,
  priorityFilter,
  onPriorityFilterChange,
  onRemove,
  onDone,
  onRestore,
  onUpdatePriority,
  onToggleSubtask,
  onRescue,
}) {
  const active = filterTasks(
    tasks.filter((t) => !t.done),
    priorityFilter
  );
  const done = tasks.filter((t) => t.done);

  const activeCounts = PRIORITY_LEVELS.reduce((acc, { id }) => {
    acc[id] = tasks.filter((t) => !t.done && t.priorityLevel === id).length;
    return acc;
  }, {});

  const activeTasks = tasks.filter((t) => !t.done);
  let urgentAlertTask = null;
  if (activeTasks.length > 0) {
    const sortedByDeadline = [...activeTasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    const nearestTask = sortedByDeadline[0];
    const hoursLeft = (new Date(nearestTask.deadline) - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft <= 48 || nearestTask.priorityLevel === "critical") {
      const nextStep = (nearestTask.subtasks || []).find((s) => {
        const completed = typeof s === "string" ? false : s.completed;
        return !completed;
      });
      const nextStepText = nextStep ? (typeof nextStep === "string" ? nextStep : nextStep.text) : null;
      
      let durationStr = "";
      if (hoursLeft <= 0) {
        durationStr = "OVERDUE";
      } else if (hoursLeft < 1) {
        durationStr = `due in ${Math.max(1, Math.round(hoursLeft * 60))}m`;
      } else if (hoursLeft < 24) {
        durationStr = `due in ${Math.round(hoursLeft)}h`;
      } else {
        durationStr = `due in ${Math.round(hoursLeft / 24)}d`;
      }

      urgentAlertTask = {
        name: nearestTask.name,
        priorityLevel: nearestTask.priorityLevel,
        durationStr,
        nextStepText,
      };
    }
  }

  if (tasks.length === 0) {
    return (
      <main className="dashboard">
        <div className="empty-state">
          <div className="empty-visual">
            <div className="empty-ring empty-ring--1" />
            <div className="empty-ring empty-ring--2" />
            <div className="empty-icon">⚡</div>
          </div>
          <p className="empty-title">Your runway is clear</p>
          <span className="empty-sub">
            Drop a task with a deadline — set priority manually or let AI
            decide, then get a step-by-step plan.
          </span>
          <div className="empty-hints">
            <span>🔴 Critical deadlines</span>
            <span>🟠 High-stakes work</span>
            <span>🟢 Low-priority errands</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard">
      {urgentAlertTask && (
        <div className={`ticker-banner ticker-banner--${urgentAlertTask.priorityLevel}`}>
          <span className="ticker-alert-badge">🚨 RUNWAY ALERT</span>
          <div className="ticker-scroll">
            <span className="ticker-text">
              <strong>{urgentAlertTask.name}</strong> ({urgentAlertTask.durationStr}) is demanding action.{" "}
              {urgentAlertTask.nextStepText ? (
                <>Suggested next step: <em>"{urgentAlertTask.nextStepText}"</em></>
              ) : (
                <>Suggested action: Begin execution now.</>
              )}
            </span>
          </div>
        </div>
      )}

      {tasks.some((t) => !t.done) && (
        <div className="priority-filters">
          {FILTER_OPTIONS.map(({ id, label }) => {
            const count =
              id === "all"
                ? tasks.filter((t) => !t.done).length
                : activeCounts[id] || 0;
            if (id !== "all" && count === 0) return null;

            return (
              <button
                key={id}
                type="button"
                className={`filter-chip filter-chip--${id} ${priorityFilter === id ? "filter-chip--active" : ""}`}
                onClick={() => onPriorityFilterChange(id)}
              >
                {label}
                <span className="filter-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {active.length > 0 && (
        <section className="task-section">
          <div className="dashboard-header">
            <div>
              <p className="section-eyebrow">Focus now</p>
              <h2>
                {priorityFilter === "all"
                  ? "Active Tasks"
                  : `${FILTER_OPTIONS.find((f) => f.id === priorityFilter)?.label} Priority`}
              </h2>
            </div>
            <span className="section-count">{active.length}</span>
          </div>
          <div className="task-grid">
            {active.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                onRemove={onRemove}
                onDone={onDone}
                onRestore={onRestore}
                onUpdatePriority={onUpdatePriority}
                onToggleSubtask={onToggleSubtask}
                onRescue={onRescue}
                style={{ animationDelay: `${i * 0.07}s` }}
              />
            ))}
          </div>
        </section>
      )}

      {tasks.some((t) => !t.done) && active.length === 0 && (
        <div className="filter-empty">
          <p>No {priorityFilter} priority tasks right now.</p>
          <button
            type="button"
            className="filter-empty-btn"
            onClick={() => onPriorityFilterChange("all")}
          >
            Show all tasks
          </button>
        </div>
      )}

      {done.length > 0 && (
        <section className="task-section task-section--done">
          <div className="dashboard-header">
            <div>
              <p className="section-eyebrow">Shipped</p>
              <h2 className="section-title--muted">Completed</h2>
            </div>
            <span className="section-count section-count--muted">{done.length}</span>
          </div>
          <div className="task-grid">
            {done.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                onRemove={onRemove}
                onDone={onDone}
                onRestore={onRestore}
                onUpdatePriority={onUpdatePriority}
                onToggleSubtask={onToggleSubtask}
                onRescue={onRescue}
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

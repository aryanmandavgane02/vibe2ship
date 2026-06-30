import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import AddTaskPanel from "./components/AddTaskPanel";
import Header from "./components/Header";
import { sortByPriority } from "./utils/priority";
import { rescueTask } from "./utils/geminiAgent";
import confetti from "canvas-confetti";
import "./App.css";

const TASKS_STORAGE_KEY = "last-minute-lifesaver-tasks";

export default function App() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      return saved ? sortByPriority(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [mouseCoords, setMouseCoords] = useState({ x: 50, y: 30 });


  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMouseCoords({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const addTask = (task) => {
    setTasks((prev) => sortByPriority([...prev, task]));
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const markDone = (id) => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const subtasks = (t.subtasks || []).map((sub) => {
          const subObj =
            typeof sub === "string" ? { text: sub, completed: false } : sub;
          return { ...subObj, completed: true };
        });
        return { ...t, subtasks, done: true, completedAt: new Date().toISOString() };
      })
    );
  };

  const restoreTask = (id) => {
    setTasks((prev) =>
      sortByPriority(
        prev.map((t) => (t.id === id ? { ...t, done: false, completedAt: null } : t))
      )
    );
  };

  const updatePriority = (id, priority, priorityLevel) => {
    setTasks((prev) =>
      sortByPriority(
        prev.map((t) =>
          t.id === id ? { ...t, priority, priorityLevel } : t
        )
      )
    );
  };

  const toggleSubtask = (taskId, subtaskIdx) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const subtasks = (task.subtasks || []).map((sub, idx) => {
      const subObj = typeof sub === "string" ? { text: sub, completed: false } : sub;
      if (idx === subtaskIdx) {
        return { ...subObj, completed: !subObj.completed };
      }
      return subObj;
    });

    const allSubtasksDone =
      subtasks.length > 0 && subtasks.every((sub) => sub.completed);

    if (allSubtasksDone && !task.done) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return { ...t, subtasks, done: allSubtasksDone, completedAt: allSubtasksDone ? new Date().toISOString() : null };
      })
    );
  };

  const handleRescue = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const remaining = (task.subtasks || [])
      .filter((s) => !s.completed)
      .map((s) => (typeof s === "string" ? s : s.text));

    if (remaining.length === 0) return;

    const now = new Date();
    const deadlineDate = new Date(task.deadline);
    const hoursLeft = Math.max(
      1,
      Math.round((deadlineDate - now) / (1000 * 60 * 60))
    );

    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, loadingRescue: true } : t))
      );

      const rescuePlan = await rescueTask({
        name: task.name,
        hoursLeft,
        remainingSubtasks: remaining,
        notes: task.notes,
      });

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            subtasks: rescuePlan.subtasks.map((text) => ({ text, completed: false })),
            reason: `⚡ Emergency Rescue: ${rescuePlan.reason}`,
            loadingRescue: false,
          };
        })
      );
    } catch (err) {
      console.error("Rescue failed:", err);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, loadingRescue: false } : t))
      );
    }
  };

  const activeCount = tasks.filter((t) => !t.done).length;
  const urgentCount = tasks.filter(
    (t) => !t.done && new Date(t.deadline) - Date.now() < 6 * 60 * 60 * 1000
  ).length;
  const criticalCount = tasks.filter(
    (t) => !t.done && t.priorityLevel === "critical"
  ).length;

  return (
    <div className="app">
      <div
        className="ambient"
        aria-hidden="true"
        style={{
          "--mouse-x": `${mouseCoords.x}%`,
          "--mouse-y": `${mouseCoords.y}%`,
        }}
      >
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />
      </div>

      <Header
        taskCount={activeCount}
        urgentCount={urgentCount}
        criticalCount={criticalCount}
        doneCount={tasks.filter((t) => t.done).length}
      />

      <div className="app-body">
        <AddTaskPanel onAdd={addTask} tasks={tasks} />
        <Dashboard
          tasks={tasks}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          onRemove={removeTask}
          onDone={markDone}
          onRestore={restoreTask}
          onUpdatePriority={updatePriority}
          onToggleSubtask={toggleSubtask}
          onRescue={handleRescue}
        />
      </div>
    </div>
  );
}

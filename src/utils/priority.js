export const PRIORITY_LEVELS = [
  { id: "critical", label: "Critical", score: 10, icon: "🔴" },
  { id: "high", label: "High", score: 8, icon: "🟠" },
  { id: "medium", label: "Medium", score: 5, icon: "🟡" },
  { id: "low", label: "Low", score: 2, icon: "🟢" },
];

export const PRIORITY_AUTO = "auto";

export function scoreFromLevel(level) {
  const found = PRIORITY_LEVELS.find((p) => p.id === level);
  return found ? found.score : 5;
}

export function levelFromScore(score) {
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

export function normalizePriority(priority, priorityLevel) {
  const level = PRIORITY_LEVELS.some((p) => p.id === priorityLevel)
    ? priorityLevel
    : levelFromScore(priority);
  const score = Math.min(10, Math.max(1, Number(priority) || scoreFromLevel(level)));
  return { priority: score, priorityLevel: level };
}

export function sortByPriority(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.priority - a.priority;
  });
}

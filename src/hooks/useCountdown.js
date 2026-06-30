// src/hooks/useCountdown.js
import { useState, useEffect } from "react";

export function useCountdown(deadline) {
  const [timeLeft, setTimeLeft] = useState(calcTime(deadline));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTime(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return timeLeft;
}

function calcTime(deadline) {
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return { display: "OVERDUE", urgent: true, overdue: true };

  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hrs = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const urgent = diff < 6 * 60 * 60 * 1000; // under 6 hours

  if (days > 0) {
    return { display: `${days}d ${pad(hrs)}h ${pad(mins)}m`, urgent: false };
  }
  return {
    display: `${pad(hrs)}:${pad(mins)}:${pad(secs)}`,
    urgent,
  };
}

const pad = (n) => String(n).padStart(2, "0");

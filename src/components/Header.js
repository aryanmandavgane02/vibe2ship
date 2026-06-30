import React from "react";

export default function Header({ taskCount, urgentCount, criticalCount, doneCount }) {
  return (
    <header className="header">
      <div className="header-logo">
        <div className="icon">
          <span className="icon-bolt">⚡</span>
          <span className="icon-ring" />
        </div>
        <div className="header-titles">
          <h1>
            Last<span>-Minute</span> Life Saver
          </h1>
          <p className="header-tagline">AI-powered deadline triage</p>
        </div>
      </div>

      <div className="header-stats">
        {criticalCount > 0 && (
          <div className="stat-pill stat-pill--critical">
            <span className="stat-dot stat-dot--pulse" />
            {criticalCount} critical
          </div>
        )}
        {urgentCount > 0 && (
          <div className="stat-pill stat-pill--urgent">
            {urgentCount} due soon
          </div>
        )}
        <div className="stat-pill">
          <span className="stat-value">{taskCount}</span>
          active
        </div>
        {doneCount > 0 && (
          <div className="stat-pill stat-pill--done">
            <span className="stat-value">{doneCount}</span>
            done
          </div>
        )}
      </div>
    </header>
  );
}

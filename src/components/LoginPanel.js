import React, { useState } from "react";

export default function LoginPanel({ onLogin }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name to proceed.");
      return;
    }
    onLogin(name.trim());
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-badge">⚡ THE LAST-MINUTE LIFE SAVER</div>
        <h1 className="login-title">Initialize your Runway</h1>
        <p className="login-subtitle">
          An AI-powered companion designed to keep you ahead of deadlines.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="user-name-input" className="login-label">TACTICAL SIGN-IN HANDLE</label>
            <input
              id="user-name-input"
              type="text"
              placeholder="e.g. Aryan"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              className="login-input"
              autoFocus
            />
            {error && <span className="login-error-text">{error}</span>}
          </div>

          <button type="submit" className="btn-login-submit">
            Initialize System ⚡
          </button>
        </form>
      </div>
    </div>
  );
}

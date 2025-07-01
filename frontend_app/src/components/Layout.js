import React from "react";
import { useAccessibility } from "../AccessibilityContext";
import "../App.css";

// Accessible, scalable main container with high-contrast and adjustable font size/layout.
export default function Layout({ children }) {
  const { settings } = useAccessibility();
  const rootStyle = {
    fontSize: `${settings.fontSize}px`,
    backgroundColor: settings.theme === "dark" ? "#000" : "#fff",
    color: settings.theme === "dark" ? "#fff" : "#111",
    minHeight: "100vh",
    transition: "all 0.2s",
    fontFamily: "system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={rootStyle}>
      {/* Always-accessible skip nav for screen readers */}
      <a href="#main-content" className="visually-hidden">Skip to main content</a>
      {/* Header and bottom navigation could go here */}
      <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
        {children}
      </main>
      {/* Bottom navigation bar stub for mobile */}
      <nav
        aria-label="Main navigation"
        style={{
          display: "flex",
          justifyContent: "space-around",
          background: "#1976D2",
          color: "#fff",
          fontSize: "1.25em",
          padding: "0.5em 0",
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
        }}
      >
        <a href="/" style={{ color: "#fff", textDecoration: "none" }}>Home</a>
        <a href="/quiz" style={{ color: "#fff", textDecoration: "none", fontWeight: "bold" }}>Quiz</a>
        <a href="/settings" style={{ color: "#fff", textDecoration: "none" }}>Settings</a>
        <a href="/voice" style={{ color: "#fff", textDecoration: "none" }}>Voice</a>
      </nav>
    </div>
  );
}

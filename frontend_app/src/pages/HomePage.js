import React, { useEffect, useRef } from "react";
import { useAccessibility } from "../AccessibilityContext";

const sampleParagraph = {
  text: "Welcome to AudioLearn. This is your interactive learning companion designed for accessibility. Click or tap anywhere on this text to hear it read aloud. The more you practice listening and reading, the better you'll become at English.",
  heading: "Learn English Through Listening"
};

/**
 * Accessible Home Page with automatic TTS
 * - Displays a single prominent paragraph
 * - Auto-reads content on page load
 * - Supports click/tap for repeat playback
 * - Fully keyboard accessible
 * - High contrast and scalable text
 */
// PUBLIC_INTERFACE
export default function HomePage() {
  const { settings } = useAccessibility();
  const paragraphRef = useRef();
  const headingRef = useRef();

  // Auto TTS on mount
  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
      speakContent();
    }
  }, []); // Run once on mount

  // Helper to trigger browser TTS
  function speakContent() {
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
        const fullText = `${sampleParagraph.heading}. ${sampleParagraph.text}`;
        const utter = new window.SpeechSynthesisUtterance(fullText);
        utter.lang = settings.language || "en";
        utter.rate = settings.ttsSpeed || 1.0;
        window.speechSynthesis.speak(utter);
      } catch (err) {
        console.warn("TTS error:", err);
      }
    }
  }

  // Handle click/tap on paragraph
  function handleParagraphInteraction(e) {
    e.preventDefault();
    speakContent();
  }

  // Handle keyboard interaction
  function handleKeyPress(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      speakContent();
    }
  }

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <h1
        ref={headingRef}
        tabIndex={0}
        style={{
          fontSize: `${settings.fontSize + 16}px`,
          fontWeight: "bold",
          marginBottom: "1.5rem",
          color: "var(--text-primary)",
          textAlign: "center",
          maxWidth: "90%"
        }}
        aria-label={sampleParagraph.heading}
      >
        {sampleParagraph.heading}
      </h1>

      <div
        role="button"
        ref={paragraphRef}
        onClick={handleParagraphInteraction}
        onKeyPress={handleKeyPress}
        tabIndex={0}
        style={{
          fontSize: `${settings.fontSize + 4}px`,
          lineHeight: 1.6,
          padding: "2rem",
          background: "var(--bg-secondary)",
          border: "3px solid var(--border-color)",
          borderRadius: "12px",
          cursor: "pointer",
          maxWidth: "90%",
          color: "var(--text-primary)",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
        aria-label={`${sampleParagraph.text} Click or press Enter to hear this text again.`}
      >
        {sampleParagraph.text}
      </div>

      <div
        style={{
          marginTop: "2rem",
          fontSize: `${settings.fontSize - 2}px`,
          color: "var(--text-secondary)",
          background: "var(--bg-secondary)",
          padding: "1rem",
          borderRadius: "8px",
          maxWidth: "90%"
        }}
        tabIndex={0}
        aria-label="Accessibility instructions"
      >
        <strong>Accessibility Tips:</strong>
        <ul style={{ marginTop: "0.5rem", listStyle: "none", padding: 0 }}>
          <li>• Click or tap the text above to hear it again</li>
          <li>• Use Tab to focus and Enter/Space to activate</li>
          <li>• Adjust text size and speech speed in Settings</li>
        </ul>
      </div>
    </main>
  );
}

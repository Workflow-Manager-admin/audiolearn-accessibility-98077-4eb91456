import React, { useEffect, useRef, useState } from "react";
import { useAccessibility } from "../AccessibilityContext";

// Sample news paragraphs - in a real app, these would come from an API
const newsParagraphs = [
  {
    id: "n1",
    text: "The government has announced a new educational initiative to promote digital literacy across rural areas. The program aims to reach over 10 million students in the next five years, providing them with access to modern technology and online learning resources.",
  },
  {
    id: "n2",
    text: "In a significant environmental policy shift, the nation has committed to reducing carbon emissions by 40% by 2030. This ambitious target will involve major investments in renewable energy and sustainable transportation infrastructure.",
  },
  {
    id: "n3",
    text: "A groundbreaking healthcare program has been launched to provide free medical check-ups to senior citizens nationwide. The initiative will establish mobile medical units that will visit remote villages and urban centers regularly.",
  },
  {
    id: "n4",
    text: "The national space agency has successfully launched its latest satellite, enhancing the country's capabilities in weather forecasting and disaster management. This technological advancement will improve early warning systems for natural disasters.",
  }
];

/**
 * Accessible Home Page with auto-playing national affairs news
 * - Displays current affairs paragraphs with high contrast
 * - Auto-reads content on load and paragraph change
 * - Supports keyboard navigation and screen readers
 * - Next button cycles through paragraphs
 */
// PUBLIC_INTERFACE
export default function HomePage() {
  const { settings } = useAccessibility();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const headingRef = useRef();
  const paragraphRef = useRef();

  // Auto TTS on mount and paragraph change
  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
      speakContent();
    }
  }, [currentIndex]); // Re-run when paragraph changes

  // Helper to trigger browser TTS
  function speakContent() {
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
        setIsReading(true);
        const currentParagraph = newsParagraphs[currentIndex];
        const utter = new window.SpeechSynthesisUtterance(currentParagraph.text);
        utter.lang = settings.language || "en";
        utter.rate = settings.ttsSpeed || 1.0;
        utter.onend = () => setIsReading(false);
        utter.onerror = () => setIsReading(false);
        window.speechSynthesis.speak(utter);
      } catch (err) {
        console.warn("TTS error:", err);
        setIsReading(false);
      }
    }
  }

  // Handle next paragraph button click
  function handleNextParagraph() {
    setCurrentIndex((prev) => (prev + 1) % newsParagraphs.length);
  }

  // Handle keyboard interaction for paragraph
  function handleKeyPress(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      speakContent();
    }
  }

  const currentParagraph = newsParagraphs[currentIndex];

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
        aria-label="National Affairs and Current News"
      >
        National Affairs and Current News
      </h1>

      <div
        role="article"
        ref={paragraphRef}
        onClick={speakContent}
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
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          position: "relative"
        }}
        aria-label={`Current news: ${currentParagraph.text}. Click or press Enter to hear this text again.`}
      >
        {currentParagraph.text}
        {isReading && (
          <div
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              background: "#4CAF50",
              color: "white",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              fontSize: `${settings.fontSize - 2}px`
            }}
            aria-live="polite"
          >
            Reading...
          </div>
        )}
      </div>

      <button
        onClick={handleNextParagraph}
        style={{
          marginTop: "2rem",
          fontSize: `${settings.fontSize + 2}px`,
          padding: "1rem 2rem",
          background: "var(--button-bg, #1976D2)",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          minHeight: "44px",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}
        aria-label="Next paragraph"
        disabled={isReading}
      >
        Next Paragraph {isReading ? "(Reading...)" : ""}
      </button>

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
          <li>• Each paragraph is automatically read aloud when displayed</li>
          <li>• Click or tap the text to hear it again</li>
          <li>• Use Tab and Enter/Space to navigate with keyboard</li>
          <li>• Press Next Paragraph for more news after listening</li>
          <li>• Adjust text size and speech speed in Settings</li>
        </ul>
      </div>
    </main>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { listContent } from "../api";
import { useAccessibility } from "../AccessibilityContext";
import { useNavigate } from "react-router-dom";

/**
 * Accessible Common Words Page
 * - Fetches all vocabulary items of type 'word' from backend.
 * - Displays a large, navigable, high-contrast list of words.
 * - Clicking or pressing Enter/Space on a word triggers immediate TTS read aloud.
 * - Fully keyboard and screen reader accessible.
 */

// PUBLIC_INTERFACE
export default function CommonWordsPage() {
  const { settings } = useAccessibility();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ttsId, setTtsId] = useState(null);
  const headingRef = useRef();
  const listRef = useRef();
  const navigate = useNavigate();

  // Fetch list of "word" content on mount, respects language settings
  useEffect(() => {
    setLoading(true);
    setError("");
    setWords([]);
    listContent({ type: "word", language: settings.language })
      .then((data) => {
        setWords(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load common words from server.");
        setLoading(false);
      });
  }, [settings.language]);

  // Focus heading for screen readers on load
  useEffect(() => {
    if (headingRef.current && !loading) headingRef.current.focus();
  }, [loading]);

  // On initial load, auto-TTS announce context for visually challenged
  useEffect(() => {
    if (!loading && words.length > 0) {
      speakWithTTS(
        "Common Words page loaded. There are " +
          words.length +
          " vocabulary words. Use Tab to move through the list. Click or press Enter to hear any word."
      );
    }
    // eslint-disable-next-line
  }, [loading, words.length]);

  // Helper to trigger browser TTS on a given text (uses global settings)
  function speakWithTTS(text, onEnd = null) {
    if (window.speechSynthesis && text) {
      try {
        window.speechSynthesis.cancel();
        const utter = new window.SpeechSynthesisUtterance(text);
        utter.lang = settings.language || "en";
        utter.rate = settings.ttsSpeed || 1.0;
        if (typeof onEnd === "function") utter.onend = onEnd;
        window.speechSynthesis.speak(utter);
      } catch {
        // no-op
        if (typeof onEnd === "function") onEnd();
      }
    } else if (typeof onEnd === "function") {
      onEnd();
    }
  }

  // TTS for specific word click or keyboard
  function handleWordTTS(wordObj) {
    setTtsId(wordObj.id);
    speakWithTTS(wordObj.text, () => setTtsId(null));
  }

  // Keyboard handler for word list items
  function handleListItemKey(e, wordObj) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleWordTTS(wordObj);
    }
  }

  // Return button style shared with rest of app (high-contrast, ARIA)
  const buttonStyle = {
    background: "var(--button-bg, #1976D2)",
    color: "var(--button-text, #fff)",
    border: "2px solid transparent",
    borderRadius: "7px",
    padding: "0.65em 1.1em",
    fontSize: "1em",
    fontWeight: 600,
    cursor: "pointer",
    outlineOffset: "2px",
    minWidth: 70,
    minHeight: 44,
    marginRight: "0.3em",
    marginTop: "0.7em",
    transition: "background 0.2s, border 0.2s, color 0.2s",
  };

  // Loading and error states
  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        tabIndex={0}
        style={{
          fontSize: settings.fontSize + 6,
          color: "#aaa",
          marginTop: "2em"
        }}
      >
        Loading common words, please wait...
      </div>
    );
  }
  if (error) {
    return (
      <div
        role="alert"
        tabIndex={0}
        style={{
          fontSize: settings.fontSize,
          color: "#ba000d",
          background: "#fff8f8",
          border: "2px solid #ba000d",
          padding: "1em",
          margin: "2em auto",
          maxWidth: 600,
        }}
      >
        {error}
      </div>
    );
  }
  if (!words.length) {
    return (
      <div
        tabIndex={0}
        style={{
          fontSize: settings.fontSize,
          color: "#222",
          margin: "2em auto",
          maxWidth: 600,
        }}
      >
        No vocabulary words found for this language.
      </div>
    );
  }

  return (
    <div
      aria-label="Common Words page"
      style={{
        padding: "1em",
        maxWidth: 700,
        margin: "0 auto",
        border: "2px solid var(--border-color, #1976D2)",
        borderRadius: 9,
        background: "#fafbff",
      }}
    >
      <h2
        ref={headingRef}
        tabIndex={0}
        style={{ fontSize: settings.fontSize + 8, fontWeight: 800, marginBottom: "0.2em" }}
        aria-label="Common Words"
      >
        Common Words
      </h2>
      <p style={{ fontSize: settings.fontSize, margin: ".8em 0 1.2em 0" }} tabIndex={0}>
        Explore the most frequent English vocabulary words. Click or press Enter/Space on a word to hear it aloud.
      </p>
      <ul
        ref={listRef}
        aria-label="Common word list"
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: ".65em",
          maxHeight: 500,
          overflowY: "auto",
          background: "#fff",
          borderRadius: 6,
          border: "1px solid #ddd",
        }}
      >
        {words.map((wordObj, idx) => (
          <li
            key={wordObj.id || wordObj.text || idx}
            tabIndex={0}
            style={{
              fontSize: settings.fontSize + 6,
              fontWeight: 600,
              letterSpacing: ".02em",
              color: "#21306b",
              background: ttsId === wordObj.id ? "#E3F2FD" : "transparent",
              borderRadius: 5,
              outline: "none",
              padding: ".7em 1.1em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "background 0.13s",
              minHeight: 48,
            }}
            aria-label={`Word: ${wordObj.text}`}
            onClick={() => handleWordTTS(wordObj)}
            onKeyDown={e => handleListItemKey(e, wordObj)}
            onFocus={() => {
              // Optionally announce word on focus (do NOT TTS automatically)
              // speakWithTTS(wordObj.text);
            }}
          >
            <span>{wordObj.text}</span>
            <button
              onClick={e => {
                e.stopPropagation();
                handleWordTTS(wordObj);
              }}
              style={{
                ...buttonStyle,
                background: "#1976D2",
                color: "#fff",
                marginLeft: "auto",
                minWidth: 48,
                minHeight: 38,
                fontSize: settings.fontSize,
                borderRadius: 6,
              }}
              tabIndex={0}
              aria-label={`Hear word ${wordObj.text}`}
              disabled={ttsId === wordObj.id}
              type="button"
            >
              {ttsId === wordObj.id ? "Playing…" : "🔊 Listen"}
            </button>
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: "1em", marginTop: "2em" }}>
        <button
          style={buttonStyle}
          aria-label="Go back to home"
          onClick={() => navigate("/")}
          tabIndex={0}
        >
          ⬅ Home
        </button>
      </div>
      <section
        tabIndex={0}
        aria-label="Common Words page accessibility help"
        style={{
          marginTop: "1em",
          color: "#3569bb",
          fontSize: settings.fontSize - 2,
          background: "#e0e7ff",
          borderRadius: 7,
          padding: "0.8em 1em"
        }}
      >
        <b>Accessibility tips:</b> <br />
        • Use Tab and arrow keys to move between words. <br />
        • Press <kbd>Enter</kbd> or <kbd>Space</kbd> to hear any word via TTS.<br />
        • Clicking the "Listen" button also plays the word.<br />
        • Increase font size or speech speed in Settings for comfort.
      </section>
    </div>
  );
}

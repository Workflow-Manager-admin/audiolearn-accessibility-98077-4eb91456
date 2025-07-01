import React, { useEffect, useRef, useState } from "react";
import { listContent } from "../api";
import { useAccessibility } from "../AccessibilityContext";
import { useNavigate } from "react-router-dom";

/**
 * Accessible Paragraphs Page
 * - Fetches all content items of type 'paragraph' from backend.
 * - Renders a large, fully ARIA and keyboard-accessible list of paragraphs.
 * - Each paragraph can be TTS read aloud by click or keyboard (Enter/Space).
 * - Large, scalable font; high-contrast and visually distinct.
 * - Same style and accessibility as CommonWordsPage/SentencesPage.
 */
// PUBLIC_INTERFACE
export default function ParagraphsPage() {
  const { settings } = useAccessibility();
  const [paragraphs, setParagraphs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ttsId, setTtsId] = useState(null);
  const headingRef = useRef();
  const listRef = useRef();
  const navigate = useNavigate();

  // Fetch list of "paragraph" content from backend on mount/language change
  useEffect(() => {
    setLoading(true);
    setError("");
    setParagraphs([]);
    listContent({ type: "paragraph", language: settings.language })
      .then((data) => {
        setParagraphs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load paragraphs from server.");
        setLoading(false);
      });
  }, [settings.language]);

  // Focus heading for screen readers on load
  useEffect(() => {
    if (headingRef.current && !loading) headingRef.current.focus();
  }, [loading]);

  // On load, TTS announce page context for visually challenged
  useEffect(() => {
    if (!loading && paragraphs.length > 0) {
      speakWithTTS(
        "Paragraphs page loaded. There are " +
          paragraphs.length +
          " paragraphs for listening practice. Use Tab to move through the list. Click or press Enter to hear any paragraph."
      );
    }
    // eslint-disable-next-line
  }, [loading, paragraphs.length]);

  // Utility: Use browser TTS for text
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
        if (typeof onEnd === "function") onEnd();
      }
    } else if (typeof onEnd === "function") {
      onEnd();
    }
  }

  // When a paragraph is chosen for TTS (click or keyboard)
  function handleParagraphTTS(paragraphObj) {
    setTtsId(paragraphObj.id);
    speakWithTTS(paragraphObj.text, () => setTtsId(null));
  }

  // Keyboard handler for list item
  function handleListItemKey(e, paragraphObj) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleParagraphTTS(paragraphObj);
    }
  }

  // Button style (same as other section pages)
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
          marginTop: "2em",
        }}
      >
        Loading paragraphs, please wait...
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
  if (!paragraphs.length) {
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
        No paragraphs found for this language.
      </div>
    );
  }

  return (
    <div
      aria-label="Paragraphs page"
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
        style={{
          fontSize: settings.fontSize + 8,
          fontWeight: 800,
          marginBottom: "0.2em",
        }}
        aria-label="Paragraphs"
      >
        Paragraphs
      </h2>
      <p style={{ fontSize: settings.fontSize, margin: ".8em 0 1.2em 0" }} tabIndex={0}>
        Listen to and practice with these English paragraphs. Click or press Enter/Space on a paragraph to have it read aloud by text-to-speech (TTS).
      </p>
      <ul
        ref={listRef}
        aria-label="Paragraph list"
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
        {paragraphs.map((paragraphObj, idx) => (
          <li
            key={paragraphObj.id || paragraphObj.text || idx}
            tabIndex={0}
            style={{
              fontSize: settings.fontSize + 2,
              fontWeight: 500,
              letterSpacing: ".01em",
              color: "#800a34",
              background: ttsId === paragraphObj.id ? "#F3E5F5" : "transparent",
              borderRadius: 5,
              outline: "none",
              padding: ".7em 1.1em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "background 0.13s",
              minHeight: 60,
            }}
            aria-label={`Paragraph: ${paragraphObj.text}`}
            onClick={() => handleParagraphTTS(paragraphObj)}
            onKeyDown={e => handleListItemKey(e, paragraphObj)}
          >
            <span style={{marginRight: 8}}>{paragraphObj.text}</span>
            <button
              onClick={e => {
                e.stopPropagation();
                handleParagraphTTS(paragraphObj);
              }}
              style={{
                ...buttonStyle,
                background: "#AD1457",
                color: "#fff",
                marginLeft: "auto",
                minWidth: 54,
                minHeight: 38,
                fontSize: settings.fontSize,
                borderRadius: 6,
              }}
              tabIndex={0}
              aria-label={`Hear paragraph "${paragraphObj.text}"`}
              disabled={ttsId === paragraphObj.id}
              type="button"
            >
              {ttsId === paragraphObj.id ? "Playing…" : "🔊 Listen"}
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
        aria-label="Paragraphs page accessibility help"
        style={{
          marginTop: "1em",
          color: "#6d235d",
          fontSize: settings.fontSize - 2,
          background: "#fbeafc",
          borderRadius: 7,
          padding: "0.8em 1em"
        }}
      >
        <b>Accessibility tips:</b> <br />
        • Use Tab and arrow keys to move between paragraphs. <br />
        • Press <kbd>Enter</kbd> or <kbd>Space</kbd> to have any paragraph read aloud.<br />
        • Clicking the "Listen" button plays the paragraph immediately.<br />
        • You can increase font size or TTS speed in Settings for easier reading and listening.
      </section>
    </div>
  );
}

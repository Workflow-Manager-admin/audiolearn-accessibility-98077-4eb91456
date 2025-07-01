import React, { useEffect, useRef, useState } from "react";
import { listContent } from "../api";
import { useAccessibility } from "../AccessibilityContext";
import { useNavigate } from "react-router-dom";

/**
 * Accessible Sentences Page
 * - Fetches all content items of type 'sentence' from the backend.
 * - Renders a keyboard and ARIA accessible list of sentences.
 * - Clicking or pressing Enter/Space on any sentence speaks the sentence aloud using browser TTS.
 */
// PUBLIC_INTERFACE
export default function SentencesPage() {
  const { settings } = useAccessibility();
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ttsId, setTtsId] = useState(null);
  const headingRef = useRef();
  const listRef = useRef();
  const navigate = useNavigate();

  // Fetch list of "sentence" content on mount, respect language settings
  useEffect(() => {
    setLoading(true);
    setError("");
    setSentences([]);
    listContent({ type: "sentence", language: settings.language })
      .then((data) => {
        setSentences(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load sentences from server.");
        setLoading(false);
      });
  }, [settings.language]);

  // Focus heading for screen readers on load
  useEffect(() => {
    if (headingRef.current && !loading) headingRef.current.focus();
  }, [loading]);

  // On initial load, auto-TTS announce context for visually challenged
  useEffect(() => {
    if (!loading && sentences.length > 0) {
      speakWithTTS(
        "Sentences page loaded. There are " +
          sentences.length +
          " practice sentences. Use Tab to move through the list. Click or press Enter to hear any sentence."
      );
    }
    // eslint-disable-next-line
  }, [loading, sentences.length]);

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

  // TTS for specific sentence click or keyboard
  function handleSentenceTTS(sentenceObj) {
    setTtsId(sentenceObj.id);
    speakWithTTS(sentenceObj.text, () => setTtsId(null));
  }

  // Keyboard handler for item
  function handleListItemKey(e, sentenceObj) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSentenceTTS(sentenceObj);
    }
  }

  // Reusable, scalable, accessible button style
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
        Loading sentences, please wait...
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
  // Provide fallback mock data for demo/TTS if backend is empty
  const mockSentences = [
    { id: "s1", text: "This is my book." },
    { id: "s2", text: "How are you today?" },
    { id: "s3", text: "I like music and dancing." },
    { id: "s4", text: "The sun is bright." },
    { id: "s5", text: "Can you help me, please?" }
  ];
  const sentencesToShow = sentences.length ? sentences : mockSentences;
  if (!sentencesToShow.length) {
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
        No sentences found for this language (and no mock available).
      </div>
    );
  }

  return (
    <div
      aria-label="Sentences page"
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
        aria-label="Sentences"
      >
        Sentences
      </h2>
      <p style={{ fontSize: settings.fontSize, margin: ".8em 0 1.2em 0" }} tabIndex={0}>
        Browse basic English sentences for practice. Click or press Enter/Space on a sentence to hear it aloud.
      </p>
      <ul
        ref={listRef}
        aria-label="Sentence list"
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
        {sentencesToShow.map((sentenceObj, idx) => (
          <li
            key={sentenceObj.id || sentenceObj.text || idx}
            tabIndex={0}
            style={{
              fontSize: settings.fontSize + 2,
              fontWeight: 500,
              letterSpacing: ".01em",
              color: "#203449",
              background: ttsId === sentenceObj.id ? "#FFE0B2" : "transparent",
              borderRadius: 5,
              outline: "none",
              padding: ".7em 1.1em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "background 0.13s",
              minHeight: 48,
            }}
            aria-label={`Sentence: ${sentenceObj.text}`}
            onClick={() => handleSentenceTTS(sentenceObj)}
            onKeyDown={e => handleListItemKey(e, sentenceObj)}
          >
            <span style={{marginRight: 8}}>{sentenceObj.text}</span>
            <button
              onClick={e => {
                e.stopPropagation();
                handleSentenceTTS(sentenceObj);
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
              aria-label={`Hear sentence "${sentenceObj.text}"`}
              disabled={ttsId === sentenceObj.id}
              type="button"
            >
              {ttsId === sentenceObj.id ? "Playing…" : "🔊 Listen"}
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
        aria-label="Sentences page accessibility help"
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
        • Use Tab and arrow keys to move between sentences. <br />
        • Press <kbd>Enter</kbd> or <kbd>Space</kbd> to hear any sentence via TTS.<br />
        • Clicking the "Listen" button also plays the sentence.<br />
        • Increase font size or speech speed in Settings for comfort.
      </section>
    </div>
  );
}

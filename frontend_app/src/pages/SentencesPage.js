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

// Default examples to show if backend returns empty
const defaultSentences = [
  { id: "s1", text: "This is my book." },
  { id: "s2", text: "How are you today?" },
  { id: "s3", text: "I like music and dancing." },
  { id: "s4", text: "The sun is bright." },
  { id: "s5", text: "Can you help me, please?" }
];

// PUBLIC_INTERFACE
export default function SentencesPage() {
  const { settings } = useAccessibility();
  const [sentences, setSentences] = useState(defaultSentences);  // Initialize with defaults
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
        // Use fetched data or fallback to defaults
        setSentences(Array.isArray(data) && data.length > 0 ? data : defaultSentences);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load sentences from server.");
        setSentences(defaultSentences); // Use defaults on error
        setLoading(false);
      });
  }, [settings.language]);

  // Focus heading for screen readers on load
  useEffect(() => {
    if (headingRef.current && !loading) headingRef.current.focus();
  }, [loading]);

  // Helper to trigger browser TTS
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

  // TTS for specific sentence click or keyboard
  function handleSentenceTTS(sentenceObj) {
    setTtsId(sentenceObj.id);
    speakWithTTS(sentenceObj.text, () => setTtsId(null));
  }

  // Keyboard handler for sentence list items
  function handleListItemKey(e, sentenceObj) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSentenceTTS(sentenceObj);
    }
  }

  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        tabIndex={0}
        style={{
          fontSize: settings.fontSize + 6,
          color: "#6b7280",
          marginTop: "2em",
          textAlign: "center"
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
          maxWidth: 480,
          borderRadius: 14
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      aria-label="Sentences page"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px",
        maxWidth: "100vw"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderRadius: 14,
          border: "2px solid var(--sentences-accent, #059669)",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}
      >
        <h2
          ref={headingRef}
          tabIndex={0}
          style={{
            fontSize: settings.fontSize + 8,
            fontWeight: 700,
            color: "var(--sentences-accent, #059669)",
            marginBottom: "4px",
            fontFamily: "Helvetica Neue, Arial, sans-serif"
          }}
          aria-label="Sentences"
        >
          Sentences
        </h2>
        <p
          style={{
            fontSize: settings.fontSize,
            color: "#222",
            margin: ".8em 0 1.2em 0",
            fontFamily: "Helvetica Neue, Arial, sans-serif"
          }}
          tabIndex={0}
        >
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
            borderRadius: 8
          }}
        >
          {sentences.map((sentenceObj, idx) => (
            <li
              key={sentenceObj.id || idx}
              tabIndex={0}
              style={{
                fontSize: settings.fontSize + 2,
                fontFamily: "Helvetica Neue, Arial, sans-serif",
                fontWeight: 500,
                color: "#000",
                background: ttsId === sentenceObj.id ? "#f3f4f6" : "transparent",
                borderRadius: 8,
                outline: "none",
                padding: ".7em 1em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                transition: "background 0.15s",
                minHeight: 44,
                userSelect: "none"
              }}
              aria-label={`Sentence: ${sentenceObj.text}. Press to play.`}
              onClick={() => handleSentenceTTS(sentenceObj)}
              onKeyDown={e => handleListItemKey(e, sentenceObj)}
            >
              <span 
                style={{
                  marginRight: 12,
                  color: "var(--sentences-accent, #059669)",
                  fontSize: "1.2em"
                }}
                aria-hidden="true"
              >
                🔊
              </span>
              <span>{sentenceObj.text}</span>
            </li>
          ))}
        </ul>

        <button
          style={{
            background: "var(--sentences-accent, #059669)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 20px",
            fontSize: settings.fontSize,
            fontWeight: 600,
            cursor: "pointer",
            marginTop: "20px",
            fontFamily: "Helvetica Neue, Arial, sans-serif"
          }}
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
          color: "var(--sentences-accent, #059669)",
          fontSize: settings.fontSize - 2,
          background: "#f3f4f6",
          borderRadius: 8,
          padding: "0.8em 1em",
          maxWidth: 480,
          width: "100%",
          fontFamily: "Helvetica Neue, Arial, sans-serif"
        }}
      >
        <b>Accessibility tips:</b> <br />
        • Use Tab and arrow keys to move between sentences. <br />
        • Press <kbd>Enter</kbd> or <kbd>Space</kbd> to hear any sentence via TTS.<br />
        • Click any sentence to hear it spoken aloud.<br />
        • Increase font size or speech speed in Settings for comfort.
      </section>
    </div>
  );
}

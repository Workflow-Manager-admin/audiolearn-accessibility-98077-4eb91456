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

// Default examples to show if backend returns empty
const defaultWords = [
  { id: "w1", text: "apple" },
  { id: "w2", text: "happy" },
  { id: "w3", text: "school" },
  { id: "w4", text: "friend" },
  { id: "w5", text: "music" },
  { id: "w6", text: "water" }
];

// PUBLIC_INTERFACE
export default function CommonWordsPage() {
  const { settings } = useAccessibility();
  const [words, setWords] = useState(defaultWords);  // Initialize with defaults
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ttsId, setTtsId] = useState(null);
  const headingRef = useRef();
  const listRef = useRef();
  const navigate = useNavigate();

  // Fetch list of "word" content on mount, respects language settings
  useEffect(() => {
    let isMounted = true;
    const loadContent = async () => {
      try {
        const data = await listContent({ type: "word", language: settings.language });
        if (!isMounted) return;
        
        // Strict validation of backend data
        if (!data || !Array.isArray(data) || !data.every(item => item && typeof item.text === 'string')) {
          console.warn('Invalid or empty data from backend, using defaults');
          setWords(defaultWords);
          return;
        }
        
        // Only use backend data if we have valid content
        setWords(data.length > 0 ? data : defaultWords);
      } catch (err) {
        if (!isMounted) return;
        console.warn('Error fetching words:', err);
        setError("Unable to load common words from server.");
        // Keep default words on error
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadContent();
    return () => { isMounted = false; };
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
      aria-label="Common Words page"
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
          border: "2px solid var(--words-accent, #2563eb)",
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
            color: "var(--words-accent, #2563eb)",
            marginBottom: "4px",
            fontFamily: "Helvetica Neue, Arial, sans-serif"
          }}
          aria-label="Common Words"
        >
          Common Words
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
            borderRadius: 8
          }}
        >
          {words.map((wordObj, idx) => (
            <li
              key={wordObj.id || idx}
              tabIndex={0}
              style={{
                fontSize: settings.fontSize + 2,
                fontFamily: "Helvetica Neue, Arial, sans-serif",
                fontWeight: 500,
                color: "#000",
                background: ttsId === wordObj.id ? "#f3f4f6" : "transparent",
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
              aria-label={`Word: ${wordObj.text}. Press to play.`}
              onClick={() => handleWordTTS(wordObj)}
              onKeyDown={e => handleListItemKey(e, wordObj)}
            >
              <span 
                style={{
                  marginRight: 12,
                  color: "var(--words-accent, #2563eb)",
                  fontSize: "1.2em"
                }}
                aria-hidden="true"
              >
                🔊
              </span>
              <span>{wordObj.text}</span>
            </li>
          ))}
        </ul>

        <button
          style={{
            background: "var(--words-accent, #2563eb)",
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
        aria-label="Common Words page accessibility help"
        style={{
          marginTop: "1em",
          color: "var(--words-accent, #2563eb)",
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
        • Use Tab and arrow keys to move between words. <br />
        • Press <kbd>Enter</kbd> or <kbd>Space</kbd> to hear any word via TTS.<br />
        • Click any word to hear it spoken aloud.<br />
        • Increase font size or speech speed in Settings for comfort.
      </section>
    </div>
  );
}

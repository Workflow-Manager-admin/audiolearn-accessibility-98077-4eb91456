import React, { useEffect, useState, useRef } from "react";
import {
  getDailySuggestion,
  addFavorite,
  getTTSForContent,
} from "../api";
import { useAccessibility } from "../AccessibilityContext";
import { useNavigate } from "react-router-dom";

/**
 * Accessible Daily Suggestions Page: fetches today's suggestions from backend,
 * supports TTS, favorite, and quiz actions,
 * high-contrast, scalable, full ARIA, keyboard and screen reader support.
 */
// PUBLIC_INTERFACE
export default function DailySuggestionPage() {
  const { settings } = useAccessibility();
  const userId = settings.user?.id;
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ttsState, setTtsState] = useState("idle");
  const [favState, setFavState] = useState("idle");
  const [error, setError] = useState("");
  const headingRef = useRef();
  const navigate = useNavigate();

  // Fetch today's suggestion on mount and when user/language changes
  useEffect(() => {
    setLoading(true);
    setError("");
    setSuggestion(null);
    if (!userId) {
      setLoading(false);
      setSuggestion(null);
      return;
    }
    getDailySuggestion(userId)
      .then((data) => {
        setSuggestion(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load daily suggestion.");
        setLoading(false);
      });
  }, [userId, settings.language]);

  // Focus heading for screen readers
  useEffect(() => {
    if (!loading && headingRef.current) headingRef.current.focus();
  }, [loading]);

  // Accessible TTS playback
  async function handlePlayTTS() {
    if (!suggestion) return;
    setTtsState("loading");
    try {
      const ttsData = await getTTSForContent(suggestion.id);
      if (ttsData && ttsData.url) {
        const audio = new window.Audio(ttsData.url);
        audio.playbackRate = settings.ttsSpeed || 1.0;
        audio.onended = () => setTtsState("idle");
        audio.onerror = () => setTtsState("idle");
        audio.play();
      } else {
        throw new Error();
      }
    } catch {
      // Use browser speech synthesis as fallback
      if (window.speechSynthesis && suggestion.text) {
        const utter = new window.SpeechSynthesisUtterance(suggestion.text);
        utter.lang = suggestion.language || settings.language || "en";
        utter.rate = settings.ttsSpeed || 1.0;
        utter.onend = () => setTtsState("idle");
        window.speechSynthesis.speak(utter);
      } else {
        setTtsState("idle");
      }
    }
    setTtsState("idle");
  }

  // Mark as favorite
  async function handleFavorite() {
    if (!suggestion) return;
    setFavState("working");
    try {
      await addFavorite({ user_id: userId, content_id: suggestion.id });
      setFavState("done");
    } catch {
      setFavState("error");
    }
  }

  // Send suggestion to quiz
  function handleQuiz() {
    if (suggestion) {
      navigate("/quiz", { state: { contentId: suggestion.id } });
    }
  }

  // Loading and error states
  if (loading)
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
        Loading daily suggestion, please wait...
      </div>
    );
  if (error)
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
  if (!suggestion || !suggestion.text)
    return (
      <div
        style={{
          fontSize: settings.fontSize,
          color: "#222",
          margin: "2em auto",
          maxWidth: 600,
        }}
        tabIndex={0}
        aria-label="No daily suggestion found"
      >
        No daily suggestion found for today.
      </div>
    );

  return (
    <div
      aria-label="Daily Suggestion page"
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
        style={{ fontSize: settings.fontSize + 8, fontWeight: 700, marginBottom: "0.3em" }}
        aria-label="Today's Daily Suggestion"
      >
        Today's Suggestion
      </h2>
      <div
        style={{
          fontSize: settings.fontSize + 3,
          fontWeight: 600,
          marginBottom: "1em",
          color: "#111",
        }}
        tabIndex={0}
        aria-live="polite"
      >
        {suggestion.text}
      </div>
      <div
        style={{
          fontSize: settings.fontSize,
          marginBottom: "1.2em",
          color: "#444",
        }}
        tabIndex={0}
        aria-label={
          "Type: " +
          (suggestion.type || "not specified") +
          " | Language: " +
          (suggestion.language || settings.language)
        }
      >
        <strong>Type:</strong> {suggestion.type ? suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1) : "-"}
        {" | "}
        <strong>Language:</strong> {suggestion.language || settings.language}
      </div>
      <div style={{ display: "flex", gap: "1em", marginBottom: "1.1em" }}>
        <button
          style={buttonStyle}
          aria-label="Play suggestion with text to speech"
          onClick={handlePlayTTS}
          tabIndex={0}
          disabled={ttsState === "loading"}
        >
          {ttsState === "loading" ? "Playing..." : "🔊 Listen"}
        </button>
        <button
          style={buttonStyle}
          aria-label="Mark daily suggestion as favorite"
          onClick={handleFavorite}
          tabIndex={0}
          disabled={favState === "working" || favState === "done"}
        >
          {favState === "working"
            ? "Adding..."
            : favState === "done"
            ? "★ Favorited"
            : "☆ Favorite"}
        </button>
        <button
          style={buttonStyle}
          aria-label="Practice this suggestion as quiz"
          onClick={handleQuiz}
          tabIndex={0}
        >
          📝 Quiz
        </button>
        <button
          style={buttonStyle}
          aria-label="Go back to home"
          onClick={() => navigate("/")}
          tabIndex={0}
        >
          ⬅ Home
        </button>
      </div>
      {suggestion.description && (
        <section
          aria-label="Suggestion description"
          style={{
            borderTop: "1px solid #ececec",
            marginTop: "1.1em",
            paddingTop: "0.6em",
            fontSize: settings.fontSize,
            color: "#444",
          }}
        >
          <h3 tabIndex={0} style={{ fontSize: settings.fontSize + 2 }}>
            Description
          </h3>
          <span tabIndex={0}>{suggestion.description}</span>
        </section>
      )}
      <div
        tabIndex={0}
        aria-label="Daily suggestion accessibility help"
        style={{
          marginTop: "1em",
          color: "#3569bb",
          fontSize: settings.fontSize - 2,
          background: "#e0e7ff",
          borderRadius: 7,
          padding: "0.8em 1em"
        }}
      >
        <b>Accessibility tips: </b>
        • All controls are keyboard-accessible and screen reader-friendly. <br />
        • Use Tab and Shift+Tab to move between controls. <br />
        • After taking the daily suggestion as a quiz, view results on the Quiz Results page.
      </div>
    </div>
  );
}

// High-contrast, scalable, accessible button style for reuse
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
  transition: "background 0.2s, border 0.2s, color 0.2s",
};

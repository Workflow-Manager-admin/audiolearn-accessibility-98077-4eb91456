import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getContentById,
  getTTSForContent,
  addFavorite,
} from "../api";
import { useAccessibility } from "../AccessibilityContext";

/**
 * Accessible Content Page: shows content details, TTS controls, favorite, and quiz options.
 * Integrates global accessibility and user preferences.
 */
// PUBLIC_INTERFACE
export default function ContentPage() {
  const { contentId } = useParams();
  const { settings } = useAccessibility();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [content, setContent] = useState(null);
  const [ttsState, setTtsState] = useState("idle");
  const [favState, setFavState] = useState("idle");
  const headingRef = useRef();

  // Fetch specific content
  useEffect(() => {
    setLoading(true);
    setError("");
    getContentById(contentId)
      .then((res) => {
        setContent(res);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load content.");
        setLoading(false);
      });
  }, [contentId]);

  // Focus heading for screen reader
  useEffect(() => {
    if (headingRef.current && !loading) headingRef.current.focus();
  }, [loading]);

  // Auto-TTS: Speak content aloud on load for accessibility
  useEffect(() => {
    if (!loading && content && content.text) {
      // Cancel any previous speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        try {
          const utter = new window.SpeechSynthesisUtterance(content.text);
          utter.lang = content.language || settings.language || "en";
          utter.rate = settings.ttsSpeed || 1.0;
          window.speechSynthesis.speak(utter);
        } catch (err) {
          // Fail gracefully (do nothing)
        }
      }
    }
    // Only run on content load
    // eslint-disable-next-line
  }, [loading, content, settings.language, settings.ttsSpeed]);

  // TTS: Play audio from backend or browser
  async function handlePlayTTS() {
    if (!content) return;
    setTtsState("loading");
    try {
      const ttsData = await getTTSForContent(content.id);
      if (ttsData && ttsData.url) {
        const audio = new window.Audio(ttsData.url);
        audio.playbackRate = settings.ttsSpeed || 1.0;
        audio.onended = () => setTtsState("idle");
        audio.onerror = () => setTtsState("idle");
        audio.play();
      } else {
        throw new Error("No TTS audio URL.");
      }
    } catch {
      // Use SpeechSynthesis as fallback
      if (window.speechSynthesis) {
        const utter = new window.SpeechSynthesisUtterance(content.text);
        utter.lang = content.language || settings.language || "en";
        utter.rate = settings.ttsSpeed || 1.0;
        utter.onend = () => setTtsState("idle");
        window.speechSynthesis.speak(utter);
      }
    }
    setTtsState("idle");
  }

  // Add to favorites
  async function handleFavorite() {
    setFavState("working");
    try {
      await addFavorite({
        user_id: settings.user?.id,
        content_id: content.id,
      });
      setFavState("done");
    } catch {
      setFavState("error");
    }
  }

  // Send to quiz
  function handleQuiz() {
    navigate("/quiz", { state: { contentId } });
  }

  // Render loading/error/empty
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
        Loading content, please wait...
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
  if (!content)
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
        Content not found.
      </div>
    );

  return (
    <div
      aria-label="Learning Content Details"
      style={{
        padding: "1em",
        maxWidth: 700,
        margin: "0 auto",
        border: "2px solid var(--border-color, #1976D2)",
        borderRadius: 8,
        background: "#fafbff",
      }}
    >
      <h2
        ref={headingRef}
        tabIndex={0}
        aria-label={
          (content.type ? content.type + ": " : "") + content.text
        }
        style={{
          fontSize: settings.fontSize + 8,
          fontWeight: 700,
          marginBottom: "0.3em",
        }}
      >
        {content.text}
      </h2>
      <div style={{ fontSize: settings.fontSize, marginBottom: "0.8em" }}>
        <span
          tabIndex={0}
          aria-label={
            "Content type: " +
            (content.type || "not specified") +
            " | Language: " +
            (content.language || settings.language)
          }
        >
          <strong>Type:</strong>{" "}
          {content.type
            ? content.type.charAt(0).toUpperCase() + content.type.slice(1)
            : "-"}{" "}
          | <strong>Language:</strong> {content.language || settings.language}
        </span>
      </div>
      <div style={{ display: "flex", gap: "1em", marginBottom: "1em" }}>
        <button
          style={buttonStyle}
          aria-label="Play text to speech"
          onClick={handlePlayTTS}
          disabled={ttsState === "loading"}
          tabIndex={0}
        >
          {ttsState === "loading" ? "Playing..." : "🔊 Listen"}
        </button>
        <button
          style={buttonStyle}
          aria-label="Add to favorites"
          onClick={handleFavorite}
          tabIndex={0}
        >
          {favState === "working"
            ? "Adding..."
            : favState === "done"
            ? "★ Favorited"
            : "☆ Favorite"}
        </button>
        <button
          style={buttonStyle}
          aria-label="Practice with quiz"
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
      {/* For visually impaired, the following description can be focused on-demand */}
      {content.description && (
        <section
          aria-label="Content description"
          style={{
            borderTop: "1px solid #eee",
            marginTop: "0.8em",
            paddingTop: "0.6em",
            fontSize: settings.fontSize,
          }}
        >
          <h3 tabIndex={0} style={{ fontSize: settings.fontSize + 2 }}>
            Description
          </h3>
          <span tabIndex={0}>{content.description}</span>
        </section>
      )}
    </div>
  );
}

// Reuse scalable, accessible button style
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

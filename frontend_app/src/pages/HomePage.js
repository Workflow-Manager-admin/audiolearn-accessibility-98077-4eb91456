import React, { useEffect, useState } from "react";
import {
  listContent,
  getDailySuggestion,
  addFavorite,
  getTTSForContent,
} from "../api";
import { useAccessibility } from "../AccessibilityContext";
import { useNavigate } from "react-router-dom";

/**
 * Accessible Home Page that displays daily suggestions, available content, and quick-action controls.
 * Integrates accessibility settings (font size, theme, TTS speed) and supports screen readers.
 */
// PUBLIC_INTERFACE
export default function HomePage() {
  const { settings } = useAccessibility();
  const navigate = useNavigate();

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [content, setContent] = useState([]);
  const [ttsStates, setTtsStates] = useState({});
  const [favStates, setFavStates] = useState({});
  const [playingId, setPlayingId] = useState(null);

  // --- Accessibility states
  const headingRef = React.useRef();

  // Fetch daily suggestion and content list
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    // Fetch daily suggestion
    const fetchSuggestion = settings.user?.id
      ? getDailySuggestion(settings.user.id)
      : Promise.resolve(null);

    Promise.all([
      listContent({ language: settings.language }),
      fetchSuggestion,
    ])
      .then(([contentList, daily]) => {
        if (!mounted) return;
        setContent(contentList || []);
        setSuggestion(daily || null);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load content from server.");
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [settings.language, settings.user]);

  // Focus heading on load for screen reader
  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, [loading]);

  // Accessible TTS audio playback (browser TTS for fallback/demo)
  async function handlePlayTTS(contentObj) {
    setPlayingId(contentObj.id);
    setTtsStates((s) => ({ ...s, [contentObj.id]: "loading" }));

    try {
      // Prefer backend TTS, fallback to SpeechSynthesis below
      const ttsData = await getTTSForContent(contentObj.id);
      if (ttsData && ttsData.url) {
        const audio = new window.Audio(ttsData.url);
        audio.playbackRate = settings.ttsSpeed || 1.0;
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => setPlayingId(null);
        audio.play();
      } else {
        throw new Error("No TTS audio URL from backend.");
      }
    } catch (e) {
      // Fallback: use browser SpeechSynthesis
      if (window.speechSynthesis) {
        const utter = new window.SpeechSynthesisUtterance(contentObj.text);
        utter.lang = contentObj.language || settings.language || "en";
        utter.rate = settings.ttsSpeed || 1.0;
        utter.volume = 1;
        utter.onend = () => setPlayingId(null);
        window.speechSynthesis.speak(utter);
      }
    }
    setTtsStates((s) => ({ ...s, [contentObj.id]: "done" }));
  }

  // Add to favorites (API)
  async function handleFavorite(contentObj) {
    setFavStates((s) => ({ ...s, [contentObj.id]: "working" }));
    try {
      await addFavorite({
        user_id: settings.user?.id,
        content_id: contentObj.id,
      });
      setFavStates((s) => ({ ...s, [contentObj.id]: "done" }));
    } catch {
      setFavStates((s) => ({ ...s, [contentObj.id]: "error" }));
    }
  }

  // Go to quiz with content ID
  function handleQuiz(contentObj) {
    navigate("/quiz", { state: { contentId: contentObj.id } });
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

  return (
    <div
      aria-label="Home page with learning content and suggestions"
      style={{
        padding: "1em",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h1
        ref={headingRef}
        tabIndex={0}
        style={{
          fontSize: settings.fontSize + 10,
          fontWeight: "bold",
          outline: "none",
        }}
      >
        Welcome to AudioLearn: Accessible English Learning
      </h1>
      <p tabIndex={0} style={{ fontSize: settings.fontSize }}>
        Explore new words, sentences, paragraphs. Practice with quizzes and try your daily suggestion. Interface is optimized for screen reader, TTS, and high-contrast accessibility.
      </p>

      {/* --- Daily Suggestion */}
      <section
        aria-label="Daily Suggestion"
        style={{
          border: "2px solid var(--border-color, #1976D2)",
          background: "#f0f8ff",
          borderRadius: 8,
          margin: "1.5em 0",
          padding: "1em",
        }}
      >
        <h2 tabIndex={0} style={{ fontSize: settings.fontSize + 2 }}>
          Today's Suggestion
        </h2>
        {suggestion && suggestion.text ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5em",
              marginTop: "0.5em",
            }}
          >
            <span
              style={{
                fontSize: settings.fontSize + 3,
                fontWeight: 600,
              }}
              tabIndex={0}
              aria-live="polite"
            >
              {suggestion.text}
            </span>
            <div style={{ display: "flex", gap: "1em", marginTop: "0.4em" }}>
              <button
                style={buttonStyle}
                aria-label="Play text to speech for daily suggestion"
                onClick={() => handlePlayTTS(suggestion)}
                disabled={playingId === suggestion.id}
                tabIndex={0}
              >
                {playingId === suggestion.id ? "Playing..." : "🔊 Listen"}
              </button>
              <button
                style={buttonStyle}
                aria-label="Add suggestion to favorites"
                onClick={() => handleFavorite(suggestion)}
                tabIndex={0}
              >
                {favStates[suggestion.id] === "working"
                  ? "Adding..."
                  : favStates[suggestion.id] === "done"
                  ? "★ Favorited"
                  : "☆ Favorite"}
              </button>
              <button
                style={buttonStyle}
                aria-label="Practice with quiz for this suggestion"
                onClick={() => handleQuiz(suggestion)}
                tabIndex={0}
              >
                📝 Quiz
              </button>
            </div>
          </div>
        ) : (
          <span tabIndex={0} style={{ fontSize: settings.fontSize }}>
            No daily suggestion available.
          </span>
        )}
      </section>

      {/* --- Main Content List */}
      <section
        aria-label="Learning Content"
        style={{
          border: "2px solid var(--border-color, #ccc)",
          borderRadius: 6,
          background: "#fff",
          padding: "1.2em",
        }}
      >
        <h2 tabIndex={0} style={{ fontSize: settings.fontSize + 2 }}>
          Learning Content
        </h2>
        {content && content.length > 0 ? (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "0.85em",
            }}
          >
            {content.map((item) => (
              <li
                key={item.id}
                style={{
                  border: "1px solid var(--border-color, #e0e0e0)",
                  background:
                    playingId === item.id
                      ? "#f0f8ff"
                      : favStates[item.id] === "done"
                      ? "#e6ffe6"
                      : "#fafafa",
                  borderRadius: 6,
                  padding: "0.75em",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 60,
                }}
              >
                <span
                  tabIndex={0}
                  style={{ fontSize: settings.fontSize + 2, fontWeight: 500 }}
                  aria-label={item.type + ": " + item.text}
                >
                  {item.text}
                </span>
                <span
                  style={{
                    fontSize: settings.fontSize - 2,
                    fontStyle: "italic",
                    color: "#333",
                  }}
                  tabIndex={0}
                >
                  {item.type && item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </span>
                <div style={{ display: "flex", gap: "1em", marginTop: "0.5em" }}>
                  <button
                    style={buttonStyle}
                    aria-label={`Play text to speech for: ${item.text}`}
                    onClick={() => handlePlayTTS(item)}
                    disabled={playingId === item.id}
                    tabIndex={0}
                  >
                    {playingId === item.id ? "Playing..." : "🔊 Listen"}
                  </button>
                  <button
                    style={buttonStyle}
                    aria-label={`Add to favorites: ${item.text}`}
                    onClick={() => handleFavorite(item)}
                    tabIndex={0}
                  >
                    {favStates[item.id] === "working"
                      ? "Adding..."
                      : favStates[item.id] === "done"
                      ? "★ Favorited"
                      : "☆ Favorite"}
                  </button>
                  <button
                    style={buttonStyle}
                    aria-label={`Send to quiz: ${item.text}`}
                    onClick={() => handleQuiz(item)}
                    tabIndex={0}
                  >
                    📝 Quiz
                  </button>
                  <button
                    style={buttonStyle}
                    aria-label="See content details"
                    onClick={() => navigate(`/content/${item.id}`)}
                    tabIndex={0}
                  >
                    Details
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <span tabIndex={0} style={{ fontSize: settings.fontSize }}>
            No learning content found for current language.
          </span>
        )}
      </section>
    </div>
  );
}

// Accessible, high-contrast, scalable button style for all UI controls
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

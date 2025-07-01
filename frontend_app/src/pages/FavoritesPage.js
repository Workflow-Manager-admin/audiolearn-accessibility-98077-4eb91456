import React, { useEffect, useRef, useState } from "react";
import {
  listFavorites,
  getContentById,
  getTTSForContent,
  addFavorite,
} from "../api";
import { useAccessibility } from "../AccessibilityContext";

/**
 * Accessible Favorites Page: lets users view, remove, and listen to favorite items.
 */
// PUBLIC_INTERFACE
export default function FavoritesPage() {
  const { settings } = useAccessibility();
  const userId = settings.user?.id;
  const [favorites, setFavorites] = useState([]);
  const [favoriteContents, setFavoriteContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ttsId, setTtsId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const headingRef = useRef();

  // Fetch favorites + resolve content metadata
  useEffect(() => {
    if (!userId) {
      setFavorites([]);
      setFavoriteContents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    listFavorites(userId)
      .then(async (result) => {
        setFavorites(result || []);
        // Resolve content metadata for each favorite
        const contentPromises = (result || []).map(fav =>
          getContentById(fav.content_id).catch(() => null)
        );
        const contents = await Promise.all(contentPromises);
        setFavoriteContents(contents.filter(Boolean));
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load favorites.");
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, [loading]);

  // Play TTS for content
  async function handlePlayTTS(content) {
    setTtsId(content.id);
    try {
      const tts = await getTTSForContent(content.id);
      if (tts && tts.url) {
        const audio = new window.Audio(tts.url);
        audio.playbackRate = settings.ttsSpeed || 1.0;
        audio.onended = () => setTtsId(null);
        audio.onerror = () => setTtsId(null);
        audio.play();
      } else {
        throw new Error();
      }
    } catch {
      if (window.speechSynthesis && content.text) {
        const utter = new window.SpeechSynthesisUtterance(content.text);
        utter.lang = content.language || settings.language || "en";
        utter.rate = settings.ttsSpeed || 1.0;
        utter.onend = () => setTtsId(null);
        window.speechSynthesis.speak(utter);
      } else {
        setTtsId(null);
      }
    }
  }

  // Remove favorite (by calling addFavorite again in backend, which toggles)
  async function handleRemoveFavorite(content) {
    setRemovingId(content.id);
    try {
      // This should ideally be a DELETE, but backend uses toggle
      await addFavorite({ user_id: userId, content_id: content.id });
      setFavoriteContents(contents =>
        contents.filter(item => item.id !== content.id)
      );
    } catch {
      // If fails, error will appear on next reload
    }
    setRemovingId(null);
  }

  if (!userId)
    return (
      <div style={{ fontSize: settings.fontSize, padding: "2em" }}>
        <h2 tabIndex={0}>Favorites</h2>
        <div tabIndex={0} aria-label="Please sign in to view favorites">
          Please sign in or create a profile to save favorites.
        </div>
      </div>
    );

  if (loading)
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
        Loading favorites, please wait...
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
      aria-label="Favorites page"
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
        style={{ fontSize: settings.fontSize + 8, fontWeight: "bold", marginBottom: "0.2em" }}
      >
        Your Favorites
      </h2>

      {favoriteContents.length === 0 ? (
        <div
          tabIndex={0}
          aria-label="No favorites yet"
          style={{ fontSize: settings.fontSize, margin: "1em 0" }}
        >
          You do not have any favorites yet.
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "1em"
          }}
        >
          {favoriteContents.map((content) => (
            <li
              key={content.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 6,
                background: "#fff",
                padding: "1em",
                display: "flex",
                flexDirection: "column",
              }}
              aria-label={content.text}
            >
              <span
                tabIndex={0}
                style={{
                  fontSize: settings.fontSize + 2,
                  fontWeight: 600,
                  marginBottom: 3,
                }}
              >
                {content.text}
              </span>
              <span
                tabIndex={0}
                style={{
                  fontSize: settings.fontSize - 2,
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                {content.type
                  ? content.type.charAt(0).toUpperCase() + content.type.slice(1)
                  : ""}
                {content.language && ` | ${content.language.toUpperCase()}`}
              </span>
              <div style={{ display: "flex", gap: "1em" }}>
                <button
                  style={buttonStyle}
                  onClick={() => handlePlayTTS(content)}
                  disabled={ttsId === content.id}
                  aria-label="Play text to speech"
                  tabIndex={0}
                >
                  {ttsId === content.id ? "Playing..." : "🔊 Listen"}
                </button>
                <button
                  style={buttonStyle}
                  onClick={() => handleRemoveFavorite(content)}
                  disabled={removingId === content.id}
                  aria-label="Remove from favorites"
                  tabIndex={0}
                >
                  {removingId === content.id ? "Removing..." : "🗑 Remove"}
                </button>
              </div>
              {content.description && (
                <span tabIndex={0} style={{ fontSize: settings.fontSize - 2 }}>
                  {content.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
  marginTop: "0.3em",
  transition: "background 0.2s, border 0.2s, color 0.2s",
};

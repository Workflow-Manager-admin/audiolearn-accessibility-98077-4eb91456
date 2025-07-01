import React, { useEffect, useRef, useState } from "react";
import { useAccessibility } from "../AccessibilityContext";
import { updateUserPreferences } from "../api";

// Accessible, functional Settings page to control font size, TTS speed, and language.
// Values are persisted through AccessibilityContext and optionally backend.
/**
 * Accessible Settings Page for user preference management (font, TTS, language, theme).
 */
// PUBLIC_INTERFACE
export default function SettingsPage() {
  const { settings, updateSetting } = useAccessibility();
  const userId = settings.user?.id;
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState("");
  const headingRef = useRef();

  // For languages - could be expanded for real internationalization
  const languageOptions = [
    { code: "en", label: "English" },
    { code: "ta", label: "Tamil" },
    { code: "hi", label: "Hindi" },
  ];

  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, []);

  // Save preferences to backend (if logged in)
  async function handleSavePreferences(e) {
    e.preventDefault();
    setSaving(true);
    setSaveState("");
    try {
      await updateUserPreferences(userId, {
        preferred_font_size: settings.fontSize,
        preferred_tts_speed: settings.ttsSpeed,
        preferred_language: settings.language,
      });
      setSaveState("success");
    } catch {
      setSaveState("error");
    }
    setSaving(false);
  }

  // Scalable slider label helpers
  const describeFontSize = (sz) =>
    sz < 16 ? "Small" : sz < 24 ? "Medium" : sz < 32 ? "Large" : "Extra large";
  const describeSpeed = (sp) =>
    sp <= 0.7 ? "Very Slow" : sp < 1.0 ? "Slow" : sp < 1.5 ? "Normal" : "Fast";

  return (
    <form
      aria-label="Settings page"
      style={{
        padding: "1em",
        maxWidth: 700,
        margin: "0 auto",
        border: "2px solid var(--border-color, #1976D2)",
        borderRadius: 8,
        background: "#fafbff",
      }}
      onSubmit={handleSavePreferences}
    >
      <h2
        ref={headingRef}
        tabIndex={0}
        style={{
          fontSize: settings.fontSize + 8,
          fontWeight: "bold",
          marginBottom: "0.2em",
        }}
      >
        Settings
      </h2>
      <fieldset
        style={{
          border: "none",
          marginBottom: "1.6em",
          padding: 0,
        }}
      >
        <legend style={{ fontWeight: 700, fontSize: settings.fontSize + 2 }}>
          Accessibility Controls
        </legend>

        {/* Font size */}
        <label
          htmlFor="fontSize"
          style={{ display: "block", marginBottom: 8, fontSize: settings.fontSize }}
        >
          Font Size:{" "}
          <span tabIndex={0} style={{ fontWeight: 600 }}>
            {settings.fontSize}px ({describeFontSize(settings.fontSize)})
          </span>
        </label>
        <input
          id="fontSize"
          name="fontSize"
          type="range"
          min="14"
          max="40"
          step="2"
          value={settings.fontSize}
          onChange={(e) => updateSetting("fontSize", parseInt(e.target.value))}
          aria-valuenow={settings.fontSize}
          aria-label="Font size"
          style={{ width: "80%", marginBottom: 18 }}
        />

        {/* TTS Speed */}
        <label
          htmlFor="ttsSpeed"
          style={{ display: "block", marginBottom: 8, fontSize: settings.fontSize }}
        >
          TTS Speed:{" "}
          <span tabIndex={0} style={{ fontWeight: 600 }}>
            {settings.ttsSpeed}x ({describeSpeed(settings.ttsSpeed)})
          </span>
        </label>
        <input
          id="ttsSpeed"
          name="ttsSpeed"
          type="range"
          min="0.6"
          max="2"
          step="0.05"
          value={settings.ttsSpeed}
          onChange={(e) => updateSetting("ttsSpeed", parseFloat(e.target.value))}
          aria-valuenow={settings.ttsSpeed}
          aria-label="TTS speed"
          style={{ width: "80%", marginBottom: 18 }}
        />

        {/* Language */}
        <label
          htmlFor="language"
          style={{ display: "block", fontSize: settings.fontSize }}
        >
          Language:
        </label>
        <select
          id="language"
          name="language"
          value={settings.language}
          onChange={(e) => updateSetting("language", e.target.value)}
          aria-label="Preferred language"
          style={{
            fontSize: settings.fontSize,
            padding: "0.3em 0.6em",
            marginBottom: 18,
            marginTop: 4,
          }}
        >
          {languageOptions.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </fieldset>

      {/* User Preferences Save (if logged in) */}
      {userId && (
        <div style={{ marginBottom: "1em" }}>
          <button
            type="submit"
            style={buttonStyle}
            aria-label="Save preferences"
            disabled={saving}
            tabIndex={0}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {saveState === "success" && (
            <span
              aria-label="Preferences saved"
              tabIndex={0}
              style={{
                fontSize: settings.fontSize - 2,
                color: "green",
                marginLeft: ".5em",
              }}
            >
              Preferences saved!
            </span>
          )}
          {saveState === "error" && (
            <span
              aria-label="Failed to save preferences"
              tabIndex={0}
              style={{
                fontSize: settings.fontSize - 2,
                color: "red",
                marginLeft: ".5em",
              }}
            >
              Failed to save. Try again.
            </span>
          )}
        </div>
      )}
    </form>
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
  minWidth: 90,
  minHeight: 44,
  marginRight: "0.3em",
  marginTop: "0.3em",
  transition: "background 0.2s, border 0.2s, color 0.2s",
};

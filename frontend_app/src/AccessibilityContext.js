import React, { createContext, useContext, useState, useMemo } from "react";

const defaultSettings = {
  fontSize: 20,
  ttsSpeed: 1.0,
  theme: "light",
  language: "en",
  favorites: [],
  user: null,
};

// PUBLIC_INTERFACE
export const AccessibilityContext = createContext({
  settings: defaultSettings,
  setSettings: () => {},
  updateSetting: () => {},
  saveUserPreferences: () => {},
});

// PUBLIC_INTERFACE
export function useAccessibility() {
  return useContext(AccessibilityContext);
}

// PUBLIC_INTERFACE
export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);

  // PUBLIC_INTERFACE
  function updateSetting(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }
  // Save user preferences remotely (implement as needed)
  async function saveUserPreferences(api, userId) {
    if (!userId) return;
    const { fontSize, ttsSpeed, language } = settings;
    await api.updateUserPreferences(userId, {
      preferred_font_size: fontSize,
      preferred_tts_speed: ttsSpeed,
      preferred_language: language,
    });
  }

  const value = useMemo(
    () => ({ settings, setSettings, updateSetting, saveUserPreferences }),
    [settings]
  );
  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

import React, { useRef, useState, useEffect } from "react";
import { sendVoiceCommand } from "../api";
import { useAccessibility } from "../AccessibilityContext";

/**
 * Accessible Voice Command Page:
 * - Integrates with backend voice command endpoint.
 * - Supports keyboard navigation and ARIA/screen reader accessibility.
 * - Provides clear controls for recording, manual input, and output feedback.
 */
// PUBLIC_INTERFACE
export default function VoiceCommandPage() {
  const { settings } = useAccessibility();
  const headingRef = useRef();
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [userCommand, setUserCommand] = useState("");
  const [backendResponse, setBackendResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);
  const textInputRef = useRef();

  // Focus heading for screen readers on mount
  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, []);

  // Start/stop speech recognition (browser Web Speech API)
  const startListening = () => {
    setError("");
    setBackendResponse(null);
    setUserCommand("");
    setInterimTranscript("");
    setListening(true);

    // Browser SpeechRecognition
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) throw new Error("Speech recognition not supported.");
      const recognition = new SpeechRecognition();

      recognition.lang = settings.language || "en";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interim);
        if (final) {
          setUserCommand(final);
          setListening(false);
          recognition.stop();
        }
      };
      recognition.onerror = (event) => {
        setError("Microphone or speech recognition error (" + event.error + ").");
        setListening(false);
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError(err.message || "Speech recognition not available in your browser.");
      setListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  // Keyboard shortcut: focus text input on "/" key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "/" && document.activeElement !== textInputRef.current) {
        textInputRef.current?.focus();
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // PUBLIC_INTERFACE
  async function handleSendCommand(e) {
    e?.preventDefault();
    setLoading(true);
    setBackendResponse(null);
    setError("");
    try {
      const resp = await sendVoiceCommand(userCommand || interimTranscript, { language: settings.language });
      setBackendResponse(resp);
      setLoading(false);

      // Auto TTS response if response text available
      if (resp && resp.reply_text) {
        playText(resp.reply_text);
      }
    } catch (err) {
      setError("Backend error or network issue.");
      setLoading(false);
    }
  }

  // Text-to-speech for output response (browser synth)
  function playText(text) {
    if ("speechSynthesis" in window && text) {
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = settings.language || "en";
      utter.rate = settings.ttsSpeed || 1.0;
      window.speechSynthesis.speak(utter);
    }
  }

  // Restore focus to input after backend response
  useEffect(() => {
    if (backendResponse && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [backendResponse]);

  // Render component UI
  return (
    <div
      aria-label="Voice Command page"
      style={{
        padding: "1.5em",
        maxWidth: 700,
        margin: "0 auto",
        border: "2px solid var(--border-color, #1976D2)",
        borderRadius: 10,
        background: "#fafbff",
      }}
    >
      <h2
        ref={headingRef}
        tabIndex={0}
        style={{
          fontSize: settings.fontSize + 10,
          fontWeight: 800,
          marginBottom: "0.4em",
        }}
        aria-label="Voice Command page heading"
      >
        Voice Command
      </h2>
      <p tabIndex={0} style={{ fontSize: settings.fontSize, lineHeight: 1.5, marginBottom: "1em" }}>
        Use your voice or keyboard to control the app. Start recording, or type your command (example: "Go to favorites", "What is my daily suggestion?").
        <br />
        <span style={{ fontWeight: 600 }}>Press <kbd>/</kbd> to quickly focus the command input via keyboard.</span>
      </p>
      <form
        aria-label="Voice command input form"
        style={{ display: "flex", flexDirection: "column", gap: "0.7em" }}
        onSubmit={handleSendCommand}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
          <button
            type="button"
            style={{
              ...buttonStyle,
              background: listening ? "#FF9800" : "var(--button-bg, #1976D2)",
              border: listening ? "2px solid #FFD600" : "2px solid transparent",
              outline: listening ? "2px solid #FFD600" : "",
              minWidth: 52,
              minHeight: 44,
            }}
            aria-label={listening ? "Stop recording voice command" : "Start recording voice command"}
            aria-pressed={listening}
            onClick={listening ? stopListening : startListening}
            disabled={loading}
            tabIndex={0}
          >
            {listening ? "🛑 Stop" : "🎤 Speak"}
          </button>
          <label
            htmlFor="vc-input"
            style={{ fontWeight: 700, fontSize: settings.fontSize + 2, display: "block", marginRight: 8 }}
          >
            Command:
          </label>
          <input
            ref={textInputRef}
            id="vc-input"
            name="voice_command"
            type="text"
            autoComplete="off"
            disabled={loading || listening}
            value={userCommand}
            onChange={(e) => setUserCommand(e.target.value)}
            style={{
              fontSize: settings.fontSize + 2,
              flex: 1,
              padding: "0.4em 0.7em",
              borderRadius: 6,
              border: "1.5px solid #bbb",
              background: "#fff",
              outlineOffset: 3,
            }}
            aria-label="Type voice command manually"
            tabIndex={0}
            placeholder="Speak or type a command..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) handleSendCommand(e);
            }}
          />
          <button
            type="submit"
            style={{
              ...buttonStyle,
              background: "#43A047",
              minWidth: 70,
              minHeight: 44,
              marginLeft: 8,
            }}
            aria-label="Send command to backend"
            disabled={
              loading ||
              (!userCommand && !interimTranscript) ||
              listening
            }
            tabIndex={0}
          >
            Send
          </button>
        </div>
        {/* Live (interim) transcript for screen reader */}
        {interimTranscript && !userCommand && (
          <div
            aria-live="polite"
            tabIndex={0}
            style={{
              fontSize: settings.fontSize,
              color: "#1976D2",
              background: "#E3F2FD",
              borderRadius: 5,
              padding: "0.5em 1em",
              marginBottom: 3,
              outline: "none",
            }}
            aria-label={`Recognized: ${interimTranscript}`}
          >
            <b>Listening…</b> {interimTranscript}
          </div>
        )}
        {/* Error or guidance */}
        {error && (
          <div
            role="alert"
            tabIndex={0}
            style={{
              color: "#D32F2F",
              background: "#fff7f7",
              border: "2px solid #D32F2F",
              borderRadius: 6,
              padding: "0.7em 1em",
              fontSize: settings.fontSize,
              marginBottom: 3
            }}
            aria-label={`Error: ${error}`}
          >
            {error}
          </div>
        )}
        {/* Backend response/answer */}
        {loading && (
          <div
            role="status"
            tabIndex={0}
            aria-busy="true"
            style={{ color: "#555", fontSize: settings.fontSize, marginBottom: 2 }}
          >
            Processing command, please wait…
          </div>
        )}
        {backendResponse && (
          <div
            aria-live="polite"
            tabIndex={0}
            style={{
              fontSize: settings.fontSize + 2,
              color: "#1976D2",
              background: "#f6ffea",
              border: "2px solid #43A047",
              borderRadius: 8,
              padding: "1em",
              margin: "1em 0 0.3em 0"
            }}
            aria-label={
              backendResponse.reply_text
                ? `Backend replied: ${backendResponse.reply_text}`
                : "Command processed"
            }
          >
            <strong>Response: </strong>
            <span>{backendResponse.reply_text || "Command processed."}</span>
            {backendResponse.navigate_url && (
              <div>
                <a
                  href={backendResponse.navigate_url}
                  style={{
                    color: "#fff",
                    background: "#1976D2",
                    borderRadius: 5,
                    padding: "0.25em 0.7em",
                    textDecoration: "none",
                    fontWeight: 600,
                    marginLeft: 8,
                  }}
                  tabIndex={0}
                  aria-label="Visit destination page"
                >
                  Visit Page
                </a>
              </div>
            )}
          </div>
        )}
        <div
          tabIndex={0}
          aria-label="Voice command page help and keyboard navigation instructions"
          style={{
            marginTop: "1.4em",
            color: "#444",
            fontSize: settings.fontSize - 2,
            background: "#f7f7ff",
            borderRadius: 8,
            padding: "0.8em 1em"
          }}
        >
          <b>Accessibility tips:</b> <br />
          • All controls are reachable by keyboard (Tab key). <br />
          • <b>Press <kbd>/</kbd></b> anywhere to focus the command input.<br />
          • Your voice command or typed text is sent to the backend for action or reply. <br />
          • Screen reader users: All responses and error messages are live regions.<br />
          • To repeat backend response, select the text and use system's TTS (or press Listen below).
          {backendResponse && backendResponse.reply_text && (
            <button
              style={{
                ...buttonStyle,
                background: "#1976D2",
                color: "#fff",
                marginLeft: 8,
                fontWeight: 600,
                minWidth: 60,
                minHeight: 36
              }}
              aria-label="Play last response with text to speech"
              type="button"
              onClick={() => playText(backendResponse.reply_text)}
              tabIndex={0}
            >
              🔊 Listen
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// Reusable, accessible button style (shared with other pages)
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

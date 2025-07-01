import React, { useEffect, useState, useRef } from "react";
import { getUserQuizResults, getTTSForContent } from "../api";
import { useAccessibility } from "../AccessibilityContext";
import { useNavigate } from "react-router-dom";

// Accessible, high-contrast, scalable button style for reuse
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

/**
 * Accessible Quiz Results Page:
 * - Fetches and lists user's quiz results from backend.
 * - Supports high contrast, large font size, ARIA labels, keyboard navigation.
 * - Each result is screen reader-friendly and TTS-playable.
 * - Provides visual and audible score feedback.
 */
// PUBLIC_INTERFACE
export default function QuizResultsPage() {
  const { settings } = useAccessibility();
  const userId = settings.user?.id;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ttsId, setTtsId] = useState(null);
  const [error, setError] = useState("");
  const headingRef = useRef();
  const navigate = useNavigate();

  // Fetch quiz results on mount/user change
  useEffect(() => {
    setLoading(true);
    setError("");
    if (!userId) {
      setResults([]);
      setLoading(false);
      return;
    }
    getUserQuizResults(userId)
      .then((data) => {
        setResults(data && Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load quiz results.");
        setLoading(false);
      });
  }, [userId]);

  // Focus heading on load for screen readers
  useEffect(() => {
    if (headingRef.current && !loading) headingRef.current.focus();
  }, [loading]);

  // Play result summary TTS (prefer backend TTS; fallback to browser synth)
  async function handlePlayTTSForResult(result) {
    setTtsId(result.id || result.quiz_id || "none");
    try {
      // Best: summarize the result or fetch TTS for associated content
      let ttsUrl = "";
      if (result.content_id) {
        // Try TTS relevant to quiz's content
        const ttsData = await getTTSForContent(result.content_id);
        if (ttsData && ttsData.url) ttsUrl = ttsData.url;
      }
      if (ttsUrl) {
        const audio = new window.Audio(ttsUrl);
        audio.playbackRate = settings.ttsSpeed || 1.0;
        audio.onended = () => setTtsId(null);
        audio.onerror = () => setTtsId(null);
        audio.play();
      } else {
        // Fallback: build a summary string and use browser TTS
        const summary =
          "Quiz result. Score: " +
          ((result.score !== undefined && result.total !== undefined)
            ? `${result.score} out of ${result.total}.`
            : result.score !== undefined
            ? `${result.score}`
            : "") +
          (Array.isArray(result.details)
            ? " Top question: " + (result.details[0]?.question || "") +
              ". Your answer: " + (result.details[0]?.your_answer || "") +
              "."
            : "");
        if (window.speechSynthesis && summary) {
          const utter = new window.SpeechSynthesisUtterance(summary);
          utter.lang = settings.language || "en";
          utter.rate = settings.ttsSpeed || 1.0;
          utter.onend = () => setTtsId(null);
          window.speechSynthesis.speak(utter);
        } else {
          setTtsId(null);
        }
      }
    } catch {
      setTtsId(null);
    }
  }

  // Loading and error states
  if (!userId)
    return (
      <div style={{ fontSize: settings.fontSize, padding: "2em" }}>
        <h2 ref={headingRef} tabIndex={0} aria-label="Quiz Results">Quiz Results</h2>
        <div tabIndex={0} aria-label="Please sign in to view results">
          Please sign in or create a profile to view quiz results.
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
          marginTop: "2em",
        }}
      >
        Loading quiz results, please wait...
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
      aria-label="Quiz Results page"
      style={{
        padding: "1em",
        maxWidth: 800,
        margin: "0 auto",
        border: "2px solid var(--border-color, #1976D2)",
        borderRadius: 8,
        background: "#fafbff",
      }}
    >
      <h2
        ref={headingRef}
        tabIndex={0}
        aria-label="Quiz Results"
        style={{
          fontSize: settings.fontSize + 8,
          fontWeight: 700,
          marginBottom: "0.3em",
        }}
      >
        Quiz Results
      </h2>
      {results.length === 0 ? (
        <div tabIndex={0} aria-label="No quiz results found" style={{ fontSize: settings.fontSize, margin: "2em 0" }}>
          You have not completed any quizzes yet.
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "1.4em",
          }}
        >
          {/* Each quiz result summary */}
          {results.map((result, idx) => (
            <li
              key={result.id || result.quiz_id || idx}
              tabIndex={0}
              aria-label={
                "Quiz " +
                (result.quiz_id || idx + 1) +
                (result.timestamp ? ` taken at ${new Date(result.timestamp).toLocaleString()}. ` : ". ") +
                "Your score: " +
                (result.score !== undefined && result.total !== undefined
                  ? `${result.score} out of ${result.total}`
                  : result.score !== undefined
                  ? result.score
                  : "N/A"
                ) +
                (Array.isArray(result.details)
                  ? ". " + (result.details[0]?.question ? "First question: " + result.details[0].question : "")
                  : "")
              }
              style={{
                background: "#fff",
                border: "2px solid #ceceee",
                borderRadius: 8,
                padding: "1.2em",
                fontSize: settings.fontSize,
                boxShadow: "0 1px 6px rgba(40,60,230,0.08)",
                outline: "none",
                transition: "box-shadow 0.15s",
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && ttsId !== (result.id || result.quiz_id)) {
                  handlePlayTTSForResult(result);
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "1em",
                  marginBottom: "0.5em",
                }}
              >
                <span
                  aria-label={`Quiz ${result.quiz_id || idx + 1}`}
                  style={{
                    fontSize: settings.fontSize + 3,
                    fontWeight: 600,
                    color: "#1976D2",
                    marginRight: 10,
                    minWidth: 80,
                    outline: "none",
                  }}
                  tabIndex={0}
                >
                  Quiz #{result.quiz_id || idx + 1}
                </span>
                {result.timestamp && (
                  <span
                    style={{
                      fontSize: settings.fontSize - 2,
                      color: "#666",
                      marginLeft: 6,
                    }}
                    tabIndex={0}
                  >
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: settings.fontSize + 2,
                  fontWeight: "bold",
                  color: "#2C9900",
                  marginBottom: 6,
                }}
                tabIndex={0}
                aria-label={"Your score: " + (result.score !== undefined && result.total !== undefined
                  ? `${result.score} out of ${result.total}`
                  : result.score !== undefined
                  ? result.score
                  : "N/A")}
              >
                Score:&nbsp;
                {result.score !== undefined && result.total !== undefined
                  ? `${result.score} / ${result.total}`
                  : result.score !== undefined
                  ? result.score
                  : "N/A"
                }
              </div>
              {/* Details (show only a few for space) */}
              {Array.isArray(result.details) && (
                <div
                  aria-label="Quiz result details"
                  style={{
                    background: "#fafff7",
                    border: "1.5px solid #cddc39",
                    borderRadius: 7,
                    padding: "0.9em",
                    marginTop: "0.6em",
                    marginBottom: "0.7em",
                    fontSize: settings.fontSize - 2,
                  }}
                >
                  {result.details.slice(0, 3).map((d, i) => (
                    <div key={i} style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>Q: {d.question}</span>
                      <br />
                      <span>
                        <span style={{ fontWeight: 400 }}>Your answer: {d.your_answer}&nbsp;</span>
                        {d.correct
                          ? <span aria-label="Correct answer" style={{ color: "green" }}>✔</span>
                          : <span aria-label="Incorrect answer" style={{ color: "red" }}>✖</span>}
                      </span>
                      {d.correct === false && (
                        <span style={{ display: "block", color: "#1976D2", fontWeight: 400 }}>
                          Correct: {d.correct_answer}
                        </span>
                      )}
                    </div>
                  ))}
                  {result.details.length > 3 && (
                    <span tabIndex={0} aria-label="Only showing first three of multiple questions">
                      (+ {result.details.length - 3} more questions)
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "1em", marginTop: "0.5em" }}>
                <button
                  style={buttonStyle}
                  aria-label="Play result with text to speech"
                  onClick={() => handlePlayTTSForResult(result)}
                  disabled={ttsId === (result.id || result.quiz_id)}
                  tabIndex={0}
                  type="button"
                >
                  {ttsId === (result.id || result.quiz_id) ? "Playing..." : "🔊 Listen"}
                </button>
                <button
                  style={buttonStyle}
                  aria-label="See all quiz questions and answers"
                  onClick={() =>
                    window.alert(
                      Array.isArray(result.details)
                        ? result.details
                            .map(
                              (d, i) =>
                                `Q${i + 1}: ${d.question}\nYour answer: ${d.your_answer}${d.correct ? " (✔)" : " (✖)"}${
                                  d.correct === false ? `\nCorrect: ${d.correct_answer}` : ""
                                }`
                            )
                            .join("\n\n")
                        : "No details."
                    )
                  }
                  tabIndex={0}
                  type="button"
                >
                  Details
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", gap: "1em", marginTop: "2em" }}>
        <button
          style={buttonStyle}
          aria-label="Back to quiz"
          onClick={() => navigate("/quiz")}
          tabIndex={0}
        >
          📝 New Quiz
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
      <section
        tabIndex={0}
        aria-label="Quiz results accessibility help"
        style={{
          marginTop: "1.5em",
          color: "#3569bb",
          fontSize: settings.fontSize - 2,
          background: "#e0e7ff",
          borderRadius: 7,
          padding: "0.8em 1em",
        }}
      >
        <b>Accessibility tips:</b><br />
        • Use Tab/Shift+Tab to move between results and controls.<br />
        • Press <kbd>Enter</kbd> or <kbd>Space</kbd> on a result to hear the TTS summary.<br />
        • All results, scores and answers are ARIA-labeled and readable by screen readers.<br />
        • Quiz details can be expanded for each result.<br />
        • Use browser or system TTS for additional audio feedback.
      </section>
    </div>
  );
}

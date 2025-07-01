import React, { useEffect, useState, useRef } from "react";
import {
  listQuizzes,
  getQuizById,
  submitQuizResult,
  getUserQuizResults,
  getTTSForContent,
} from "../api";
import { useAccessibility } from "../AccessibilityContext";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Accessible Quiz Page: Loads a quiz from backend, supports answering,
 * clean keyboard navigation, and ARIA labels for all operations.
 */
// PUBLIC_INTERFACE
export default function QuizPage() {
  const { settings } = useAccessibility();
  const userId = settings.user?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quizList, setQuizList] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [resultDetail, setResultDetail] = useState(null);
  const [ttsLoading, setTtsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const headingRef = useRef();

  // Fetch quiz list and select quiz (from contentId if passed)
  useEffect(() => {
    setLoading(true);
    setError("");
    // Quiz can be selected by contentId (from navigation) or random from all
    const contentId = location.state?.contentId;

    listQuizzes()
      .then((qs) => {
        setQuizList(qs || []);
        if (qs && qs.length > 0) {
          let selected;
          // Try get by contentId if present, else pick first
          if (contentId) {
            selected = qs.find(q => String(q.content_id) === String(contentId));
          }
          if (!selected) selected = qs[0];
          return getQuizById(selected.id);
        }
        throw new Error("No quiz available");
      })
      .then((quizData) => {
        setQuiz(quizData);
        setAnswers({});
        setLoading(false);
      })
      .catch((e) => {
        setError("Failed to load quiz.");
        setLoading(false);
      });
  // eslint-disable-next-line
  }, [location.state]);

  // Focus heading for screen readers
  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, [loading]);

  const handleSelect = (qId, choiceIdx) => {
    setAnswers((prev) => ({ ...prev, [qId]: choiceIdx }));
  };

  // PUBLIC_INTERFACE
  async function handleSubmit() {
    if (!quiz) return;
    setLoading(true);
    setError("");

    try {
      // Submit result to backend
      const result = await submitQuizResult({
        user_id: userId,
        quiz_id: quiz.id,
        responses: quiz.questions.map(q => ({
          question_id: q.id,
          user_answer_index: answers[q.id]
        })),
        submitted_at: new Date().toISOString(),
      });
      setScore(result.score || null);
      setResultDetail(result);
      setSubmitted(true);
      setLoading(false);
    } catch (e) {
      setError("Failed to submit quiz. Try again later.");
      setLoading(false);
    }
  }

  // Accessible TTS - quiz instruction (from backend if possible, fallback browser)
  async function handlePlayTTS(text) {
    setTtsLoading(true);
    try {
      // Try backend TTS, otherwise browser
      const tts = quiz?.content_id ? await getTTSForContent(quiz.content_id) : null;
      if (tts && tts.url) {
        const audio = new window.Audio(tts.url);
        audio.playbackRate = settings.ttsSpeed || 1.0;
        audio.onended = () => setTtsLoading(false);
        audio.onerror = () => setTtsLoading(false);
        audio.play();
      } else {
        throw new Error();
      }
    } catch {
      if (window.speechSynthesis && text) {
        const utter = new window.SpeechSynthesisUtterance(text);
        utter.lang = settings.language || "en";
        utter.rate = settings.ttsSpeed || 1.0;
        utter.onend = () => setTtsLoading(false);
        window.speechSynthesis.speak(utter);
      } else {
        setTtsLoading(false);
      }
    }
  }

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
        Loading quiz, please wait...
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
        <button
          style={buttonStyle}
          onClick={() => window.location.reload()}
          aria-label="Retry loading quiz"
          tabIndex={0}
        >
          Retry
        </button>
      </div>
    );
  if (!quiz)
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
        No quiz found.
      </div>
    );

  if (submitted)
    return (
      <div
        aria-label="Quiz results"
        style={{
          padding: "1.2em",
          maxWidth: 700,
          margin: "0 auto",
          border: "2px solid #1976D2",
          borderRadius: 10,
          background: "#f8fffa",
        }}
      >
        <h2
          ref={headingRef}
          tabIndex={0}
          style={{
            fontSize: settings.fontSize + 8,
            fontWeight: 700,
            color: "#1976D2",
          }}
        >
          Quiz Complete!
        </h2>
        <p tabIndex={0} style={{ fontSize: settings.fontSize + 2, fontWeight: 600 }}>
          {score !== null
            ? `Your Score: ${score}/${quiz.questions.length}`
            : "Quiz submitted."}
        </p>
        {resultDetail && resultDetail.details && (
          <div
            aria-label="Quiz result details"
            style={{
              background: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "1em",
              margin: "0.7em 0",
              fontSize: settings.fontSize,
            }}
          >
            {resultDetail.details.map((d, idx) => (
              <div key={idx} style={{ marginBottom: ".7em" }}>
                <span style={{ fontWeight: 600 }}>
                  Q: {d.question}
                </span>
                <br />
                <span>
                  Your answer: {d.your_answer} {" "}
                  {d.correct
                    ? <span aria-label="Correct" style={{ color: "green" }}>✔</span>
                    : <span aria-label="Incorrect" style={{ color: "red" }}>✖</span>}
                </span>
                {d.correct === false && (
                  <span style={{ display: "block", color: "#1976D2", fontWeight: 500 }}>
                    Correct: {d.correct_answer}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          style={buttonStyle}
          onClick={() => navigate("/quiz")}
          aria-label="Try another quiz"
          tabIndex={0}
        >
          New Quiz
        </button>
        <button
          style={buttonStyle}
          onClick={() => navigate("/")}
          aria-label="Home"
          tabIndex={0}
        >
          Home
        </button>
      </div>
    );

  // Otherwise, render the quiz
  return (
    <form
      aria-label="Quiz form"
      style={{
        padding: "1em",
        maxWidth: 700,
        margin: "0 auto",
        border: "2px solid var(--border-color, #1976D2)",
        borderRadius: 8,
        background: "#fafbff",
      }}
      onSubmit={e => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <h2
        ref={headingRef}
        tabIndex={0}
        aria-label="Quiz"
        style={{ fontSize: settings.fontSize + 8, fontWeight: 700, marginBottom: "0.3em" }}
      >
        Quiz
      </h2>

      {quiz.instructions &&
        <div style={{ marginBottom: "1em" }}>
          <button
            style={buttonStyle}
            aria-label="Play quiz instructions"
            onClick={e => {
              e.preventDefault();
              handlePlayTTS(quiz.instructions);
            }}
            disabled={ttsLoading}
            tabIndex={0}
            type="button"
          >
            {ttsLoading ? "Playing..." : "🔊 Instructions"}
          </button>
          <span tabIndex={0} style={{ marginLeft: 8, fontSize: settings.fontSize }}>
            {quiz.instructions}
          </span>
        </div>
      }

      {quiz.questions.map((q, idx) => (
        <fieldset
          key={q.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 5,
            marginBottom: "1.2em",
            padding: "1em",
            background: "#fff",
          }}
          aria-labelledby={`qh${q.id}`}
        >
          <legend
            id={`qh${q.id}`}
            style={{
              fontSize: settings.fontSize + 2,
              fontWeight: 700,
              color: "#1976D2",
              marginBottom: "0.45em"
            }}
          >
            Q{idx + 1}: {q.text}
          </legend>
          <div role="group" aria-label={`Choices for question ${idx + 1}`}>
            {q.choices.map((choice, cidx) => (
              <label
                key={cidx}
                htmlFor={`q${q.id}_opt${cidx}`}
                style={{
                  display: "block",
                  fontSize: settings.fontSize,
                  padding: "0.3em 0.7em",
                  cursor: "pointer",
                  marginLeft: 10,
                  marginBottom: 2,
                }}
                aria-label={choice}
              >
                <input
                  id={`q${q.id}_opt${cidx}`}
                  name={`q${q.id}`}
                  type="radio"
                  required
                  checked={answers[q.id] === cidx}
                  onChange={() => handleSelect(q.id, cidx)}
                  aria-checked={answers[q.id] === cidx}
                  style={{
                    width: 24,
                    height: 24,
                    marginRight: 8,
                    verticalAlign: "middle"
                  }}
                  tabIndex={0}
                />
                {choice}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button
        type="submit"
        style={buttonStyle}
        aria-label="Submit quiz answers"
        tabIndex={0}
      >
        Submit Quiz
      </button>
      <button
        style={buttonStyle}
        onClick={() => navigate("/")}
        aria-label="Cancel and return home"
        tabIndex={0}
        type="button"
      >
        Cancel
      </button>
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
  minWidth: 70,
  minHeight: 44,
  marginRight: "0.3em",
  marginTop: "0.7em",
  transition: "background 0.2s, border 0.2s, color 0.2s",
};

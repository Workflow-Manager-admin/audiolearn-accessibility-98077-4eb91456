import React, { useEffect, useRef, useState } from "react";
import { listContent } from "../api";
import { useAccessibility } from "../AccessibilityContext";
import { useNavigate } from "react-router-dom";

/**
 * Accessible Home Page: shows three main sections (Common Words, Sentences (Level 1–2), Paragraphs)
 * as accessible navigation cards/buttons, using backend content where available.
 * Prominently splits navigation and auto-reads aloud using TTS (browser-based for section intro).
 */
// PUBLIC_INTERFACE
export default function HomePage() {
  const { settings } = useAccessibility();
  const navigate = useNavigate();
  const headingRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionSamples, setSectionSamples] = useState({
    word: null,
    sentence: null,
    paragraph: null,
  });

  // Section labels/types (backend key and displayed info)
  const sectionTypes = [
    {
      key: "word",
      label: "Common Words",
      desc: "Learn the most frequent English words.",
      color: "#1565C0",
      ttsIntro: "Common Words. Learn the most frequent English words.",
    },
    {
      key: "sentence",
      label: "Sentences (Level 1–2)",
      desc: "Explore basic level-1 and level-2 English sentences.",
      color: "#00897B",
      ttsIntro: "Sentences, Level 1 to 2. Practice simple English sentences.",
    },
    {
      key: "paragraph",
      label: "Paragraphs",
      desc: "Read and listen to short English paragraphs.",
      color: "#AD1457",
      ttsIntro: "Paragraphs. Listen and improve with short, simple paragraphs.",
    },
  ];

  // Initial fetch: get a sample content item for each section type
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    Promise.all(
      sectionTypes.map((stype) =>
        listContent({ type: stype.key, language: settings.language })
          .then((items) => (items && items.length > 0 ? items[0] : null))
          .catch(() => null)
      )
    )
      .then((results) => {
        if (!mounted) return;
        setSectionSamples({
          word: results[0],
          sentence: results[1],
          paragraph: results[2],
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load content sections from server.");
        setLoading(false);
      });
    return () => { mounted = false; };
    // eslint-disable-next-line
  }, [settings.language]);

  // On load, focus heading for screen readers & announce by TTS
  useEffect(() => {
    if (!loading && headingRef.current) {
      headingRef.current.focus();
      // Announce app context via browser TTS for visually challenged
      speakWithTTS(
        "Welcome to AudioLearn. Accessible English learning. Choose a section: Common Words, Sentences, or Paragraphs."
      );
    }
    // eslint-disable-next-line
  }, [loading]);

  // Play section TTS intro and optionally sample on focus/enter
  function speakWithTTS(text, onEnd = null) {
    // Browser SpeechSynthesis only, fallback if available
    if (window.speechSynthesis && text) {
      try {
        window.speechSynthesis.cancel(); // Stop previous
        const utter = new window.SpeechSynthesisUtterance(text);
        utter.lang = settings.language || "en";
        utter.rate = settings.ttsSpeed || 1.0;
        if (typeof onEnd === "function") {
          utter.onend = onEnd;
        }
        window.speechSynthesis.speak(utter);
      } catch { /* do nothing if error */ }
    } else if (typeof onEnd === "function") {
      // Fallback: call onEnd immediately if TTS not available
      onEnd();
    }
  }

  // Section ARIA/tab navigation: maintain refs for keyboard movement
  const sectionRefs = {
    word: useRef(),
    sentence: useRef(),
    paragraph: useRef(),
  };
  function handleSectionKeyDown(e, idx, stype) {
    if (
      ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"].includes(e.key)
    ) {
      e.preventDefault();
      const order = ["word", "sentence", "paragraph"];
      let newIdx = idx;
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        newIdx = (idx + 1) % order.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        newIdx = (idx + order.length - 1) % order.length;
      sectionRefs[order[newIdx]].current?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      // On enter/space, route and speak TTS intro for the section
      handleSectionClick(stype, true);
    } else if (e.key === "Tab") {
      window.speechSynthesis?.cancel();
    }
  }

  // On section click, TTS-pop followed by navigation only after TTS finishes
  function handleSectionClick(stype, keyboard = false) {
    // Build the text to announce
    const announcement =
      (stype.ttsIntro ||
        `You selected ${stype.label}.`) +
      (sectionSamples[stype.key]?.text
        ? `. Example: ${sectionSamples[stype.key].text}`
        : "");

    // On TTS end, navigate to the section's content
    const onTTSFinish = () => {
      if (sectionSamples[stype.key]) {
        navigate(`/content/${sectionSamples[stype.key].id}`);
      }
    };
    speakWithTTS(announcement, onTTSFinish);
  }

  if (loading) {
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
        Loading learning sections...
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
          maxWidth: 600,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      aria-label="Home page with main learning sections"
      style={{
        padding: "1em",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h1
        ref={headingRef}
        tabIndex={0}
        style={{
          fontSize: settings.fontSize + 10,
          fontWeight: 800,
          outline: "none",
          marginBottom: ".3em",
        }}
        aria-label="Welcome to AudioLearn: Accessible English Learning"
      >
        Welcome to AudioLearn
      </h1>
      <nav
        aria-label="Main learning sections"
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "stretch",
          gap: "1.5em",
          flexWrap: "wrap",
          margin: "1em 0 2em 0",
        }}
      >
        {sectionTypes.map((stype, idx) => (
          <button
            key={stype.key}
            ref={sectionRefs[stype.key]}
            tabIndex={0}
            aria-label={`Select ${stype.label}. ${stype.desc}. Example: ${
              sectionSamples[stype.key]?.text || "No example available"
            }`}
            onClick={() => handleSectionClick(stype, false)}
            style={{
              ...sectionCardStyle,
              borderColor: stype.color,
              background: "#fff",
              color: "#111",
              outline: "none",
            }}
            onFocus={() => speakWithTTS(stype.ttsIntro)}
            onKeyDown={(e) => handleSectionKeyDown(e, idx, stype)}
            id={`section-${stype.key}`}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: settings.fontSize + 8,
                color: stype.color,
                marginBottom: ".22em",
                letterSpacing: "0.01em",
                display: "block",
              }}
              tabIndex={-1}
            >
              {stype.label}
            </span>
            <span
              style={{
                fontSize: settings.fontSize,
                color: "#333",
                marginBottom: ".6em",
                display: "block",
              }}
              tabIndex={-1}
            >
              {stype.desc}
            </span>
            <span
              tabIndex={0}
              aria-label={`Example: ${sectionSamples[stype.key]?.text || "No available sample in this section"}`}
              style={{
                fontSize: settings.fontSize - 2,
                color: "#666",
                display: "block",
                fontStyle: "italic",
                background: "#f5f5f5",
                borderRadius: 7,
                padding: "0.5em 0.9em",
                minHeight: 40,
              }}
            >
              {sectionSamples[stype.key]?.text
                ? `Example: ${sectionSamples[stype.key].text}`
                : <span style={{ color: "#aaa" }}>No example in this section</span>}
            </span>
          </button>
        ))}
      </nav>

      <section
        tabIndex={0}
        aria-label="Home page accessibility help"
        style={{
          marginTop: "1.5em",
          color: "#3569bb",
          fontSize: settings.fontSize - 2,
          background: "#e0e7ff",
          borderRadius: 7,
          padding: "0.8em 1em",
        }}
      >
        <b>Accessibility tips:</b> <br />
        • Use Tab and arrow keys to move between sections. <br />
        • Press Enter or Space to select and enter a section; TTS will read the section on selection. <br />
        • Each section entry will read out the content via text-to-speech.<br />
        • Increase font size and TTS speed in Settings for better visibility and audibility.<br />
        • All navigation is fully ARIA-labeled and screen reader-compatible.
      </section>
    </div>
  );
}

// Accessible, visually distinct, high-contrast section card/button
const sectionCardStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  minWidth: 220,
  minHeight: 200,
  boxShadow: "0 3px 14px rgba(30,52,250,0.06)",
  border: "3px solid #1976D2",
  borderRadius: "16px",
  padding: "1.3em 1.1em 1.2em 1em",
  marginBottom: "0.7em",
  marginTop: "0",
  background: "#fafcff",
  cursor: "pointer",
  transition: "border 0.2s, box-shadow 0.18s",
  fontSize: "inherit",
  outlineOffset: 3,
  fontWeight: 500,
  position: "relative",
};

import React, { useEffect, useRef, useState } from "react";
import { listContent } from "../api";
import { useAccessibility } from "../AccessibilityContext";
import { useNavigate } from "react-router-dom";

/**
 * Accessible Home Page: shows three main sections (Common Words, Sentences, Paragraphs)
 * as accessible navigation cards/buttons. Fetches content types from backend, auto-focuses for screen readers,
 * and allows keyboard/ARIA navigation to each section. Sets up for TTS/auto-play integration.
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

  // Section labels & content types (maps backend "type" to display)
  const sectionTypes = [
    { key: "word", label: "Common Words", desc: "Learn the most frequent English words.", color: "#1565C0" },
    { key: "sentence", label: "Sentences", desc: "Explore basic level-1 and level-2 sentences.", color: "#00897B" },
    { key: "paragraph", label: "Paragraphs", desc: "Read and listen to short English paragraphs.", color: "#AD1457" },
  ];

  // Initial fetch: get a sample content item for each section type
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    // For accessibility, always fetch for current language
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

  // On load, focus the main heading for screen readers
  useEffect(() => {
    if (headingRef.current && !loading) headingRef.current.focus();
  }, [loading]);

  // Keyboard: allow arrow keys to move focus from section-to-section
  const sectionRefs = {
    word: useRef(),
    sentence: useRef(),
    paragraph: useRef(),
  };
  function handleSectionKeyDown(e, idx) {
    if (!["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const order = ["word", "sentence", "paragraph"];
    let newIdx = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") newIdx = (idx + 1) % order.length;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") newIdx = (idx + order.length - 1) % order.length;
    sectionRefs[order[newIdx]].current?.focus();
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
        margin: "0 auto"
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
      <section
        aria-label="Choose a learning section"
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
            aria-label={`Go to ${stype.label}. ${stype.desc} Example: ${sectionSamples[stype.key]?.text || "No example available"}`}
            onClick={() => {
              // Future: route to section page; for now, pass filtered type to /content/:contentId or a filtered page
              // You can route to a filtered content page or set up a section route
              // For now, let's route to the first example for each type (if exists)
              if (sectionSamples[stype.key]) {
                navigate(`/content/${sectionSamples[stype.key].id}`);
              }
            }}
            style={{
              ...sectionCardStyle,
              borderColor: stype.color,
              background: "#fff",
              color: "#111",
              outline: "none",
            }}
            onKeyDown={(e) => handleSectionKeyDown(e, idx)}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: settings.fontSize + 8,
                color: stype.color,
                marginBottom: "0.22em",
                letterSpacing: "0.01em"
              }}
            >
              {stype.label}
            </span>
            <span
              style={{
                fontSize: settings.fontSize,
                color: "#333",
                marginBottom: "0.6em",
                display: "block"
              }}
            >
              {stype.desc}
            </span>
            <span
              tabIndex={0}
              aria-label={`Sample: ${sectionSamples[stype.key]?.text || "No available sample in this section"}`}
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
      </section>

      <div
        tabIndex={0}
        aria-label="Home page accessibility help"
        style={{
          marginTop: "1.5em",
          color: "#3569bb",
          fontSize: settings.fontSize - 2,
          background: "#e0e7ff",
          borderRadius: 7,
          padding: "0.8em 1em"
        }}
      >
        <b>Accessibility tips:</b> <br />
        • Use Tab and arrow keys to move between sections.<br />
        • Press Enter or Space to select and enter a section.<br />
        • Each section entry will read out the content via text-to-speech.<br />
        • Increase font size and TTS speed in Settings for better visibility and audibility.<br />
        • All navigation is fully ARIA-labeled and screen reader-compatible.
      </div>
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
  position: "relative"
};

import React, { useEffect, useRef, useState } from "react";
import { listContent } from "../api";
import { useAccessibility } from "../AccessibilityContext";
import { useNavigate } from "react-router-dom";

/**
 * Accessible Paragraphs Page
 * - Immediately renders default examples before any async operations
 * - Fetches content items of type 'paragraph' from backend
 * - Renders a large, fully ARIA and keyboard-accessible list of paragraphs
 * - Each paragraph can be TTS read aloud by click or keyboard (Enter/Space)
 */

// Default examples always available for immediate render
const defaultParagraphs = [
  {
    id: "p1",
    text:
      "My name is Ana. I live in a big city with my parents and younger sister. Every morning, I take the bus to school and read my favorite book during the ride.",
  },
  {
    id: "p2",
    text:
      "Learning English is fun. I practice new words every day and talk with my friends about different topics. It helps me feel more confident.",
  },
  {
    id: "p3",
    text:
      "In the park, birds sing and children play on the swings. Sometimes, I bring my notebook to write stories while sitting under a tree.",
  },
  {
    id: "p4",
    text:
      "Today is sunny and bright. I am going to visit my grandmother and help her bake a chocolate cake.",
  }
];

// PUBLIC_INTERFACE
export default function ParagraphsPage() {
  console.log('ParagraphsPage: Component mounted'); // Debug log
  
  const { settings } = useAccessibility();
  // Initialize with defaults immediately
  const [paragraphs, setParagraphs] = useState(defaultParagraphs);
  const [loading, setLoading] = useState(false); // Start false to show content immediately
  const [error, setError] = useState("");
  const [ttsId, setTtsId] = useState(null);
  const headingRef = useRef();
  const listRef = useRef();
  const navigate = useNavigate();

  // Focus heading for screen readers on initial render
  useEffect(() => {
    console.log('ParagraphsPage: Initial focus effect running');
    if (headingRef.current) {
      headingRef.current.focus();
      console.log('ParagraphsPage: Heading focused');
    }
  }, []); // Run only once on mount

  // TEMPORARILY COMMENTED OUT - Verify fallback works without backend
  // Attempt to fetch backend content after initial render
  useEffect(() => {
    console.log('ParagraphsPage: Using default paragraphs, backend fetch disabled');
    
    // Uncomment the following to restore backend fetch:
    /*
    console.log('ParagraphsPage: Starting backend content fetch');
    let isMounted = true;
    
    const loadContent = async () => {
      console.log('ParagraphsPage: Initial render complete, paragraphs:', defaultParagraphs.length);
      setLoading(true);
      setError("");

      try {
        console.log('ParagraphsPage: Fetching from backend...');
        const data = await listContent({ type: "paragraph", language: settings.language });
        console.log('ParagraphsPage: Backend response received:', 
          data ? `${data.length} paragraphs` : 'no data');

        if (!isMounted) {
          console.log('ParagraphsPage: Component unmounted, skipping update');
          return;
        }

        // Enhanced validation with detailed logging
        const isValidData = data && 
                          Array.isArray(data) && 
                          data.length > 0 && 
                          data.every(item => item && typeof item.text === 'string');

        if (isValidData) {
          console.log('ParagraphsPage: Valid backend data found, updating content');
          setParagraphs(data);
        } else {
          console.log('ParagraphsPage: Invalid/empty backend data, keeping defaults');
          console.log('ParagraphsPage: Current defaults:', defaultParagraphs.length);
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn('ParagraphsPage: Error fetching content:', err);
        setError("Unable to load paragraphs from server. Showing default examples.");
        console.log('ParagraphsPage: Fallback to defaults after error');
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('ParagraphsPage: Content load complete');
        }
      }
    };

    loadContent();
    return () => { 
      console.log('ParagraphsPage: Cleanup - marking component as unmounted');
      isMounted = false; 
    };
    */
  }, [settings.language]);

  // Helper to trigger browser TTS
  function speakWithTTS(text, onEnd = null) {
    console.log('ParagraphsPage: TTS requested for text:', text?.substring(0, 50) + '...');
    
    if (window.speechSynthesis && text) {
      try {
        window.speechSynthesis.cancel();
        const utter = new window.SpeechSynthesisUtterance(text);
        utter.lang = settings.language || "en";
        utter.rate = settings.ttsSpeed || 1.0;
        if (typeof onEnd === "function") {
          utter.onend = () => {
            console.log('ParagraphsPage: TTS playback complete');
            onEnd();
          };
        }
        window.speechSynthesis.speak(utter);
        console.log('ParagraphsPage: TTS playback started');
      } catch (err) {
        console.warn('ParagraphsPage: TTS error:', err);
        if (typeof onEnd === "function") onEnd();
      }
    } else {
      console.log('ParagraphsPage: TTS not available or no text provided');
      if (typeof onEnd === "function") onEnd();
    }
  }

  // TTS for specific paragraph click or keyboard
  function handleParagraphTTS(paragraphObj) {
    console.log('ParagraphsPage: Paragraph TTS triggered for ID:', paragraphObj.id);
    setTtsId(paragraphObj.id);
    speakWithTTS(paragraphObj.text, () => setTtsId(null));
  }

  // Keyboard handler for paragraph list items
  function handleListItemKey(e, paragraphObj) {
    if (e.key === "Enter" || e.key === " ") {
      console.log('ParagraphsPage: Keyboard TTS triggered for ID:', paragraphObj.id);
      e.preventDefault();
      handleParagraphTTS(paragraphObj);
    }
  }

  if (error) {
    console.log('ParagraphsPage: Rendering error state with defaults');
    return (
      <div
        role="alert"
        tabIndex={0}
        style={{
          fontSize: settings.fontSize,
          color: "#666",
          background: "#fff8f8",
          border: "2px solid #ffcdd2",
          padding: "1em",
          margin: "2em auto",
          maxWidth: 480,
          borderRadius: 14
        }}
      >
        {error}
        <div style={{ marginTop: "1em" }}>
          {/* Still show content even with error */}
          {renderMainContent()}
        </div>
      </div>
    );
  }

  return renderMainContent();

  // Helper to keep main rendering logic DRY
  function renderMainContent() {
    console.log('ParagraphsPage: Rendering main content, paragraphs count:', paragraphs.length);
    
    return (
      <div
        aria-label="Paragraphs page"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px",
          maxWidth: "100vw"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "#fff",
            borderRadius: 14,
            border: "2px solid #AD1457",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}
        >
          <h2
            ref={headingRef}
            tabIndex={0}
            style={{
              fontSize: settings.fontSize + 8,
              fontWeight: 700,
              color: "#AD1457",
              marginBottom: "4px",
              fontFamily: "Helvetica Neue, Arial, sans-serif"
            }}
            aria-label="Paragraphs"
          >
            Paragraphs {loading && "(Updating...)"}
          </h2>
          <p
            style={{
              fontSize: settings.fontSize,
              color: "#222",
              margin: ".8em 0 1.2em 0",
              fontFamily: "Helvetica Neue, Arial, sans-serif"
            }}
            tabIndex={0}
          >
            Listen to and practice with these English paragraphs. Click or press Enter/Space on a paragraph to have it read aloud.
          </p>
          <ul
            ref={listRef}
            aria-label="Paragraph list"
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: ".65em",
              maxHeight: 500,
              overflowY: "auto",
              background: "#fff",
              borderRadius: 8
            }}
          >
            {paragraphs.map((paragraphObj, idx) => (
              <li
                key={paragraphObj.id || idx}
                tabIndex={0}
                style={{
                  fontSize: settings.fontSize + 2,
                  fontFamily: "Helvetica Neue, Arial, sans-serif",
                  fontWeight: 500,
                  color: "#000",
                  background: ttsId === paragraphObj.id ? "#f3f4f6" : "transparent",
                  borderRadius: 8,
                  outline: "none",
                  padding: ".7em 1em",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  transition: "background 0.15s",
                  minHeight: 44,
                  userSelect: "none"
                }}
                aria-label={`Paragraph: ${paragraphObj.text}. Press to play.`}
                onClick={() => handleParagraphTTS(paragraphObj)}
                onKeyDown={e => handleListItemKey(e, paragraphObj)}
              >
                <span 
                  style={{
                    marginRight: 12,
                    marginTop: "2px",
                    color: "#AD1457",
                    fontSize: "1.2em",
                    flexShrink: 0
                  }}
                  aria-hidden="true"
                >
                  🔊
                </span>
                <span style={{ flex: 1 }}>{paragraphObj.text}</span>
              </li>
            ))}
          </ul>

          <button
            style={{
              background: "#AD1457",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 20px",
              fontSize: settings.fontSize,
              fontWeight: 600,
              cursor: "pointer",
              marginTop: "20px",
              fontFamily: "Helvetica Neue, Arial, sans-serif"
            }}
            aria-label="Go back to home"
            onClick={() => navigate("/")}
            tabIndex={0}
          >
            ⬅ Home
          </button>
        </div>

        <section
          tabIndex={0}
          aria-label="Paragraphs page accessibility help"
          style={{
            marginTop: "1em",
            color: "#AD1457",
            fontSize: settings.fontSize - 2,
            background: "#f3f4f6",
            borderRadius: 8,
            padding: "0.8em 1em",
            maxWidth: 480,
            width: "100%",
            fontFamily: "Helvetica Neue, Arial, sans-serif"
          }}
        >
          <b>Accessibility tips:</b> <br />
          • Use Tab and arrow keys to move between paragraphs. <br />
          • Press <kbd>Enter</kbd> or <kbd>Space</kbd> to hear any paragraph via TTS.<br />
          • Click any paragraph to hear it spoken aloud.<br />
          • Increase font size or speech speed in Settings for comfort.
        </section>
      </div>
    );
  }
}

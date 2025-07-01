import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AccessibilityProvider } from "./AccessibilityContext";
import Layout from "./components/Layout";

// Feature screens/pages (stubs; to implement after)
import HomePage from "./pages/HomePage";
import ContentPage from "./pages/ContentPage";
import FavoritesPage from "./pages/FavoritesPage";
import DailySuggestionPage from "./pages/DailySuggestionPage";
import QuizPage from "./pages/QuizPage";
import QuizResultsPage from "./pages/QuizResultsPage";
import SettingsPage from "./pages/SettingsPage";
import VoiceCommandPage from "./pages/VoiceCommandPage";

// PUBLIC_INTERFACE
function App() {
  // Set up TTS autoplay, accessibility listeners, etc. (as needed)
  useEffect(() => {
    // High-contrast CSS vars applied via theme provided in AccessibilityProvider
  }, []);

  return (
    <AccessibilityProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/content/:contentId" element={<ContentPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/daily" element={<DailySuggestionPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/quiz/results" element={<QuizResultsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/voice" element={<VoiceCommandPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </AccessibilityProvider>
  );
}

export default App;

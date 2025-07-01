import axios from "axios";

/**
 * API client for AudioLearn Accessible English App.
 * All endpoints and payloads strictly follow backend OpenAPI documentation.
 */

const API_BASE = "https://vscode-internal-645-beta.beta01.cloud.kavia.ai:3001";

// --- User Endpoints ---

function handleApiError(error) {
  if (error.response) {
    // Returned from backend, but error response
    throw new Error(error.response.data?.detail || `Backend error (${error.response.status})`);
  } else if (error.request) {
    throw new Error("Network error: Unable to reach backend.");
  } else {
    throw new Error(error.message || "Unexpected API error");
  }
}

// PUBLIC_INTERFACE
export const createUser = async (user) => {
  try {
    const res = await axios.post(`${API_BASE}/users/`, user, { headers: { "Content-Type": "application/json" } });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const getUser = async (userId) => {
  try {
    const res = await axios.get(`${API_BASE}/users/${userId}`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const updateUserPreferences = async (userId, data) => {
  try {
    const res = await axios.put(`${API_BASE}/users/${userId}/preferences`, data, { headers: { "Content-Type": "application/json" } });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const exportUserData = async (userId) => {
  try {
    const res = await axios.get(`${API_BASE}/export/userdata/${userId}`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// --- Content Endpoints ---

// PUBLIC_INTERFACE
export const addContent = async (content) => {
  try {
    const res = await axios.post(`${API_BASE}/content/`, content, { headers: { "Content-Type": "application/json" } });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const listContent = async (params = {}) => {
  try {
    const res = await axios.get(`${API_BASE}/content/`, { params });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const getContentById = async (contentId) => {
  try {
    const res = await axios.get(`${API_BASE}/content/${contentId}`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// --- Favorites & Daily Suggestions ---

// PUBLIC_INTERFACE
export const addFavorite = async ({ user_id, content_id }) => {
  try {
    const res = await axios.post(`${API_BASE}/favorites/`, null, { params: { user_id, content_id } });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const listFavorites = async (userId) => {
  try {
    const res = await axios.get(`${API_BASE}/favorites/${userId}`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const getDailySuggestion = async (userId) => {
  try {
    const res = await axios.get(`${API_BASE}/daily_suggestion/${userId}`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// --- Text-to-Speech (TTS) Endpoints ---

// PUBLIC_INTERFACE
export const getTTSForContent = async (contentId) => {
  try {
    const res = await axios.get(`${API_BASE}/tts/${contentId}`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const getBatchTTS = async (content_ids) => {
  try {
    const res = await axios.post(`${API_BASE}/tts/batch`, { content_ids }, { headers: { "Content-Type": "application/json" } });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const ttsCheckDb = async () => {
  try {
    const res = await axios.get(`${API_BASE}/tts/check-db`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// --- Quiz Endpoints ---

// PUBLIC_INTERFACE
export const createQuiz = async (quiz) => {
  try {
    const res = await axios.post(`${API_BASE}/quiz/`, quiz, { headers: { "Content-Type": "application/json" } });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const listQuizzes = async (params = {}) => {
  try {
    const res = await axios.get(`${API_BASE}/quiz/`, { params });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const getQuizById = async (quizId) => {
  try {
    const res = await axios.get(`${API_BASE}/quiz/${quizId}`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const submitQuizResult = async (quizResult) => {
  try {
    const res = await axios.post(`${API_BASE}/quiz/results`, quizResult, { headers: { "Content-Type": "application/json" } });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// PUBLIC_INTERFACE
export const getUserQuizResults = async (userId) => {
  try {
    const res = await axios.get(`${API_BASE}/quiz/results/${userId}`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// --- Voice Command ---

// PUBLIC_INTERFACE
export const sendVoiceCommand = async (command, context = {}) => {
  try {
    const res = await axios.post(`${API_BASE}/voice/command`, { command, context }, { headers: { "Content-Type": "application/json" } });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// --- WebSocket Usage Help (stubbed) ---

// PUBLIC_INTERFACE
export const getWebSocketUsage = async () => {
  try {
    const res = await axios.get(`${API_BASE}/websocket-usage`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// --- Health Check ---

// PUBLIC_INTERFACE
export const healthCheck = async () => {
  try {
    const res = await axios.get(`${API_BASE}/`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

export default {
  createUser,
  getUser,
  updateUserPreferences,
  exportUserData,
  addContent,
  listContent,
  getContentById,
  addFavorite,
  listFavorites,
  getDailySuggestion,
  getTTSForContent,
  getBatchTTS,
  ttsCheckDb,
  createQuiz,
  listQuizzes,
  getQuizById,
  submitQuizResult,
  getUserQuizResults,
  sendVoiceCommand,
  getWebSocketUsage,
  healthCheck
};

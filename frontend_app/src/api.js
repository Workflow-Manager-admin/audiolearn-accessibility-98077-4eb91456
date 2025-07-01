import axios from "axios";

/**
 * API client for AudioLearn Accessible English App.
 * All endpoints and payloads strictly follow backend OpenAPI documentation.
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

// --- User Endpoints ---

// PUBLIC_INTERFACE
export const createUser = (user) =>
  axios.post(`${API_BASE}/users/`, user).then(res => res.data);

// PUBLIC_INTERFACE
export const getUser = (userId) =>
  axios.get(`${API_BASE}/users/${userId}`).then(res => res.data);

// PUBLIC_INTERFACE
export const updateUserPreferences = (userId, data) =>
  axios.put(`${API_BASE}/users/${userId}/preferences`, data).then(res => res.data);

// PUBLIC_INTERFACE
export const exportUserData = (userId) =>
  axios.get(`${API_BASE}/export/userdata/${userId}`).then(res => res.data);

// --- Content Endpoints ---

// PUBLIC_INTERFACE
export const addContent = (content) =>
  axios.post(`${API_BASE}/content/`, content).then(res => res.data);

// PUBLIC_INTERFACE
export const listContent = (params = {}) =>
  axios.get(`${API_BASE}/content/`, { params }).then(res => res.data);

// PUBLIC_INTERFACE
export const getContentById = (contentId) =>
  axios.get(`${API_BASE}/content/${contentId}`).then(res => res.data);

// --- Favorites & Daily Suggestions ---

// PUBLIC_INTERFACE
export const addFavorite = ({ user_id, content_id }) =>
  axios.post(`${API_BASE}/favorites/`, null, { params: { user_id, content_id } }).then(res => res.data);

// PUBLIC_INTERFACE
export const listFavorites = (userId) =>
  axios.get(`${API_BASE}/favorites/${userId}`).then(res => res.data);

// PUBLIC_INTERFACE
export const getDailySuggestion = (userId) =>
  axios.get(`${API_BASE}/daily_suggestion/${userId}`).then(res => res.data);

// --- Text-to-Speech (TTS) Endpoints ---

// PUBLIC_INTERFACE
export const getTTSForContent = (contentId) =>
  axios.get(`${API_BASE}/tts/${contentId}`).then(res => res.data);

// PUBLIC_INTERFACE
export const getBatchTTS = (content_ids) =>
  axios.post(`${API_BASE}/tts/batch`, { content_ids }).then(res => res.data);

// PUBLIC_INTERFACE
export const ttsCheckDb = () =>
  axios.get(`${API_BASE}/tts/check-db`).then(res => res.data);

// --- Quiz Endpoints ---

// PUBLIC_INTERFACE
export const createQuiz = (quiz) =>
  axios.post(`${API_BASE}/quiz/`, quiz).then(res => res.data);

// PUBLIC_INTERFACE
export const listQuizzes = (params = {}) =>
  axios.get(`${API_BASE}/quiz/`, { params }).then(res => res.data);

// PUBLIC_INTERFACE
export const getQuizById = (quizId) =>
  axios.get(`${API_BASE}/quiz/${quizId}`).then(res => res.data);

// PUBLIC_INTERFACE
export const submitQuizResult = (quizResult) =>
  axios.post(`${API_BASE}/quiz/results`, quizResult).then(res => res.data);

// PUBLIC_INTERFACE
export const getUserQuizResults = (userId) =>
  axios.get(`${API_BASE}/quiz/results/${userId}`).then(res => res.data);

// --- Voice Command ---

// PUBLIC_INTERFACE
export const sendVoiceCommand = (command, context = {}) =>
  axios.post(`${API_BASE}/voice/command`, { command, context }).then(res => res.data);

// --- WebSocket Usage Help (stubbed) ---

// PUBLIC_INTERFACE
export const getWebSocketUsage = () =>
  axios.get(`${API_BASE}/websocket-usage`).then(res => res.data);

// --- Health Check ---

// PUBLIC_INTERFACE
export const healthCheck = () =>
  axios.get(`${API_BASE}/`).then(res => res.data);

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

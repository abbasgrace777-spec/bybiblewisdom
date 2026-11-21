// ByBibleWisdom Studio API Client

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

export async function fetchJson(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // System Health
  getHealth: () => fetchJson('/system/health'),

  // Dashboard Stats
  getDashboardStats: () => fetchJson('/dashboard/stats'),

  // Bible Books & Verses
  getBibleBooks: () => fetchJson('/bible/books'),
  getBookDetail: (name) => fetchJson(`/bible/books/${name}`),
  getVerses: (book, chapter, translation = 'WEB') => 
    fetchJson(`/bible/verses/${book}/${chapter}?translation=${translation}`),

  // Historical Stories
  getHistoricalStories: () => fetchJson('/historical/stories'),
  getStoryDetail: (id) => fetchJson(`/historical/stories/${id}`),

  // Projects
  getProjects: () => fetchJson('/projects'),
  getProject: (id) => fetchJson(`/projects/${id}`),
  createProject: (data) => fetchJson('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  createCustomScriptProject: (data) => fetchJson('/projects/custom-script', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProjectStatus: (id, status) => fetchJson(`/projects/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  generateScript: (id) => fetchJson(`/projects/${id}/generate-script`, {
    method: 'POST',
  }),
  getSegments: (id) => fetchJson(`/projects/${id}/segments`),

  // Phase 4: Accuracy & Safety Gate
  verifyAccuracy: (id) => fetchJson(`/projects/${id}/verify-accuracy`, {
    method: 'POST',
  }),
  getCompliance: (id) => fetchJson(`/projects/${id}/compliance`),

  // Phase 5: Voice Generation
  getVoices: () => fetchJson('/voices'),
  generateVoice: (id, options = {}) => fetchJson(`/projects/${id}/generate-voice`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),

  // Phase 6: Visual Image Generation
  generateImages: (id, options = {}) => fetchJson(`/projects/${id}/generate-images`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),

  // Phase 7: Automated Video Rendering & Multi-Track Editing Studio
  renderVideo: (id, options = {}) => fetchJson(`/projects/${id}/render-video`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),

  // Mode B: Prompt Mode
  generatePromptOutline: (data) => fetchJson('/prompt-mode/outline', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPromptOutline: (projectId) => fetchJson(`/prompt-mode/outline/${projectId}`),
  approvePromptAndRun: (data) => fetchJson('/prompt-mode/approve-and-run', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  renderEditorVideo: (id, options = {}) => fetchJson(`/projects/${id}/editor/render`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),
  getRemotionProps: (id) => fetchJson(`/projects/${id}/remotion-props`),
  renderRemotionVideo: (id, options = {}) => fetchJson(`/projects/${id}/remotion/render`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),
  getQualityControl: (id) => fetchJson(`/projects/${id}/quality-control`),
  updateSegment: (id, order, data) => fetchJson(`/projects/${id}/segments/${order}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  regenerateSegmentImage: (id, order, options = {}) => fetchJson(`/projects/${id}/segments/${order}/regenerate-image`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),
  regenerateSegmentVoice: (id, order, options = {}) => fetchJson(`/projects/${id}/segments/${order}/regenerate-voice`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),


  // Copyright & Licensing Provenance System
  getCopyrightAssets: (projectId = null) => fetchJson(`/copyright/assets${projectId ? `?projectId=${projectId}` : ''}`),
  verifyCopyrightCandidate: (candidate) => fetchJson('/copyright/verify-candidate', {
    method: 'POST',
    body: JSON.stringify(candidate),
  }),
  getApprovedSources: () => fetchJson('/copyright/sources'),
  getCopyrightDisclaimer: () => fetchJson('/copyright/disclaimer'),
  getCopyrightReport: (projectId) => fetchJson(`/projects/${projectId}/copyright-report`),

  // Phase 8: Thumbnail & SEO
  generateThumbnail: (id, options = {}) => fetchJson(`/projects/${id}/generate-thumbnail`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),
  generateSeo: (id) => fetchJson(`/projects/${id}/generate-seo`, {
    method: 'POST',
  }),

  // Connection Testing (Task 2, 3, 4 Verification)
  testOllama: () => fetchJson('/settings/test-ollama', { method: 'POST' }),
  testGemini: (geminiApiKey = '') => fetchJson('/settings/test-gemini', {
    method: 'POST',
    body: JSON.stringify({ geminiApiKey })
  }),
  testGeminiText: (geminiApiKey = '', model = 'gemini-2.0-flash') => fetchJson('/settings/test-gemini-text', {
    method: 'POST',
    body: JSON.stringify({ geminiApiKey, model })
  }),
  testIdeogram: (ideogramApiKey = '') => fetchJson('/settings/test-ideogram', {
    method: 'POST',
    body: JSON.stringify({ ideogramApiKey })
  }),

  // Ready to Upload Studio (Replaces direct upload & copyright log)
  getReadyToUpload: (id) => fetchJson(`/projects/${id}/ready-to-upload`),
  getYouTubeStatus: () => fetchJson('/youtube/status'),
  uploadYouTube: (id, options = {}) => fetchJson(`/projects/${id}/upload-youtube`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),

  // Local Ollama AI Script Writer & Model Management
  getOllamaStatus: () => fetchJson('/ollama/status'),
  getOllamaModels: () => fetchJson('/ollama/models'),
  setOllamaModel: (model) => fetchJson('/ollama/model', {
    method: 'POST',
    body: JSON.stringify({ model }),
  }),
  pullOllamaModel: (name) => fetchJson('/ollama/pull', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  generateScriptWithOllama: (id, options = {}) => fetchJson(`/projects/${id}/script`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),
  getProjectScript: (id) => fetchJson(`/projects/${id}/script`),
  updateProjectScript: (id, data) => fetchJson(`/projects/${id}/script`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  approveProjectScript: (id) => fetchJson(`/projects/${id}/script/approve`, {
    method: 'POST',
  }),
  getSceneDescriptions: (id) => fetchJson(`/projects/${id}/scene-descriptions`),

  // Ideogram Dedicated Thumbnail Studio
  getIdeogramStatus: () => fetchJson('/ideogram/status'),
  getIdeogramThumbnail: (id) => fetchJson(`/ideogram/${id}`),
  generateIdeogramThumbnail: (id, options = {}) => fetchJson(`/ideogram/${id}/generate`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),
  selectThumbnailVariant: (id, variantNumber) => fetchJson(`/projects/${id}/select-thumbnail-variant`, {
    method: 'POST',
    body: JSON.stringify({ variantNumber }),
  }),
  uploadIdeogramThumbnail: (id, imageBase64, mimeType = 'image/jpeg') => fetchJson(`/ideogram/${id}/upload`, {
    method: 'POST',
    body: JSON.stringify({ imageBase64, mimeType }),
  }),
  applyIdeogramText: (id, options = {}) => fetchJson(`/ideogram/${id}/apply-text`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),

  // One-Click Production Master Pipeline
  runPipeline: (id, options = {}) => fetchJson(`/projects/${id}/pipeline`, {
    method: 'POST',
    body: JSON.stringify(options),
  }),

  // 12 Christian Content Categories Hub
  getCategories: () => fetchJson('/categories'),
  getCategoryTopics: (id) => fetchJson(`/categories/${id}/topics`),
  generateCategoryTopic: (id, focusPrompt = '') => fetchJson(`/categories/${id}/generate-topic`, {
    method: 'POST',
    body: JSON.stringify({ focusPrompt }),
  }),

  // Content Calendar & Publishing Cadence
  getCalendar: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/calendar${q ? `?${q}` : ''}`);
  },
  scheduleCalendarItem: (data) => fetchJson('/calendar', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateCalendarCadence: (startDate = null) => fetchJson('/calendar/cadence', {
    method: 'POST',
    body: JSON.stringify({ startDate }),
  }),
  updateCalendarItem: (id, data) => fetchJson(`/calendar/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteCalendarItem: (id) => fetchJson(`/calendar/${id}`, {
    method: 'DELETE',
  }),

  // Research Sources & Archaeological Registry
  getResearchSources: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/research/sources${q ? `?${q}` : ''}`);
  },
  addResearchSource: (data) => fetchJson('/research/sources', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Multi-Category Queue Actions
  enqueueCategoryTopic: (topicData) => fetchJson('/queue/topic', {
    method: 'POST',
    body: JSON.stringify(topicData),
  }),
  enqueueProjectToQueue: (projectId) => fetchJson('/queue/project', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
  }),
  retryQueueTask: (queueId) => fetchJson(`/queue/${queueId}/retry`, {
    method: 'POST',
  }),
};

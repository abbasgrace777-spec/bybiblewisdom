const config = require('../config');
const { get } = require('../db/database');
const ollamaService = require('./ollamaService');

class AIService {
  constructor() {
    this.defaultGeminiModel = 'gemini-2.0-flash';
    this.freeGeminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  }

  getOllamaUrl() {
    return ollamaService.getOllamaUrl();
  }

  getGeminiKey() {
    const dbKey = get(`SELECT value FROM settings WHERE key = 'GEMINI_API_KEY'`)?.value;
    return (dbKey && dbKey.trim()) || process.env.GEMINI_API_KEY || config.AI.GEMINI_API_KEY || '';
  }

  getScriptProvider() {
    const dbProvider = get(`SELECT value FROM settings WHERE key = 'SCRIPT_PROVIDER'`)?.value;
    return (dbProvider && dbProvider.trim().toLowerCase()) || 'ollama';
  }

  getScriptModel() {
    const dbModel = get(`SELECT value FROM settings WHERE key = 'SCRIPT_MODEL'`)?.value;
    const provider = this.getScriptProvider();
    if (provider === 'gemini') {
      return (dbModel && dbModel.trim()) || this.defaultGeminiModel;
    }
    return (dbModel && dbModel.trim()) || 'qwen3:4b';
  }

  /**
   * Health & connectivity verification for Google Gemini Free Text API
   * Free tier specs: 15 Requests Per Minute (RPM), 1,500 Requests Per Day (RPD), 1,000,000 Tokens Per Minute (TPM).
   */
  async testGeminiTextConnection(apiKey, model = 'gemini-2.0-flash') {
    const key = (apiKey && apiKey.trim()) || this.getGeminiKey();
    if (!key) {
      return {
        connected: false,
        status: 'NOT CONFIGURED',
        error: 'GEMINI_API_KEY is not configured in Settings.',
        provider: 'Google Gemini Text API',
        model,
        freeTier: '15 RPM / 1,500 RPD / 1,000,000 TPM (Free of charge)'
      };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with the word "READY" if you receive this health check.' }] }]
        })
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        return {
          connected: false,
          status: 'FAILED',
          error: `Gemini API HTTP ${res.status}: ${errBody}`,
          provider: 'Google Gemini Text API',
          model,
          freeTier: '15 RPM / 1,500 RPD / 1,000,000 TPM (Free of charge)'
        };
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        connected: true,
        status: 'CONNECTED',
        provider: 'Google Gemini Text API',
        model,
        reply: reply.trim(),
        freeTier: '15 RPM / 1,500 RPD / 1,000,000 TPM (Free of charge)'
      };
    } catch (err) {
      return {
        connected: false,
        status: 'FAILED',
        error: err.message,
        provider: 'Google Gemini Text API',
        model,
        freeTier: '15 RPM / 1,500 RPD / 1,000,000 TPM (Free of charge)'
      };
    }
  }

  /**
   * Dedicated Gemini Text Generator
   * Strips reasoning tokens (<think>...</think>) and returns cleaned response + token metrics
   */
  async callGeminiText(prompt, systemPrompt = '', options = {}) {
    const key = options.apiKey || this.getGeminiKey();
    const model = options.model || this.getScriptModel();

    if (!key) {
      throw new Error(`NOT CONFIGURED: GEMINI_API_KEY is missing. Please configure your key in Settings to use the Google Gemini script writer.`);
    }

    const startTime = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const bodyPayload = {
      contents: [{
        parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }]
      }],
      generationConfig: {
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        topP: options.topP !== undefined ? options.topP : 0.85,
        maxOutputTokens: options.num_predict || 4000
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`FAILED: Google Gemini API error (HTTP ${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanText = ollamaService.stripThinkingText(rawText);
    const durationMs = Date.now() - startTime;
    const usage = data.usageMetadata || {};

    return {
      text: cleanText,
      rawText,
      provider: 'Google Gemini',
      model,
      performance: {
        totalDurationMs: durationMs,
        evalCount: usage.candidatesTokenCount || 0,
        promptEvalCount: usage.promptTokenCount || 0,
        evalDurationSeconds: parseFloat((durationMs / 1000).toFixed(2)),
        tokensPerSecond: durationMs > 0 && usage.candidatesTokenCount ? parseFloat(((usage.candidatesTokenCount / durationMs) * 1000).toFixed(1)) : 0
      }
    };
  }

  /**
   * Main completion method dispatching to configured provider
   */
  async generateCompletion(prompt, systemPrompt = '', options = {}) {
    const provider = options.provider || this.getScriptProvider();

    if (provider === 'gemini') {
      return this.callGeminiText(prompt, systemPrompt, options);
    }

    // Default: Ollama
    return ollamaService.generateCompletion(prompt, systemPrompt, options);
  }
}

module.exports = new AIService();

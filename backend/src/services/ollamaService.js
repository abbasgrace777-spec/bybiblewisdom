const config = require('../config');
const { get, run } = require('../db/database');

class OllamaService {
  constructor() {
    this.defaultUrl = 'http://localhost:11434';
    this.defaultModel = 'qwen3:4b';
    this.alternativeModel = 'qwen3:8b';
    this.defaultSettings = {
      temperature: 0.7,
      top_p: 0.85,
      num_ctx: 3072, // Optimized for 4GB RTX 3050 VRAM: 100% model layer GPU offload (50+ tok/sec)
      num_predict: 1500,
      repeat_penalty: 1.1
    };
  }

  /**
   * Get configured Ollama API URL
   */
  getOllamaUrl() {
    const dbUrl = get(`SELECT value FROM settings WHERE key = 'OLLAMA_URL'`)?.value;
    return (dbUrl || process.env.OLLAMA_URL || config.AI.OLLAMA_URL || this.defaultUrl).replace(/\/$/, '');
  }

  /**
   * Get configured default model
   * Order of priority: model saved in settings DB > OLLAMA_MODEL env var > config > qwen3:4b
   */
  getActiveModel() {
    const dbModel = get(`SELECT value FROM settings WHERE key = 'OLLAMA_MODEL'`)?.value;
    return (dbModel && dbModel.trim()) || process.env.OLLAMA_MODEL || config.AI.DEFAULT_OLLAMA_MODEL || this.defaultModel || 'qwen3:4b';
  }

  /**
   * Robustly strips <think>...</think> reasoning blocks from model output
   * Ensures reasoning text never leaks into scripts, titles, descriptions or narration.
   */
  stripThinkingText(text) {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text;
    // 1. Strip standard <think>...</think> blocks
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
    // 2. If prompt template omitted opening <think> tag and output starts with thought until </think>
    if (cleaned.includes('</think>')) {
      cleaned = cleaned.replace(/^[\s\S]*?<\/think>/i, '');
    }
    // 3. Strip any leftover <think> or </think> tags
    cleaned = cleaned.replace(/<\/?think>/gi, '');
    // 4. Strip alternate reasoning tags: <thought> or [thought]
    cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
    cleaned = cleaned.replace(/\[thought\][\s\S]*?\[\/thought\]/gi, '');
    return cleaned.trim();
  }

  /**
   * 1. Check whether Ollama is running before generating
   */
  async checkOllamaStatus() {
    const url = this.getOllamaUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`${url}/api/version`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        return {
          running: true,
          url,
          version: data.version || 'unknown',
          error: null
        };
      }
      return {
        running: false,
        url,
        version: null,
        error: `Ollama returned HTTP status ${res.status}`
      };
    } catch (err) {
      clearTimeout(timeout);
      return {
        running: false,
        url,
        version: null,
        error: `Cannot connect to Ollama at ${url}. Please ensure Ollama application is running locally.`
      };
    }
  }

  /**
   * 2 & 3. List installed models and check if model is installed
   */
  async getInstalledModels() {
    const url = this.getOllamaUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(`${url}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Ollama tags returned status ${res.status}`);
      const data = await res.json();
      return (data.models || []).map(m => ({
        name: m.name,
        sizeBytes: m.size,
        sizeGB: (m.size / (1024 * 1024 * 1024)).toFixed(2),
        modifiedAt: m.modified_at,
        details: m.details || {}
      }));
    } catch (err) {
      clearTimeout(timeout);
      return [];
    }
  }

  /**
   * Check whether a specific model is installed
   */
  async isModelInstalled(modelName) {
    const target = (modelName || '').toLowerCase().trim();
    const models = await this.getInstalledModels();
    return models.some(m => {
      const name = m.name.toLowerCase();
      return name === target || name.startsWith(target + ':') || target.startsWith(name + ':');
    });
  }

  /**
   * Pull / Install an Ollama model locally
   */
  async pullModel(modelName, onProgress = null) {
    const url = this.getOllamaUrl();
    const res = await fetch(`${url}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true })
    });

    if (!res.ok) {
      throw new Error(`Failed to initiate pull for ${modelName}: HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (onProgress) onProgress(parsed);
        } catch (e) { }
      }
    }

    return { success: true, model: modelName };
  }

  /**
   * Core Ollama Generator with strict settings and performance metrics
   * Supports direct non-streaming generation for reliable JSON and section scripts,
   * with complete separation of thinking traces (<think>...</think>).
   */
  async generateCompletion(prompt, systemPrompt = '', options = {}) {
    return this.streamCompletion(prompt, systemPrompt, { ...options, stream: false }, null);
  }

  /**
   * Generator supporting streaming (for UI feedback) or direct fast completion
   */
  async streamCompletion(prompt, systemPrompt = '', options = {}, onChunk = null) {
    const url = this.getOllamaUrl();
    const model = options.model || this.getActiveModel();

    const status = await this.checkOllamaStatus();
    if (!status.running) {
      throw new Error(`Ollama is not running locally at ${url}. ${status.error}`);
    }

    const installed = await this.isModelInstalled(model);
    if (!installed) {
      throw new Error(`Selected model '${model}' is not installed in Ollama. Silent model substitution is disabled.`);
    }

    const genOptions = {
      temperature: options.temperature !== undefined ? options.temperature : this.defaultSettings.temperature,
      top_p: options.top_p !== undefined ? options.top_p : this.defaultSettings.top_p,
      num_ctx: options.num_ctx || this.defaultSettings.num_ctx,
      num_predict: options.num_predict || this.defaultSettings.num_predict,
      repeat_penalty: options.repeat_penalty || this.defaultSettings.repeat_penalty
    };

    const startTime = Date.now();
    const isStreaming = onChunk !== null && options.stream !== false;

    // Fast non-streaming path
    if (!isStreaming) {
      const res = await fetch(`${url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          prompt,
          stream: false,
          options: genOptions
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Ollama API error (HTTP ${res.status}): ${errText}`);
      }

      const data = await res.json();
      let rawText = data.response || '';
      let cleanText = this.stripThinkingText(rawText);
      if (!cleanText && data.thinking) {
        const match = data.thinking.match(/(?:draft|hook|sentence|response|text|narration):\s*["']([^"'\r\n]+)["']/i) ||
                      data.thinking.match(/["']([^"'\r\n]{20,200})["']/);
        if (match && match[1]) {
          cleanText = match[1].trim();
          rawText = cleanText;
        }
      }
      const totalDurationMs = Date.now() - startTime;
      const evalDurationSec = data.eval_duration ? (data.eval_duration / 1e9) : (totalDurationMs / 1000);

      return {
        text: cleanText,
        rawText,
        thinking: data.thinking || '',
        model,
        performance: {
          totalDurationMs,
          evalCount: data.eval_count || 0,
          promptEvalCount: data.prompt_eval_count || 0,
          evalDurationSeconds: parseFloat(evalDurationSec.toFixed(2)),
          tokensPerSecond: evalDurationSec > 0 ? parseFloat((data.eval_count / evalDurationSec).toFixed(1)) : 0
        }
      };
    }

    // Streaming path for real-time chunk delivery
    const res = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        prompt,
        stream: true,
        options: genOptions
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Ollama stream error (HTTP ${res.status}): ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let lineBuffer = '';
    let finalMetrics = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            accumulatedText += parsed.response;
            if (onChunk) onChunk(parsed.response, accumulatedText);
          }
          if (parsed.done) {
            const totalDurationMs = Date.now() - startTime;
            const evalDurationSec = parsed.eval_duration ? (parsed.eval_duration / 1e9) : (totalDurationMs / 1000);
            finalMetrics = {
              totalDurationMs,
              evalCount: parsed.eval_count || 0,
              promptEvalCount: parsed.prompt_eval_count || 0,
              tokensPerSecond: evalDurationSec > 0 ? parseFloat((parsed.eval_count / evalDurationSec).toFixed(1)) : 0
            };
          }
        } catch (e) { }
      }
    }

    const cleanedAccumulated = this.stripThinkingText(accumulatedText);

    return {
      text: cleanedAccumulated,
      rawText: accumulatedText,
      model,
      performance: finalMetrics || {
        totalDurationMs: Date.now() - startTime,
        evalCount: accumulatedText.split(/\s+/).length,
        tokensPerSecond: 0
      }
    };
  }

  /**
   * Run comprehensive connection test for local Ollama API
   * Checks status, port 11434, qwen3:4b, qwen3:8b, and reports honest connection details.
   */
  async testOllamaConnection() {
    const status = await this.checkOllamaStatus();
    if (!status.running) {
      return {
        connected: false,
        status: 'DISCONNECTED',
        url: status.url,
        error: status.error || 'Ollama server is offline. Please launch Ollama Desktop or run `ollama serve`.',
        defaultModelInstalled: false,
        alternativeModelInstalled: false,
        installedModels: []
      };
    }

    const models = await this.getInstalledModels();
    const qwen4bInstalled = models.some(m => m.name.toLowerCase() === 'qwen3:4b' || m.name.toLowerCase().startsWith('qwen3:4b'));
    const qwen8bInstalled = models.some(m => m.name.toLowerCase() === 'qwen3:8b' || m.name.toLowerCase().startsWith('qwen3:8b'));

    return {
      connected: true,
      status: 'CONNECTED_AND_VERIFIED',
      url: status.url,
      version: status.version,
      installedCount: models.length,
      installedModels: models.map(m => m.name),
      defaultModel: this.defaultModel,
      defaultModelInstalled: qwen4bInstalled,
      alternativeModel: this.alternativeModel,
      alternativeModelInstalled: qwen8bInstalled,
      activeModel: this.getActiveModel(),
      message: `Ollama is running (v${status.version}). ${models.length} model(s) installed.`
    };
  }
}

module.exports = new OllamaService();

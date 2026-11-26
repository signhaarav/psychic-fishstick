/**
 * providers.js — the provider registry: how to talk to each BYOK provider.
 * No key storage, no calls, no DOM. Add a provider here AND its origin to the CSP, in one commit.
 */

/** Builds a request for an OpenAI-compatible chat endpoint (Groq, OpenRouter, OpenAI). */
function openAiCompatible({ origin, path, model, headers = {} }) {
  return (key) => ({
    url: `${origin}${path}`,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, ...headers },
      body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] }),
    },
  });
}

export const PROVIDERS = [
  {
    id: 'google',
    label: 'Google Gemini',
    origin: 'https://generativelanguage.googleapis.com',
    keyHint: 'Usually starts with AIza',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    buildRequest: (key) => ({
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ping' }] }],
          generationConfig: { maxOutputTokens: 1 },
        }),
      },
    }),
  },
  {
    id: 'groq',
    label: 'Groq',
    origin: 'https://api.groq.com',
    keyHint: 'Starts with gsk_',
    docsUrl: 'https://console.groq.com/keys',
    buildRequest: openAiCompatible({
      origin: 'https://api.groq.com',
      path: '/openai/v1/chat/completions',
      model: 'llama-3.1-8b-instant',
    }),
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    origin: 'https://openrouter.ai',
    keyHint: 'Starts with sk-or-',
    docsUrl: 'https://openrouter.ai/keys',
    buildRequest: openAiCompatible({
      origin: 'https://openrouter.ai',
      path: '/api/v1/chat/completions',
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      headers: { 'X-Title': 'VidyaSetu' },
    }),
  },
  {
    id: 'openai',
    label: 'OpenAI',
    origin: 'https://api.openai.com',
    keyHint: 'Starts with sk-',
    docsUrl: 'https://platform.openai.com/api-keys',
    buildRequest: openAiCompatible({
      origin: 'https://api.openai.com',
      path: '/v1/chat/completions',
      model: 'gpt-4o-mini',
    }),
  },
];

/** @param {string} id @returns {object|null} */
export function getProvider(id) {
  return PROVIDERS.find((provider) => provider.id === id) ?? null;
}

/** Display metadata only — never includes key material. */
export function listProviders() {
  return PROVIDERS.map(({ id, label, keyHint, docsUrl }) => ({ id, label, keyHint, docsUrl }));
}

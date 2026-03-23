window.AIInsightConfig = {
  // Optional remote JSON feed.
  // Expected response shape: { refreshedAt: "...", items: [ ...normalizedStoryObjects ] }
  // The backend example now supports company news, research feeds, and a GitHub-backed tool radar layer.
  // See backend-examples/live-ingest.example.js for a Node-friendly reference.
  liveFeedEndpoint: "https://your-domain.com/api/news",

  // Secure server-side summary endpoint.
  // Do not expose OpenAI or DeepSeek keys directly in the browser.
  // See backend-examples/summary-proxy.example.js for a framework-neutral reference.
  summaryEndpoint: "https://your-domain.com/api/summarize",

  // Lightweight account + sync endpoint.
  // The example account service stores users, sessions, and cloud state for saves / Radar / briefing settings.
  accountEndpoint: "https://your-domain.com/api/account",

  // How often the front-end should poll for refreshed news, in milliseconds.
  autoRefreshMs: 300000,

  openExternalLinksInNewTab: true,

  summaryProviders: {
    local: {
      label: {
        zh: "免费本地摘要",
        en: "Free local summary"
      },
      description: {
        zh: "默认免费可用，不需要任何外部 API Key。适合作为网站上线初期的零成本摘要模式。",
        en: "Free by default with no external API key. Ideal as the zero-cost summary mode for an early launch."
      },
      models: ["local-brief", "local-expanded"],
      defaultModel: "local-brief"
    },
    openai: {
      label: {
        zh: "ChatGPT / OpenAI",
        en: "ChatGPT / OpenAI"
      },
      description: {
        zh: "偏高质量与企业级输出，适合付费方案。",
        en: "Higher-quality enterprise output, suitable for paid plans."
      },
      models: ["gpt-5.4-mini", "gpt-5.4-nano"],
      defaultModel: "gpt-5.4-mini"
    },
    deepseek: {
      label: {
        zh: "DeepSeek",
        en: "DeepSeek"
      },
      description: {
        zh: "偏低成本与高性价比方案。",
        en: "Lower-cost, high-value option."
      },
      models: ["deepseek-chat", "deepseek-reasoner"],
      defaultModel: "deepseek-chat"
    }
  }
};

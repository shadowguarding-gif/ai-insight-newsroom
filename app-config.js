(function () {
  const hasHttpOrigin =
    typeof window !== "undefined" &&
    typeof window.location !== "undefined" &&
    /^https?:$/i.test(window.location.protocol);

  const origin = hasHttpOrigin ? window.location.origin : "";

  window.AIInsightConfig = {
    liveFeedEndpoint: origin ? `${origin}/api/news` : "",
    summaryEndpoint: origin ? `${origin}/api/summarize` : "",
    accountEndpoint: origin ? `${origin}/api/account` : "",
    autoRefreshMs: 300000,
    openExternalLinksInNewTab: true,
    summaryProviders: {
      local: {
        label: {
          zh: "免费本地摘要",
          en: "Free local summary"
        },
        description: {
          zh: "默认免费可用，不需要 API Key。基于站内正文、要点和来源信息生成一版本地摘要。",
          en: "Free by default with no API key required. Builds an on-site summary from the story body, key points, and source details."
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
          zh: "适合更稳定、更完整的商业级摘要与多语言整理。",
          en: "Best for more polished commercial summaries and stronger multilingual output."
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
          zh: "适合更低成本的摘要增强与快速生成。",
          en: "Best for lower-cost summary enhancement and fast generation."
        },
        models: ["deepseek-chat", "deepseek-reasoner"],
        defaultModel: "deepseek-chat"
      }
    }
  };
})();

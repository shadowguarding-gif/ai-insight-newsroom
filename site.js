(function () {
  const STORAGE_KEY = "ai-insight-language";
  const SUMMARY_PROVIDER_KEY = "ai-insight-summary-provider";
  const SUMMARY_MODEL_KEY = "ai-insight-summary-model";
  const VIEW_MODE_KEY = "ai-insight-view-mode";
  const SAVED_STORIES_KEY = "ai-insight-saved-stories";
  const SAVED_SOURCES_KEY = "ai-insight-saved-sources";
  const TRACKED_TOPICS_KEY = "ai-insight-tracked-topics";
  const BRIEFING_SETTINGS_KEY = "ai-insight-briefing-settings";
  const ACCOUNT_TOKEN_KEY = "ai-insight-account-token";

  const categories = [
    { key: "all", label: { zh: "全部", en: "All" } },
    { key: "models", label: { zh: "基础模型", en: "Frontier Models" } },
    { key: "chips", label: { zh: "算力与芯片", en: "Chips & Compute" } },
    { key: "products", label: { zh: "产品与应用", en: "Products & Apps" } },
    { key: "tooling", label: { zh: "工具与开源", en: "Tools & OSS" } },
    { key: "research", label: { zh: "研究突破", en: "Research" } },
    { key: "robotics", label: { zh: "机器人", en: "Robotics" } },
    { key: "policy", label: { zh: "政策治理", en: "Policy" } }
  ];

  const regions = [
    { key: "all", label: { zh: "全球范围", en: "All regions" } },
    { key: "global", label: { zh: "全球", en: "Global" } },
    { key: "us", label: { zh: "美国", en: "United States" } },
    { key: "china", label: { zh: "中国", en: "China" } },
    { key: "europe", label: { zh: "欧洲", en: "Europe" } },
    { key: "apac", label: { zh: "亚太", en: "APAC" } }
  ];

  const signals = {
    frontier: { zh: "前沿信号", en: "Frontier Signal" },
    breakout: { zh: "关键突破", en: "Breakout" },
    watch: { zh: "持续观察", en: "Watchlist" }
  };

  const formats = [
    { key: "all", label: { zh: "全部视图", en: "All views" } },
    { key: "live", label: { zh: "实时新闻", en: "Live news" } },
    { key: "briefs", label: { zh: "深度简报", en: "Deep briefs" } },
    { key: "tools", label: { zh: "工具与开源", en: "Tools & OSS" } },
    { key: "research", label: { zh: "研究动向", en: "Research" } }
  ];

  const viewModes = [
    {
      key: "pulse",
      label: { zh: "炫酷版", en: "Pulse" }
    },
    {
      key: "light",
      label: { zh: "亮色版", en: "Light" }
    },
    {
      key: "pro",
      label: { zh: "专业版", en: "Pro" }
    }
  ];

  const copy = {
    zh: {
      siteTitle: "AI Insight",
      brandSubtitle: "全球 AI 资讯情报台",
      nav: {
        home: "首页",
        feed: "资讯",
        search: "搜索",
        radar: "雷达",
        sources: "期刊",
        briefing: "我的简报",
        account: "账号"
      },
      common: {
        viewDetail: "查看详情",
        reset: "重置筛选",
        insight: "编辑洞察",
        related: "延伸阅读",
        backToFeed: "返回资讯页",
        notFoundTitle: "没有找到这篇内容",
        notFoundBody: "链接可能失效，或这条内容还没有准备好公开展示。",
        searchPlaceholder: "输入模型、公司、赛道、关键词或观点",
        readingTimeSuffix: "分钟阅读",
        live: "实时",
        openSource: "查看原文",
        originalSource: "原文网址",
        editorialSummary: "编辑总结",
        aiSummary: "AI 摘要",
        liveFeed: "实时资讯流",
        source: "来源",
        summaryEngine: "摘要引擎",
        configureBackend: "未接入后端时将回退到预置摘要",
        chooseProvider: "选择摘要提供商",
        chooseModel: "选择模型",
        generateSummary: "生成 AI 摘要",
        generating: "生成中...",
        summaryReady: "摘要已更新",
        summaryFallback: "当前显示的是预置摘要，可接入后端后切换为实时生成",
        summaryError: "摘要服务暂时不可用，已回退到预置内容",
        externalCoverage: "源站报道",
        sourceBacked: "已附原文链接",
        liveUpdated: "最近更新时间",
        openInNewTab: "新标签打开",
        summarySeed: "预置摘要",
        refreshNow: "立即刷新",
        refreshingNow: "正在刷新",
        sourceDesk: "专业源",
        accessOpen: "开放获取",
        accessHybrid: "混合获取",
        accessSubscription: "订阅制",
        kindJournal: "期刊",
        kindPreprint: "预印本",
        kindConference: "会议",
        visitSource: "访问来源",
        save: "收藏",
        saved: "已收藏",
        trackTopic: "关注主题",
        trackedTopic: "已关注主题",
        removeTopic: "移除主题",
        saveSource: "收藏来源",
        savedSource: "已收藏来源",
        myBriefing: "我的 Briefing",
        noSavedStories: "你还没有收藏文章，先从资讯流里挑一些你关心的内容。",
        noSavedSources: "你还没有收藏专业来源，适合先去期刊页建立自己的研究入口。",
        personalized: "个性化",
        briefingIntro: "这里会根据你的收藏与偏好，把实时新闻、重点文章和专业来源整理成一个更适合你自己的入口。",
        briefingSaved: "已收藏文章",
        briefingLive: "与你兴趣相关的实时新闻",
        briefingSources: "你收藏的专业来源",
        briefingFallback: "暂时没有足够的个性化信号，先用全站重点内容给你占位。",
        saveToBriefing: "收藏后会进入你的 Briefing"
      },
      footer: "一个面向全球读者的 AI 资讯原型，强调速度、结构化理解、实时来源与国际化叙事。下一步可以自然接入真实新闻 API、摘要服务、CMS 与多语言编辑流程。"
    },
    en: {
      siteTitle: "AI Insight",
      brandSubtitle: "Global AI intelligence desk",
      nav: {
        home: "Home",
        feed: "Feed",
        search: "Search",
        radar: "Radar",
        sources: "Sources",
        briefing: "My Briefing",
        account: "Account"
      },
      common: {
        viewDetail: "Open brief",
        reset: "Reset filters",
        insight: "Editorial insight",
        related: "Related coverage",
        backToFeed: "Back to feed",
        notFoundTitle: "We couldn't find that brief",
        notFoundBody: "The link may be outdated, or the article is not ready to be shown yet.",
        searchPlaceholder: "Search models, companies, sectors, keywords, or angles",
        readingTimeSuffix: "min read",
        live: "Live",
        openSource: "Open source",
        originalSource: "Source URL",
        editorialSummary: "Editorial summary",
        aiSummary: "AI summary",
        liveFeed: "Live feed",
        source: "Source",
        summaryEngine: "Summary engine",
        configureBackend: "Without a backend, the site falls back to seeded summaries",
        chooseProvider: "Choose a summary provider",
        chooseModel: "Choose a model",
        generateSummary: "Generate AI summary",
        generating: "Generating...",
        summaryReady: "Summary updated",
        summaryFallback: "You are seeing a seeded summary. Connect a backend endpoint to generate it live.",
        summaryError: "The summary service is unavailable, so the site fell back to seeded content.",
        externalCoverage: "Source coverage",
        sourceBacked: "Source link included",
        liveUpdated: "Latest update",
        openInNewTab: "Open in new tab",
        summarySeed: "Seed summary",
        refreshNow: "Refresh now",
        refreshingNow: "Refreshing",
        sourceDesk: "Source desk",
        accessOpen: "Open access",
        accessHybrid: "Hybrid access",
        accessSubscription: "Subscription",
        kindJournal: "Journal",
        kindPreprint: "Preprint",
        kindConference: "Conference",
        visitSource: "Visit source",
        save: "Save",
        saved: "Saved",
        trackTopic: "Track topic",
        trackedTopic: "Tracking",
        removeTopic: "Remove topic",
        saveSource: "Save source",
        savedSource: "Saved source",
        myBriefing: "My Briefing",
        noSavedStories: "You have not saved any stories yet. Start by bookmarking topics you care about from the feed.",
        noSavedSources: "You have not saved any research sources yet. The sources page is a good place to build your own expert desk.",
        personalized: "Personalized",
        briefingIntro: "This page uses your saved items and reading preferences to organize live news, key stories, and professional sources into a more personal entry point.",
        briefingSaved: "Saved stories",
        briefingLive: "Live stories aligned with your interests",
        briefingSources: "Your saved research sources",
        briefingFallback: "There is not enough personal signal yet, so the page is using the broader site highlights as a fallback.",
        saveToBriefing: "Save items to start shaping your briefing"
      },
      footer: "A global AI news prototype designed for speed, structured understanding, live source links, and international storytelling. It can evolve naturally into a real news API, summary service, CMS, and multilingual editorial workflow."
    }
  };

  const defaultConfig = {
    liveFeedEndpoint: "",
    summaryEndpoint: "",
    accountEndpoint: "",
    autoRefreshMs: 300000,
    openExternalLinksInNewTab: true,
    summaryProviders: {
      local: {
        label: {
          zh: "免费本地摘要",
          en: "Free local summary"
        },
        description: {
          zh: "默认免费可用，不需要 API Key。基于正文、要点和来源信息在站内生成摘要。",
          en: "Free by default with no API key required. Generates an on-site summary from the story body, key points, and source details."
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
          en: "Best for polished commercial summaries and stronger multilingual output."
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

  let newsCachePromise;
  let newsRefreshPromise;
  let autoRefreshHandle;
  let newsItemsCache = [];
  let newsMeta = {
    status: "idle",
    refreshedAt: "",
    remoteRefreshedAt: "",
    remoteEnabled: false,
    remoteConnected: false,
    remoteCount: 0,
    embeddedCount: 0,
    editorialCount: 0,
    totalCount: 0,
    liveCount: 0,
    autoRefreshMs: 0,
    remoteError: ""
  };
  let accountBootstrapPromise;
  let accountSyncPromise;
  let accountSyncTimer;
  let accountMeta = {
    status: "idle",
    authenticated: false,
    remoteEnabled: false,
    remoteConnected: false,
    syncStatus: "idle",
    token: "",
    user: null,
    lastSyncedAt: "",
    error: ""
  };

  function getBrowserTimeZone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (error) {
      return "UTC";
    }
  }

  function clampNumber(value, min, max, fallback) {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, numeric));
  }

  function uniqueStrings(values) {
    const seen = new Set();

    return (Array.isArray(values) ? values : [])
      .map((value) => String(value || "").trim())
      .filter((value) => {
        if (!value || seen.has(value)) {
          return false;
        }

        seen.add(value);
        return true;
      });
  }

  function getStoredObject(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function hasStoredValue(key) {
    return localStorage.getItem(key) !== null;
  }

  function getLanguage() {
    return localStorage.getItem(STORAGE_KEY) || "zh";
  }

  function setLanguage(language, options) {
    const next = language === "en" ? "en" : "zh";
    const nextOptions = options || {};
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === "en" ? "en" : "zh-CN";
    document.dispatchEvent(new CustomEvent("ai-insight:language", { detail: next }));

    if (!nextOptions.skipSync) {
      queueAccountSync("language");
    }
  }

  function getViewMode() {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return viewModes.some((item) => item.key === saved) ? saved : "pulse";
  }

  function applyViewMode(mode) {
    document.body.dataset.uiMode = mode || getViewMode();
  }

  function setViewMode(mode, options) {
    const next = viewModes.some((item) => item.key === mode) ? mode : "pulse";
    const nextOptions = options || {};
    localStorage.setItem(VIEW_MODE_KEY, next);
    applyViewMode(next);
    document.dispatchEvent(new CustomEvent("ai-insight:view-mode", { detail: next }));

    if (!nextOptions.skipSync) {
      queueAccountSync("view-mode");
    }
  }

  function normalizeBriefingSettings(value) {
    const source = value && typeof value === "object" ? value : {};

    return {
      enabled: Boolean(source.enabled),
      hour: clampNumber(source.hour, 0, 23, 8),
      minute: clampNumber(source.minute, 0, 59, 0),
      timezone:
        typeof source.timezone === "string" && source.timezone.trim()
          ? source.timezone.trim()
          : getBrowserTimeZone()
    };
  }

  function getBriefingSettings() {
    return normalizeBriefingSettings(getStoredObject(BRIEFING_SETTINGS_KEY));
  }

  function emitBriefingSettingsEvent(values) {
    document.dispatchEvent(new CustomEvent("ai-insight:briefing-settings", { detail: values }));
  }

  function setBriefingSettings(value, options) {
    const next = normalizeBriefingSettings(value);
    const nextOptions = options || {};
    localStorage.setItem(BRIEFING_SETTINGS_KEY, JSON.stringify(next));
    emitBriefingSettingsEvent(next);

    if (!nextOptions.skipSync) {
      queueAccountSync("briefing");
    }

    return next;
  }

  function updateBriefingSettings(patch, options) {
    return setBriefingSettings(
      {
        ...getBriefingSettings(),
        ...(patch || {})
      },
      options
    );
  }

  function getStoredList(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function setStoredList(key, values) {
    localStorage.setItem(key, JSON.stringify(values));
  }

  function emitSavedEvent(type, values) {
    document.dispatchEvent(new CustomEvent(type, { detail: values }));
  }

  function normalizeTopicText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function slugifyTopic(value) {
    return normalizeTopicText(value)
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function buildTrackedTopicId(topic) {
    return [slugifyTopic(topic.query || topic.label || ""), topic.category || "all", topic.region || "all"].join("__");
  }

  function emitTrackedTopicsEvent(values) {
    document.dispatchEvent(new CustomEvent("ai-insight:tracked-topics", { detail: values }));
  }

  function mergeObjects(base, override) {
    const result = { ...base };

    Object.keys(override || {}).forEach((key) => {
      const baseValue = result[key];
      const overrideValue = override[key];

      if (
        baseValue &&
        overrideValue &&
        typeof baseValue === "object" &&
        typeof overrideValue === "object" &&
        !Array.isArray(baseValue) &&
        !Array.isArray(overrideValue)
      ) {
        result[key] = mergeObjects(baseValue, overrideValue);
      } else {
        result[key] = overrideValue;
      }
    });

    return result;
  }

  function getConfig() {
    return mergeObjects(defaultConfig, window.AIInsightConfig || {});
  }

  function t(path, language) {
    const parts = path.split(".");
    let cursor = copy[language || getLanguage()];

    for (const part of parts) {
      cursor = cursor && cursor[part];
    }

    return cursor;
  }

  function localize(entry, language) {
    if (!entry) {
      return "";
    }

    if (typeof entry !== "object" || Array.isArray(entry)) {
      return entry;
    }

    if (Object.prototype.hasOwnProperty.call(entry, "zh") || Object.prototype.hasOwnProperty.call(entry, "en")) {
      return entry[language || getLanguage()] || entry.zh || entry.en || "";
    }

    return entry;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(dateString, language) {
    const locale = (language || getLanguage()) === "en" ? "en-US" : "zh-CN";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(new Date(dateString));
  }

  function formatDateTime(dateString, language) {
    if (!dateString) {
      return "";
    }

    const locale = (language || getLanguage()) === "en" ? "en-US" : "zh-CN";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(dateString));
  }

  function formatRefreshInterval(intervalMs, language) {
    const nextLanguage = language || getLanguage();
    const totalMinutes = Math.round((Number(intervalMs) || 0) / 60000);

    if (!totalMinutes) {
      return nextLanguage === "en" ? "Manual only" : "仅手动刷新";
    }

    if (totalMinutes < 60) {
      return nextLanguage === "en" ? `Every ${totalMinutes} min` : `每 ${totalMinutes} 分钟`;
    }

    const totalHours = Number((totalMinutes / 60).toFixed(totalMinutes % 60 ? 1 : 0));
    return nextLanguage === "en" ? `Every ${totalHours} hr` : `每 ${totalHours} 小时`;
  }

  function getCategoryLabel(key, language) {
    const category = categories.find((item) => item.key === key);
    return category ? category.label[language || getLanguage()] : key;
  }

  function getRegionLabel(key, language) {
    const region = regions.find((item) => item.key === key);
    return region ? region.label[language || getLanguage()] : key;
  }

  function getFormatLabel(key, language) {
    const format = formats.find((item) => item.key === key);
    return format ? format.label[language || getLanguage()] : key;
  }

  function getSignalLabel(key, language) {
    return signals[key] ? signals[key][language || getLanguage()] : key;
  }

  function getBadgeClass(signalKey) {
    return `badge badge-${signalKey}`;
  }

  function getProviderCatalog() {
    return getConfig().summaryProviders || {};
  }

  function normalizeProviderId(providerId) {
    const ids = getProviderIds();
    return ids.includes(providerId) ? providerId : ids[0];
  }

  function getProviderIds() {
    return Object.keys(getProviderCatalog());
  }

  function getProviderMeta(providerId) {
    const catalog = getProviderCatalog();
    return catalog[providerId] || catalog.local || catalog.openai || Object.values(catalog)[0];
  }

  function getSelectedProvider() {
    const provider = localStorage.getItem(SUMMARY_PROVIDER_KEY);
    return normalizeProviderId(provider);
  }

  function getDefaultModelForProvider(providerId) {
    const meta = getProviderMeta(providerId);
    return meta.defaultModel || meta.models[0];
  }

  function getSelectedModel(providerId) {
    const provider = providerId || getSelectedProvider();
    const meta = getProviderMeta(provider);
    const saved = localStorage.getItem(SUMMARY_MODEL_KEY);
    return meta.models.includes(saved) ? saved : getDefaultModelForProvider(provider);
  }

  function setSummaryPreference(providerId, modelId, options) {
    const nextOptions = options || {};
    const provider = normalizeProviderId(providerId || getSelectedProvider());
    const model = getProviderMeta(provider).models.includes(modelId) ? modelId : getDefaultModelForProvider(provider);

    localStorage.setItem(SUMMARY_PROVIDER_KEY, provider);
    localStorage.setItem(SUMMARY_MODEL_KEY, model);

    document.dispatchEvent(new CustomEvent("ai-insight:summary-preference", { detail: getSummaryPreference() }));

    if (!nextOptions.skipSync) {
      queueAccountSync("summary");
    }
  }

  function getSummaryPreference() {
    const provider = getSelectedProvider();
    return {
      provider,
      model: getSelectedModel(provider)
    };
  }

  function normalizeAccountSnapshot(value) {
    const source = value && typeof value === "object" ? value : {};
    const summaryPreference = createNormalizedSummaryPreference(source.summaryPreference);

    return {
      language: source.language === "en" ? "en" : "zh",
      viewMode: viewModes.some((item) => item.key === source.viewMode) ? source.viewMode : "pulse",
      summaryPreference,
      savedStories: uniqueStrings(source.savedStories),
      savedSources: uniqueStrings(source.savedSources),
      trackedTopics: (Array.isArray(source.trackedTopics) ? source.trackedTopics : [])
        .map(normalizeTrackedTopic)
        .filter(Boolean),
      briefingSettings: normalizeBriefingSettings(source.briefingSettings)
    };
  }

  function createNormalizedSummaryPreference(value) {
    const provider = normalizeProviderId(value && value.provider);
    const model = getProviderMeta(provider).models.includes(value && value.model)
      ? value.model
      : getDefaultModelForProvider(provider);

    return {
      provider,
      model
    };
  }

  function getLocalAccountSnapshot() {
    return {
      language: getLanguage(),
      viewMode: getViewMode(),
      summaryPreference: createNormalizedSummaryPreference(getSummaryPreference()),
      savedStories: getStoredList(SAVED_STORIES_KEY),
      savedSources: getStoredList(SAVED_SOURCES_KEY),
      trackedTopics: getTrackedTopics(),
      briefingSettings: getBriefingSettings()
    };
  }

  function mergeTrackedTopicSets(primary, secondary) {
    const seen = new Set();

    return [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])]
      .map(normalizeTrackedTopic)
      .filter((topic) => {
        if (!topic || seen.has(topic.id)) {
          return false;
        }

        seen.add(topic.id);
        return true;
      });
  }

  function mergeAccountSnapshot(remoteState) {
    const remote = normalizeAccountSnapshot(remoteState);
    const local = getLocalAccountSnapshot();
    const localSummary = createNormalizedSummaryPreference(local.summaryPreference);
    const remoteSummary = createNormalizedSummaryPreference(remote.summaryPreference);

    return {
      language: hasStoredValue(STORAGE_KEY) ? local.language : remote.language,
      viewMode: hasStoredValue(VIEW_MODE_KEY) ? local.viewMode : remote.viewMode,
      summaryPreference: {
        provider: hasStoredValue(SUMMARY_PROVIDER_KEY) ? localSummary.provider : remoteSummary.provider,
        model: hasStoredValue(SUMMARY_MODEL_KEY)
          ? localSummary.model
          : getProviderMeta(remoteSummary.provider).models.includes(remoteSummary.model)
            ? remoteSummary.model
            : getDefaultModelForProvider(remoteSummary.provider)
      },
      savedStories: uniqueStrings([...(local.savedStories || []), ...(remote.savedStories || [])]),
      savedSources: uniqueStrings([...(local.savedSources || []), ...(remote.savedSources || [])]),
      trackedTopics: mergeTrackedTopicSets(local.trackedTopics, remote.trackedTopics),
      briefingSettings: hasStoredValue(BRIEFING_SETTINGS_KEY)
        ? normalizeBriefingSettings({
            ...remote.briefingSettings,
            ...local.briefingSettings
          })
        : remote.briefingSettings
    };
  }

  function isSameAccountSnapshot(a, b) {
    return JSON.stringify(normalizeAccountSnapshot(a)) === JSON.stringify(normalizeAccountSnapshot(b));
  }

  function applyAccountSnapshot(state, options) {
    const next = normalizeAccountSnapshot(state);
    const nextOptions = options || {};

    setLanguage(next.language, { skipSync: true });
    setViewMode(next.viewMode, { skipSync: true });
    setSummaryPreference(next.summaryPreference.provider, next.summaryPreference.model, { skipSync: true });
    setStoredList(SAVED_STORIES_KEY, next.savedStories);
    setStoredList(SAVED_SOURCES_KEY, next.savedSources);
    saveTrackedTopics(next.trackedTopics, { skipSync: true });
    setBriefingSettings(next.briefingSettings, { skipSync: true });
    emitSavedEvent("ai-insight:saved-stories", next.savedStories);
    emitSavedEvent("ai-insight:saved-sources", next.savedSources);
    emitTrackedTopicsEvent(next.trackedTopics);

    if (!nextOptions.silent) {
      document.dispatchEvent(new CustomEvent("ai-insight:state-hydrated", { detail: next }));
    }

    return next;
  }

  function getAccountState() {
    return {
      ...accountMeta,
      user: accountMeta.user ? { ...accountMeta.user } : null
    };
  }

  function emitAccountState() {
    accountMeta.remoteEnabled = Boolean(getConfig().accountEndpoint);
    document.dispatchEvent(new CustomEvent("ai-insight:account-state", { detail: getAccountState() }));
  }

  function getStoredAuthToken() {
    return localStorage.getItem(ACCOUNT_TOKEN_KEY) || "";
  }

  function setStoredAuthToken(token) {
    const next = String(token || "").trim();

    if (next) {
      localStorage.setItem(ACCOUNT_TOKEN_KEY, next);
    } else {
      localStorage.removeItem(ACCOUNT_TOKEN_KEY);
    }
  }

  function getSavedStoryIds() {
    return getStoredList(SAVED_STORIES_KEY);
  }

  function isStorySaved(storyId) {
    return getSavedStoryIds().includes(String(storyId));
  }

  function toggleSavedStory(storyId, options) {
    const id = String(storyId);
    const nextOptions = options || {};
    const current = getSavedStoryIds();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    setStoredList(SAVED_STORIES_KEY, next);
    emitSavedEvent("ai-insight:saved-stories", next);

    if (!nextOptions.skipSync) {
      queueAccountSync("saved-stories");
    }

    return next.includes(id);
  }

  function getSavedSourceIds() {
    return getStoredList(SAVED_SOURCES_KEY);
  }

  function isSourceSaved(sourceId) {
    return getSavedSourceIds().includes(String(sourceId));
  }

  function toggleSavedSource(sourceId, options) {
    const id = String(sourceId);
    const nextOptions = options || {};
    const current = getSavedSourceIds();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    setStoredList(SAVED_SOURCES_KEY, next);
    emitSavedEvent("ai-insight:saved-sources", next);

    if (!nextOptions.skipSync) {
      queueAccountSync("saved-sources");
    }

    return next.includes(id);
  }

  function normalizeTrackedTopic(topic) {
    const query = normalizeTopicText(topic && (topic.query || topic.label));

    if (!query) {
      return null;
    }

    const category = categories.some((item) => item.key === topic.category) ? topic.category : "all";
    const region = regions.some((item) => item.key === topic.region) ? topic.region : "all";
    const normalized = {
      id: topic.id || buildTrackedTopicId({ query, category, region }),
      query,
      label: normalizeTopicText(topic.label) || query,
      category,
      region,
      createdAt: topic.createdAt || new Date().toISOString()
    };

    normalized.id = buildTrackedTopicId(normalized);
    return normalized;
  }

  function getTrackedTopics() {
    return getStoredList(TRACKED_TOPICS_KEY)
      .map(normalizeTrackedTopic)
      .filter(Boolean);
  }

  function isTopicTracked(query, category, region) {
    const normalized = normalizeTrackedTopic({
      query,
      category,
      region
    });

    if (!normalized) {
      return false;
    }

    return getTrackedTopics().some((topic) => topic.id === normalized.id);
  }

  function saveTrackedTopics(topics, options) {
    const nextOptions = options || {};
    const seen = new Set();
    const next = topics
      .map(normalizeTrackedTopic)
      .filter((topic) => {
        if (!topic || seen.has(topic.id)) {
          return false;
        }

        seen.add(topic.id);
        return true;
      });

    setStoredList(TRACKED_TOPICS_KEY, next);

    if (!nextOptions.skipSync) {
      queueAccountSync("tracked-topics");
    }

    return next;
  }

  function toggleTrackedTopic(topicInput) {
    const normalized = normalizeTrackedTopic(topicInput);

    if (!normalized) {
      return false;
    }

    const current = getTrackedTopics();
    const exists = current.some((topic) => topic.id === normalized.id);
    const next = exists ? current.filter((topic) => topic.id !== normalized.id) : [normalized, ...current];
    const stored = saveTrackedTopics(next);
    emitTrackedTopicsEvent(stored);
    return !exists;
  }

  function removeTrackedTopic(topicId) {
    const current = getTrackedTopics();
    const next = current.filter((topic) => topic.id !== String(topicId));
    const stored = saveTrackedTopics(next);
    emitTrackedTopicsEvent(stored);
  }

  async function requestAccount(action, options) {
    const config = getConfig();

    if (!config.accountEndpoint) {
      throw new Error("Account endpoint is not configured");
    }

    const nextOptions = options || {};
    const url = new URL(config.accountEndpoint, window.location.origin);
    url.searchParams.set("action", action);

    const headers = {
      Accept: "application/json"
    };

    if (nextOptions.body) {
      headers["Content-Type"] = "application/json";
    }

    if (nextOptions.token) {
      headers.Authorization = `Bearer ${nextOptions.token}`;
    }

    const response = await fetch(url.toString(), {
      method: nextOptions.method || "GET",
      headers,
      body: nextOptions.body ? JSON.stringify(nextOptions.body) : undefined
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(payload.error || `Account endpoint returned ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  function clearAccountSyncTimer() {
    if (!accountSyncTimer) {
      return;
    }

    window.clearTimeout(accountSyncTimer);
    accountSyncTimer = null;
  }

  function queueAccountSync(reason) {
    if (!accountMeta.authenticated || !getConfig().accountEndpoint) {
      return;
    }

    clearAccountSyncTimer();
    accountMeta.syncStatus = "queued";
    accountMeta.error = "";
    emitAccountState();

    accountSyncTimer = window.setTimeout(() => {
      syncAccountState({ reason }).catch(() => {});
    }, 700);
  }

  async function syncAccountState(options) {
    const token = getStoredAuthToken();

    if (!token || !accountMeta.authenticated || !getConfig().accountEndpoint) {
      return {
        skipped: true
      };
    }

    if (accountSyncPromise) {
      return accountSyncPromise;
    }

    clearAccountSyncTimer();
    accountMeta.syncStatus = "syncing";
    accountMeta.error = "";
    accountMeta.remoteConnected = true;
    emitAccountState();

    accountSyncPromise = requestAccount("state", {
      method: "PUT",
      token,
      body: {
        state: normalizeAccountSnapshot(getLocalAccountSnapshot())
      }
    })
      .then((payload) => {
        const syncedState = payload.state ? normalizeAccountSnapshot(payload.state) : normalizeAccountSnapshot(getLocalAccountSnapshot());
        applyAccountSnapshot(syncedState, { silent: true });
        accountMeta.syncStatus = "ready";
        accountMeta.remoteConnected = true;
        accountMeta.lastSyncedAt = payload.syncedAt || payload.lastSyncedAt || new Date().toISOString();
        accountMeta.user = payload.user || accountMeta.user;
        accountMeta.status = "authenticated";
        accountMeta.error = "";
        emitAccountState();
        return payload;
      })
      .catch((error) => {
        if (error.status === 401) {
          setStoredAuthToken("");
          accountMeta = {
            ...accountMeta,
            status: "guest",
            authenticated: false,
            remoteConnected: false,
            syncStatus: "error",
            token: "",
            user: null,
            error: error.message
          };
        } else {
          accountMeta.syncStatus = "error";
          accountMeta.remoteConnected = false;
          accountMeta.error = error.message;
        }

        emitAccountState();
        throw error;
      })
      .finally(() => {
        accountSyncPromise = null;
      });

    return accountSyncPromise;
  }

  function finalizeAuthenticatedSession(payload, options) {
    const nextOptions = options || {};
    const remoteState = normalizeAccountSnapshot(payload.state);
    const mergedState = nextOptions.mergeLocal ? mergeAccountSnapshot(remoteState) : remoteState;
    const token = payload.token || getStoredAuthToken();

    setStoredAuthToken(token);
    applyAccountSnapshot(mergedState, { silent: true });

    accountMeta = {
      ...accountMeta,
      status: "authenticated",
      authenticated: true,
      remoteEnabled: Boolean(getConfig().accountEndpoint),
      remoteConnected: true,
      syncStatus: "ready",
      token,
      user: payload.user || null,
      lastSyncedAt: payload.syncedAt || payload.lastSyncedAt || accountMeta.lastSyncedAt || "",
      error: ""
    };
    emitAccountState();

    if (nextOptions.mergeLocal && !isSameAccountSnapshot(mergedState, remoteState)) {
      syncAccountState({ reason: "merge" }).catch(() => {});
    }

    return getAccountState();
  }

  async function bootstrapAccountSession(options) {
    const nextOptions = options || {};

    if (accountBootstrapPromise && !nextOptions.forceRefresh) {
      return accountBootstrapPromise;
    }

    const token = getStoredAuthToken();
    accountMeta.remoteEnabled = Boolean(getConfig().accountEndpoint);
    accountMeta.token = token;
    accountMeta.error = "";

    if (!getConfig().accountEndpoint) {
      accountMeta.status = "guest";
      accountMeta.authenticated = false;
      accountMeta.remoteConnected = false;
      accountMeta.syncStatus = "idle";
      accountMeta.user = null;
      emitAccountState();
      return Promise.resolve(getAccountState());
    }

    if (!token) {
      accountMeta.status = "guest";
      accountMeta.authenticated = false;
      accountMeta.remoteConnected = false;
      accountMeta.syncStatus = "idle";
      accountMeta.user = null;
      emitAccountState();
      return Promise.resolve(getAccountState());
    }

    accountMeta.status = "loading";
    accountMeta.authenticated = false;
    accountMeta.remoteConnected = false;
    emitAccountState();

    accountBootstrapPromise = requestAccount("session", {
      method: "GET",
      token
    })
      .then((payload) => {
        if (!payload || payload.authenticated === false) {
          setStoredAuthToken("");
          accountMeta.status = "guest";
          accountMeta.authenticated = false;
          accountMeta.remoteConnected = false;
          accountMeta.syncStatus = "idle";
          accountMeta.token = "";
          accountMeta.user = null;
          emitAccountState();
          return getAccountState();
        }

        return finalizeAuthenticatedSession(payload, { mergeLocal: true });
      })
      .catch((error) => {
        const unauthorized = error && error.status === 401;

        if (unauthorized) {
          setStoredAuthToken("");
        }

        accountMeta.status = unauthorized ? "guest" : "error";
        accountMeta.authenticated = false;
        accountMeta.remoteConnected = false;
        accountMeta.syncStatus = "error";
        accountMeta.token = unauthorized ? "" : token;
        accountMeta.user = null;
        accountMeta.error = error.message;
        emitAccountState();
        return getAccountState();
      })
      .finally(() => {
        accountBootstrapPromise = null;
      });

    return accountBootstrapPromise;
  }

  async function registerAccount(input) {
    const payload = await requestAccount("register", {
      method: "POST",
      body: {
        displayName: input && (input.displayName || input.name),
        email: input && input.email,
        password: input && input.password,
        state: normalizeAccountSnapshot(getLocalAccountSnapshot())
      }
    });

    return finalizeAuthenticatedSession(payload, { mergeLocal: false });
  }

  async function loginAccount(input) {
    const payload = await requestAccount("login", {
      method: "POST",
      body: {
        email: input && input.email,
        password: input && input.password
      }
    });

    return finalizeAuthenticatedSession(payload, { mergeLocal: true });
  }

  async function logoutAccount() {
    const token = getStoredAuthToken();

    clearAccountSyncTimer();

    if (token && getConfig().accountEndpoint) {
      requestAccount("logout", {
        method: "POST",
        token
      }).catch(() => {});
    }

    setStoredAuthToken("");
    accountMeta = {
      ...accountMeta,
      status: "guest",
      authenticated: false,
      remoteConnected: false,
      syncStatus: "idle",
      token: "",
      user: null,
      error: ""
    };
    emitAccountState();

    return getAccountState();
  }

  function getExternalLinkAttributes() {
    const config = getConfig();
    return config.openExternalLinksInNewTab ? ' target="_blank" rel="noreferrer noopener"' : "";
  }

  function getEditorialNews(forceRefresh) {
    if (Array.isArray(window.AIInsightData) && window.AIInsightData.length) {
      return Promise.resolve(window.AIInsightData);
    }

    return fetch("news.json", {
      cache: forceRefresh ? "no-store" : "default"
    })
      .then((response) => response.json())
      .catch(() => []);
  }

  function getEmbeddedLiveNews() {
    const live = Array.isArray(window.AIInsightLiveData) ? window.AIInsightLiveData : [];
    const micro = Array.isArray(window.AIInsightMicroData) ? window.AIInsightMicroData : [];
    return [...live, ...micro];
  }

  function buildRemoteUrl(url, forceRefresh) {
    if (!forceRefresh || !url) {
      return url;
    }

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}ts=${Date.now()}`;
  }

  function getRemoteLiveNews(forceRefresh) {
    const config = getConfig();
    if (!config.liveFeedEndpoint) {
      return Promise.resolve({
        items: [],
        refreshedAt: "",
        connected: false,
        error: ""
      });
    }

    return fetch(buildRemoteUrl(config.liveFeedEndpoint, forceRefresh), {
      cache: forceRefresh ? "no-store" : "default",
      headers: {
        Accept: "application/json"
      }
    })
      .then((response) => response.json())
      .then((payload) => {
        const nextPayload = Array.isArray(payload) ? { items: payload } : payload || {};
        const items = Array.isArray(nextPayload.items) ? nextPayload.items : [];

        return {
          items,
          refreshedAt: nextPayload.refreshedAt || nextPayload.updatedAt || nextPayload.lastUpdated || "",
          connected: items.length > 0 || Boolean(nextPayload.refreshedAt || nextPayload.updatedAt || nextPayload.lastUpdated),
          error: ""
        };
      })
      .catch((error) => ({
        items: [],
        refreshedAt: "",
        connected: false,
        error: error.message || "Remote feed request failed"
      }));
  }

  function getBaseNewsMeta() {
    const config = getConfig();
    return {
      status: newsMeta.status || "idle",
      refreshedAt: newsMeta.refreshedAt || "",
      remoteRefreshedAt: newsMeta.remoteRefreshedAt || "",
      remoteEnabled: Boolean(config.liveFeedEndpoint),
      remoteConnected: Boolean(newsMeta.remoteConnected),
      remoteCount: Number(newsMeta.remoteCount) || 0,
      embeddedCount: Number(newsMeta.embeddedCount) || getEmbeddedLiveNews().length,
      editorialCount: Number(newsMeta.editorialCount) || 0,
      totalCount: Number(newsMeta.totalCount) || 0,
      liveCount: Number(newsMeta.liveCount) || 0,
      autoRefreshMs: Number(config.autoRefreshMs) || 0,
      remoteError: newsMeta.remoteError || ""
    };
  }

  function emitNewsState() {
    document.dispatchEvent(
      new CustomEvent("ai-insight:news-state", {
        detail: {
          items: [...newsItemsCache],
          meta: getBaseNewsMeta()
        }
      })
    );
  }

  function loadNews(options) {
    const nextOptions = options || {};
    const embedded = getEmbeddedLiveNews();

    newsMeta = {
      ...getBaseNewsMeta(),
      status: newsItemsCache.length ? "refreshing" : "loading",
      embeddedCount: embedded.length,
      remoteError: ""
    };
    emitNewsState();

    return Promise.all([getEditorialNews(nextOptions.forceRefresh), getRemoteLiveNews(nextOptions.forceRefresh)])
      .then(([editorial, remote]) => {
        const merged = [...editorial, ...remote.items, ...embedded].map(normalizeItem);
        newsItemsCache = sortNews(dedupeNews(merged));
        newsMeta = {
          status: "ready",
          refreshedAt: new Date().toISOString(),
          remoteRefreshedAt: remote.refreshedAt || "",
          remoteEnabled: Boolean(getConfig().liveFeedEndpoint),
          remoteConnected: Boolean(remote.connected),
          remoteCount: remote.items.length,
          embeddedCount: embedded.length,
          editorialCount: editorial.length,
          totalCount: newsItemsCache.length,
          liveCount: getLiveStories(newsItemsCache).length,
          autoRefreshMs: Number(getConfig().autoRefreshMs) || 0,
          remoteError: remote.error || ""
        };
        emitNewsState();
        return newsItemsCache;
      })
      .catch((error) => {
        const fallback = newsItemsCache.length ? newsItemsCache : sortNews(dedupeNews(embedded.map(normalizeItem)));
        newsItemsCache = fallback;
        newsMeta = {
          ...getBaseNewsMeta(),
          status: "error",
          refreshedAt: newsMeta.refreshedAt || new Date().toISOString(),
          embeddedCount: embedded.length,
          totalCount: fallback.length,
          liveCount: getLiveStories(fallback).length,
          remoteError: error.message || "News loading failed"
        };
        emitNewsState();
        return newsItemsCache;
      });
  }

  function refreshNews(options) {
    if (newsRefreshPromise) {
      return newsRefreshPromise;
    }

    newsRefreshPromise = loadNews({
      forceRefresh: true
    }).finally(() => {
      newsRefreshPromise = null;
    });

    newsCachePromise = newsRefreshPromise;
    return newsRefreshPromise;
  }

  function getNews(options) {
    const nextOptions = options || {};

    if (nextOptions.forceRefresh) {
      return refreshNews(nextOptions);
    }

    if (newsItemsCache.length) {
      return Promise.resolve(newsItemsCache);
    }

    if (!newsCachePromise) {
      newsCachePromise = loadNews({
        forceRefresh: false
      });
    }

    return newsCachePromise;
  }

  function getNewsMeta() {
    return { ...getBaseNewsMeta() };
  }

  function startAutoRefresh() {
    const intervalMs = Number(getConfig().autoRefreshMs) || 0;

    if (autoRefreshHandle || !intervalMs) {
      return;
    }

    autoRefreshHandle = window.setInterval(() => {
      refreshNews({ forceRefresh: true }).catch(() => {});
    }, intervalMs);
  }

  function stopAutoRefresh() {
    if (!autoRefreshHandle) {
      return;
    }

    window.clearInterval(autoRefreshHandle);
    autoRefreshHandle = null;
  }

  function createRefreshStatusCard(meta, language, options) {
    const nextLanguage = language || getLanguage();
    const nextMeta = meta || getNewsMeta();
    const nextOptions = options || {};
    const detailLine = nextLanguage === "en"
      ? nextMeta.remoteError
        ? "Remote feed returned an error, so the page is currently falling back to local coverage."
        : nextMeta.remoteRefreshedAt
          ? `Remote source timestamp: ${formatDateTime(nextMeta.remoteRefreshedAt, nextLanguage)}`
          : nextMeta.remoteEnabled
            ? "Remote endpoint is configured, but it has not returned its own refresh timestamp yet."
            : "Connect a live backend endpoint to move from seed mode into real-time mode."
      : nextMeta.remoteError
        ? "远端 live 源返回了错误，所以页面当前会先回退到站内内容。"
        : nextMeta.remoteRefreshedAt
          ? `远端源时间戳：${formatDateTime(nextMeta.remoteRefreshedAt, nextLanguage)}`
          : nextMeta.remoteEnabled
            ? "远端接口已经配置，但它还没有返回自己的刷新时间戳。"
            : "接入 live backend 之后，这里就会从种子模式切到真正的实时模式。";
    const text = nextLanguage === "en"
      ? {
          eyebrow: "Live Status",
          title: nextMeta.remoteConnected ? "Remote live feed is connected" : nextMeta.remoteEnabled ? "Remote feed is configured but currently falling back" : "Remote feed not configured yet",
          lead: nextOptions.lead ||
            (nextMeta.remoteConnected
              ? "The site is blending editorial briefs, embedded official updates, and remote live stories."
              : "The site is currently using editorial briefs and embedded official updates. Connect a remote endpoint to make it truly live."),
          lastRefresh: "Last refresh",
          autoRefresh: "Auto refresh",
          totalStories: "Stories now",
          remoteStories: "Remote adds",
          button: nextMeta.status === "loading" || nextMeta.status === "refreshing" ? t("common.refreshingNow", nextLanguage) : t("common.refreshNow", nextLanguage),
          remoteBadge: nextMeta.remoteConnected ? "Remote on" : nextMeta.remoteEnabled ? "Fallback mode" : "Seed mode"
        }
      : {
          eyebrow: "实时状态",
          title: nextMeta.remoteConnected ? "远端 live 源已接入" : nextMeta.remoteEnabled ? "远端已配置，但当前回退到站内内容" : "还没有接入远端 live 源",
          lead: nextOptions.lead ||
            (nextMeta.remoteConnected
              ? "当前内容会混合编辑简报、内置官方快讯和远端 live 条目。"
              : "当前内容仍以编辑简报和内置官方快讯为主，接上远端接口后才会真正实时。"),
          lastRefresh: "上次刷新",
          autoRefresh: "自动刷新",
          totalStories: "当前条目",
          remoteStories: "远端新增",
          button: nextMeta.status === "loading" || nextMeta.status === "refreshing" ? t("common.refreshingNow", nextLanguage) : t("common.refreshNow", nextLanguage),
          remoteBadge: nextMeta.remoteConnected ? "远端已开启" : nextMeta.remoteEnabled ? "回退模式" : "种子模式"
        };
    const refreshDisabled = nextMeta.status === "loading" || nextMeta.status === "refreshing" ? " disabled" : "";
    const refreshClass = nextMeta.status === "loading" || nextMeta.status === "refreshing" ? " is-loading" : "";

    return `
      <section class="panel live-status page-fade">
        <div class="live-status-head">
          <div>
            <span class="meta-label">${escapeHtml(text.eyebrow)}</span>
            <h3>${escapeHtml(text.title)}</h3>
            <p class="panel-text">${escapeHtml(text.lead)}</p>
          </div>
          <div class="live-status-actions">
            <span class="ghost-badge">${escapeHtml(text.remoteBadge)}</span>
            <button class="button button-secondary refresh-btn${refreshClass}" type="button" data-refresh-news="true"${refreshDisabled}>${escapeHtml(text.button)}</button>
          </div>
        </div>

        <div class="live-status-grid">
          <article class="live-status-cell">
            <span>${escapeHtml(text.lastRefresh)}</span>
            <strong>${escapeHtml(formatDateTime(nextMeta.refreshedAt, nextLanguage) || (nextLanguage === "en" ? "Not refreshed yet" : "还没有刷新记录"))}</strong>
          </article>
          <article class="live-status-cell">
            <span>${escapeHtml(text.autoRefresh)}</span>
            <strong>${escapeHtml(formatRefreshInterval(nextMeta.autoRefreshMs, nextLanguage))}</strong>
          </article>
          <article class="live-status-cell">
            <span>${escapeHtml(text.totalStories)}</span>
            <strong>${escapeHtml(String(nextMeta.totalCount || 0))}</strong>
          </article>
          <article class="live-status-cell">
            <span>${escapeHtml(text.remoteStories)}</span>
            <strong>${escapeHtml(String(nextMeta.remoteCount || 0))}</strong>
          </article>
        </div>

        <p class="panel-text live-status-note">${escapeHtml(detailLine)}</p>
      </section>
    `;
  }

  function normalizeItem(item, index) {
    return {
      id: item.id || `story-${index}`,
      slug: item.slug || `story-${index}`,
      featured: Boolean(item.featured),
      live: Boolean(item.live),
      micro: Boolean(item.micro),
      category: item.category || "products",
      region: item.region || "global",
      signal: item.signal || "watch",
      date: item.date || new Date().toISOString().slice(0, 10),
      source: item.source || item.sourceName || "",
      sourceName: item.sourceName || item.source || "",
      sourceType: item.sourceType || "editorial",
      sourceUrl: item.sourceUrl || "",
      readingTime: item.readingTime || 4,
      tags: Array.isArray(item.tags) ? item.tags : [],
      title: item.title || { zh: "", en: "" },
      deck: item.deck || { zh: "", en: "" },
      summaryPoints: item.summaryPoints || { zh: [], en: [] },
      editorialSummary: item.editorialSummary || null,
      aiSummary: item.aiSummary || null,
      briefType: item.briefType || null,
      metricLabel: item.metricLabel || null,
      metricValue: item.metricValue || "",
      proNotes: item.proNotes || { zh: [], en: [] },
      insight: item.insight || { zh: "", en: "" },
      who: item.who || { zh: "", en: "" },
      watchpoint: item.watchpoint || { zh: "", en: "" },
      content: item.content || { zh: [], en: [] }
    };
  }

  function dedupeNews(news) {
    const seen = new Set();
    return news.filter((item) => {
      const key = item.sourceUrl || item.slug || `${localize(item.title, "en")}-${item.date}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  function sortNews(news) {
    return [...news].sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      if (a.live !== b.live) {
        return a.live ? -1 : 1;
      }

      if (a.micro !== b.micro) {
        return a.micro ? 1 : -1;
      }

      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }

      return 0;
    });
  }

  function isLiveItem(item) {
    return Boolean(item.live || item.sourceUrl);
  }

  function isMicroStory(item) {
    return Boolean(item && item.micro);
  }

  function getLiveStories(news) {
    return news.filter((item) => isLiveItem(item));
  }

  function getMicroStories(news) {
    return news.filter((item) => isMicroStory(item));
  }

  function getHeadlineStories(news) {
    return news.filter((item) => !isMicroStory(item));
  }

  function getEditorialStories(news) {
    return news.filter((item) => !isLiveItem(item));
  }

  function getPrimarySummary(item, language) {
    return (
      localize(item.aiSummary, language) ||
      localize(item.editorialSummary, language) ||
      localize(item.insight, language)
    );
  }

  function matchesFormat(item, formatKey) {
    const format = formats.some((entry) => entry.key === formatKey) ? formatKey : "all";

    if (format === "all") {
      return true;
    }

    if (format === "live") {
      return isLiveItem(item) && !isMicroStory(item);
    }

    if (format === "briefs") {
      return !isLiveItem(item) && !isMicroStory(item);
    }

    if (format === "tools") {
      return isMicroStory(item) || item.category === "tooling" || item.sourceType === "github";
    }

    if (format === "research") {
      return item.category === "research";
    }

    return true;
  }

  function filterNews(news, filters) {
    const query = (filters.query || "").trim().toLowerCase();
    const category = filters.category || "all";
    const region = filters.region || "all";
    const format = filters.format || "all";

    return news.filter((item) => {
      const categoryMatch = category === "all" || item.category === category;
      const regionMatch = region === "all" || item.region === region;
      const formatMatch = matchesFormat(item, format);

      if (!categoryMatch || !regionMatch || !formatMatch) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        item.title.zh,
        item.title.en,
        item.deck.zh,
        item.deck.en,
        item.insight && item.insight.zh,
        item.insight && item.insight.en,
        item.watchpoint && item.watchpoint.zh,
        item.watchpoint && item.watchpoint.en,
        item.who && item.who.zh,
        item.who && item.who.en,
        item.editorialSummary && item.editorialSummary.zh,
        item.editorialSummary && item.editorialSummary.en,
        item.aiSummary && item.aiSummary.zh,
        item.aiSummary && item.aiSummary.en,
        item.briefType && item.briefType.zh,
        item.briefType && item.briefType.en,
        item.metricLabel && item.metricLabel.zh,
        item.metricLabel && item.metricLabel.en,
        item.metricValue,
        item.proNotes && item.proNotes.zh && item.proNotes.zh.join(" "),
        item.proNotes && item.proNotes.en && item.proNotes.en.join(" "),
        item.sourceName,
        item.sourceType,
        item.sourceUrl,
        item.tags.join(" "),
        getCategoryLabel(item.category, "zh"),
        getCategoryLabel(item.category, "en"),
        getRegionLabel(item.region, "zh"),
        getRegionLabel(item.region, "en")
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }

  function getTopTags(news, limit) {
    const counts = {};

    news.forEach((item) => {
      item.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit || 8)
      .map(([tag]) => tag);
  }

  function getStoriesByCategory(news, categoryKey) {
    return news.filter((item) => item.category === categoryKey);
  }

  function getJournalSources() {
    return Array.isArray(window.AIInsightJournals) ? window.AIInsightJournals : [];
  }

  function getSavedStories(news) {
    const ids = new Set(getSavedStoryIds());
    return news.filter((item) => ids.has(String(item.id)));
  }

  function getSavedSources() {
    const ids = new Set(getSavedSourceIds());
    return getJournalSources().filter((item) => ids.has(String(item.id)));
  }

  function getTopicLabel(topic, language) {
    if (!topic) {
      return "";
    }

    const pieces = [topic.label || topic.query];

    if (topic.category && topic.category !== "all") {
      pieces.push(getCategoryLabel(topic.category, language));
    }

    if (topic.region && topic.region !== "all") {
      pieces.push(getRegionLabel(topic.region, language));
    }

    return pieces.filter(Boolean).join(" · ");
  }

  function getStoriesForTrackedTopic(news, topic, limit) {
    const normalized = normalizeTrackedTopic(topic);

    if (!normalized) {
      return [];
    }

    return filterNews(news, {
      query: normalized.query,
      category: normalized.category,
      region: normalized.region
    }).slice(0, limit || 4);
  }

  function getTrackedTopicBundles(news, options) {
    const nextOptions = options || {};
    return getTrackedTopics()
      .map((topic) => ({
        topic,
        stories: getStoriesForTrackedTopic(news, topic, nextOptions.limitPerTopic || 4)
      }))
      .filter((bundle) => bundle.stories.length || nextOptions.includeEmpty);
  }

  function getTrackedTopicFeed(news, limit) {
    const seen = new Set();
    const items = [];

    getTrackedTopicBundles(news, { limitPerTopic: limit || 4 }).forEach((bundle) => {
      bundle.stories.forEach((story) => {
        const key = String(story.id);
        if (seen.has(key)) {
          return;
        }

        seen.add(key);
        items.push(story);
      });
    });

    return items.slice(0, limit || 6);
  }

  function getPreferredCategories(news) {
    const counts = {};

    getSavedStories(news).forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    getTrackedTopics().forEach((topic) => {
      if (topic.category && topic.category !== "all") {
        counts[topic.category] = (counts[topic.category] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);
  }

  function getPersonalizedLiveStories(news, limit) {
    const trackedStories = getTrackedTopicFeed(news, limit || 4).filter((item) => isLiveItem(item));

    if (trackedStories.length) {
      return trackedStories.slice(0, limit || 4);
    }

    const liveStories = getLiveStories(news);
    const preferredCategories = getPreferredCategories(news);

    if (!preferredCategories.length) {
      return liveStories.slice(0, limit || 4);
    }

    const personalized = liveStories.filter((item) => preferredCategories.includes(item.category));
    return (personalized.length ? personalized : liveStories).slice(0, limit || 4);
  }

  function getAccessLabel(key, language) {
    const map = {
      open: t("common.accessOpen", language),
      hybrid: t("common.accessHybrid", language),
      subscription: t("common.accessSubscription", language)
    };

    return map[key] || key;
  }

  function getKindLabel(key, language) {
    const map = {
      journal: t("common.kindJournal", language),
      preprint: t("common.kindPreprint", language),
      conference: t("common.kindConference", language)
    };

    return map[key] || key;
  }

  function getStoryFormatLabel(item, language) {
    const customLabel = localize(item.briefType, language);

    if (customLabel) {
      return customLabel;
    }

    if (item.sourceType === "github") {
      return "GitHub";
    }

    if (item.sourceType === "official") {
      return language === "zh" ? "官方来源" : "Official source";
    }

    if (item.sourceUrl) {
      return language === "zh" ? "来源跟踪" : "Source-backed";
    }

    return language === "zh" ? "编辑简报" : "Editorial brief";
  }

  function createChips(options, selectedKey, groupName, language) {
    return options
      .map((option) => {
        const activeClass = option.key === selectedKey ? " is-active" : "";
        return `
          <button class="chip${activeClass}" type="button" data-group="${escapeHtml(groupName)}" data-value="${escapeHtml(option.key)}">
            ${escapeHtml(option.label[language])}
          </button>
        `;
      })
      .join("");
  }

  function renderHeader(currentPage) {
    const language = getLanguage();
    const account = getAccountState();
    const accountStatusLabel = !account.remoteEnabled
      ? (language === "en" ? "Local mode" : "本地模式")
      : !account.authenticated
        ? (language === "en" ? "Sign in" : "登录同步")
        : account.syncStatus === "syncing"
          ? (language === "en" ? "Syncing" : "同步中")
          : account.syncStatus === "queued"
            ? (language === "en" ? "Sync queued" : "待同步")
            : account.syncStatus === "error"
              ? (language === "en" ? "Sync issue" : "同步异常")
              : (language === "en" ? "Synced" : "已同步");
    const accountStatusClass = !account.remoteEnabled || !account.authenticated
      ? ""
      : account.syncStatus === "error"
        ? " is-warning"
        : " is-ready";

    const navItems = [
      { key: "home", href: "index.html" },
      { key: "feed", href: "list.html" },
      { key: "search", href: "search.html" },
      { key: "radar", href: "radar.html" },
      { key: "sources", href: "sources.html" },
      { key: "briefing", href: "briefing.html" },
      { key: "account", href: "account.html" }
    ]
      .map((item) => {
        const activeClass = item.key === currentPage ? "is-active" : "";
        const label = item.label || t(`nav.${item.key}`, language);
        return `<a class="${activeClass}" href="${item.href}">${escapeHtml(label)}</a>`;
      })
      .join("");

    const modeButtons = viewModes
      .map((mode) => {
        const activeClass = mode.key === getViewMode() ? " is-active" : "";
        return `<button class="mode-btn${activeClass}" type="button" data-view-mode="${escapeHtml(mode.key)}">${escapeHtml(localize(mode.label, language))}</button>`;
      })
      .join("");

    return `
      <div class="site-header">
        <div class="page-shell header-inner">
          <a class="brand" href="index.html">
            <span class="brand-mark">AI</span>
            <div class="brand-copy">
              <span class="brand-name">${escapeHtml(t("siteTitle", language))}</span>
              <small>${escapeHtml(t("brandSubtitle", language))}</small>
            </div>
          </a>

          <nav class="top-nav" aria-label="Primary">
            ${navItems}
          </nav>

          <div class="header-actions">
            <a class="account-status-pill${accountStatusClass}" href="account.html">${escapeHtml(accountStatusLabel)}</a>
            <div class="view-toggle">
              ${modeButtons}
            </div>
            <button class="lang-btn${language === "zh" ? " is-active" : ""}" type="button" data-lang-switch="zh">中文</button>
            <button class="lang-btn${language === "en" ? " is-active" : ""}" type="button" data-lang-switch="en">EN</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderFooter() {
    const language = getLanguage();
    return `
      <div class="page-shell">
        <div class="site-footer panel footer-inner">
          <div class="footer-copy">${escapeHtml(t("footer", language))}</div>
          <div class="footer-links">
            <a href="index.html">${escapeHtml(t("nav.home", language))}</a>
            <a href="list.html">${escapeHtml(t("nav.feed", language))}</a>
            <a href="search.html">${escapeHtml(t("nav.search", language))}</a>
            <a href="radar.html">${escapeHtml(t("nav.radar", language))}</a>
            <a href="sources.html">${escapeHtml(t("nav.sources", language))}</a>
            <a href="briefing.html">${escapeHtml(t("nav.briefing", language))}</a>
            <a href="account.html">${escapeHtml(t("nav.account", language))}</a>
          </div>
        </div>
      </div>
    `;
  }

  async function initShell(currentPage) {
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");

    function drawShell() {
      applyViewMode();

      if (header) {
        header.innerHTML = renderHeader(currentPage);
      }

      if (footer) {
        footer.innerHTML = renderFooter();
      }

      bindLanguageButtons();
      bindViewModeButtons();
    }

    drawShell();
    document.addEventListener("ai-insight:language", drawShell);
    document.addEventListener("ai-insight:view-mode", drawShell);
    document.addEventListener("ai-insight:account-state", drawShell);

    await bootstrapAccountSession();
    drawShell();

    return getAccountState();
  }

  function bindLanguageButtons() {
    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      button.addEventListener("click", () => {
        setLanguage(button.dataset.langSwitch);
      });
    });
  }

  function bindViewModeButtons() {
    document.querySelectorAll("[data-view-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        setViewMode(button.dataset.viewMode);
      });
    });
  }

  function bindChoiceButtons(root, callback) {
    root.querySelectorAll("[data-group][data-value]").forEach((button) => {
      button.addEventListener("click", () => {
        callback(button.dataset.group, button.dataset.value);
      });
    });
  }

  function bindTagButtons(root, callback) {
    root.querySelectorAll("[data-tag]").forEach((button) => {
      button.addEventListener("click", () => {
        callback(button.dataset.tag);
      });
    });
  }

  function createTagButtons(tags) {
    return tags
      .map((tag) => `<button class="chip" type="button" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`)
      .join("");
  }

  function bindStoryCards(root) {
    root.querySelectorAll("[data-story-link]").forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest("a, button, input, select, label")) {
          return;
        }

        window.location.href = card.dataset.storyLink;
      });

      card.addEventListener("keydown", (event) => {
        if (event.target.closest("a, button, input, select")) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          window.location.href = card.dataset.storyLink;
        }
      });
    });
  }

  function bindSaveButtons(root, rerender) {
    root.querySelectorAll("[data-save-story]").forEach((button) => {
      button.addEventListener("click", () => {
        toggleSavedStory(button.dataset.saveStory);
        if (typeof rerender === "function") {
          rerender();
        }
      });
    });

    root.querySelectorAll("[data-save-source]").forEach((button) => {
      button.addEventListener("click", () => {
        toggleSavedSource(button.dataset.saveSource);
        if (typeof rerender === "function") {
          rerender();
        }
      });
    });
  }

  function bindTrackButtons(root, rerender) {
    root.querySelectorAll("[data-track-query], [data-track-id][data-track-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.trackRemove === "true" && button.dataset.trackId) {
          removeTrackedTopic(button.dataset.trackId);
        } else {
          toggleTrackedTopic({
            query: button.dataset.trackQuery,
            label: button.dataset.trackLabel,
            category: button.dataset.trackCategory,
            region: button.dataset.trackRegion
          });
        }

        if (typeof rerender === "function") {
          rerender();
        }
      });
    });
  }

  function bindRefreshButtons(root, callback) {
    root.querySelectorAll("[data-refresh-news]").forEach((button) => {
      button.addEventListener("click", () => {
        if (typeof callback === "function") {
          callback();
          return;
        }

        refreshNews({ forceRefresh: true }).catch(() => {});
      });
    });
  }

  function createProviderCards(language) {
    return getProviderIds()
      .map((providerId) => {
        const meta = getProviderMeta(providerId);
        return `
          <article class="provider-card page-fade">
            <span class="meta-label">${escapeHtml(t("common.summaryEngine", language))}</span>
            <h3>${escapeHtml(localize(meta.label, language))}</h3>
            <p>${escapeHtml(localize(meta.description, language))}</p>
            <div class="tag-row">
              ${meta.models.map((model) => `<span class="tag">${escapeHtml(model)}</span>`).join("")}
            </div>
          </article>
        `;
      })
      .join("");
  }

  function createJournalCard(item, language) {
    const savedLabel = isSourceSaved(item.id) ? t("common.savedSource", language) : t("common.saveSource", language);
    return `
      <article class="journal-card page-fade">
        <div class="story-meta">
          <span class="ghost-badge">${escapeHtml(getKindLabel(item.kind, language))}</span>
          <span class="ghost-badge">${escapeHtml(getAccessLabel(item.access, language))}</span>
          <button class="save-btn${isSourceSaved(item.id) ? " is-saved" : ""}" type="button" data-save-source="${escapeHtml(item.id)}">${escapeHtml(savedLabel)}</button>
        </div>
        <h3>${escapeHtml(localize(item.title, language))}</h3>
        <p class="journal-publisher">${escapeHtml(item.publisher)}</p>
        <p class="story-deck">${escapeHtml(localize(item.bestFor, language))}</p>
        <div class="story-summary">
          <span>${escapeHtml(t("common.editorialSummary", language))}</span>
          <p>${escapeHtml(localize(item.coverage, language))}</p>
        </div>
        <ul class="detail-list">
          <li>${escapeHtml(localize(item.previewPolicy, language))}</li>
          <li>${escapeHtml(localize(item.latestNote, language))}</li>
        </ul>
        <div class="story-footer">
          <div class="tag-row">
            ${(item.tags || []).slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <a class="story-link" href="${escapeHtml(item.url)}"${getExternalLinkAttributes()}>${escapeHtml(t("common.visitSource", language))}</a>
        </div>
      </article>
    `;
  }

  function createStoryCard(item, options) {
    const language = options && options.language ? options.language : getLanguage();
    const compact = options && options.compact;
    const title = escapeHtml(localize(item.title, language));
    const deck = escapeHtml(localize(item.deck, language));
    const insight = escapeHtml(localize(item.insight, language));
    const formatLabel = escapeHtml(getStoryFormatLabel(item, language));
    const metricLabel = escapeHtml(localize(item.metricLabel, language) || (language === "zh" ? "信号" : "Signal"));
    const metricValue = escapeHtml(item.metricValue || `${item.readingTime} ${t("common.readingTimeSuffix", language)}`);
    const summary = localize(item.summaryPoints, language).slice(0, compact ? 2 : 3);
    const tags = item.tags.slice(0, compact ? 2 : 3);
    const wrapperClass = compact ? "compact-card" : "story-card";
    const preferredSummary = getPrimarySummary(item, language);
    const liveBadge = isLiveItem(item)
      ? `<span class="badge badge-live">${escapeHtml(t("common.live", language))}</span>`
      : "";
    const sourceMeta = item.sourceName
      ? `
        <div class="story-source">
          <span>${escapeHtml(t("common.source", language))}</span>
          <strong>${escapeHtml(item.sourceName)}</strong>
          <span>·</span>
          <span>${escapeHtml(formatDate(item.date, language))}</span>
        </div>
      `
      : "";
    const sourceLink = item.sourceUrl
      ? `<a class="text-link" href="${escapeHtml(item.sourceUrl)}"${getExternalLinkAttributes()}>${escapeHtml(t("common.openSource", language))}</a>`
      : "";
    const savedLabel = isStorySaved(item.id) ? t("common.saved", language) : t("common.save", language);

    return `
      <article class="${wrapperClass} page-fade clickable-card" data-story-link="detail.html?id=${item.id}" tabindex="0" role="link" aria-label="${title}">
        <div class="story-meta">
          ${liveBadge}
          <span class="${getBadgeClass(item.signal)}">${escapeHtml(getSignalLabel(item.signal, language))}</span>
          <span class="ghost-badge">${escapeHtml(getCategoryLabel(item.category, language))}</span>
          <span class="ghost-badge">${escapeHtml(getRegionLabel(item.region, language))}</span>
          <button class="save-btn${isStorySaved(item.id) ? " is-saved" : ""}" type="button" data-save-story="${escapeHtml(item.id)}">${escapeHtml(savedLabel)}</button>
        </div>

        <h3>${title}</h3>
        ${sourceMeta}
        <div class="story-pro-meta pro-only">
          <span>${formatLabel}</span>
          <span>${metricLabel}: ${metricValue}</span>
          <span>${escapeHtml(formatDate(item.date, language))}</span>
        </div>
        <p class="story-deck">${deck}</p>

        ${
          preferredSummary && !compact
            ? `
              <div class="story-summary">
                <span>${escapeHtml(t(item.aiSummary ? "common.aiSummary" : "common.editorialSummary", language))}</span>
                <p>${escapeHtml(preferredSummary)}</p>
              </div>
            `
            : ""
        }

        <ul class="story-points">
          ${summary.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
        </ul>

        ${
          compact
            ? ""
            : `
              <div class="story-insight">
                <span>${escapeHtml(t("common.insight", language))}</span>
                <p>${insight}</p>
              </div>
            `
        }

        <div class="story-footer">
          <div class="tag-row">
            ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="story-links">
            <a class="story-link" href="detail.html?id=${item.id}">${escapeHtml(t("common.viewDetail", language))}</a>
            ${sourceLink}
          </div>
        </div>
      </article>
    `;
  }

  function createSignalCard(item, options) {
    const language = options && options.language ? options.language : getLanguage();
    const title = escapeHtml(localize(item.title, language));
    const deck = escapeHtml(localize(item.deck, language));
    const formatLabel = escapeHtml(getStoryFormatLabel(item, language));
    const metricLabel = escapeHtml(localize(item.metricLabel, language) || (language === "zh" ? "信号" : "Signal"));
    const metricValue = escapeHtml(item.metricValue || formatDate(item.date, language));
    const notes = localize(item.proNotes, language).slice(0, 2);
    const summary = localize(item.summaryPoints, language).slice(0, 2);
    const savedLabel = isStorySaved(item.id) ? t("common.saved", language) : t("common.save", language);

    return `
      <article class="signal-card page-fade clickable-card" data-story-link="detail.html?id=${item.id}" tabindex="0" role="link" aria-label="${title}">
        <div class="story-meta">
          <span class="ghost-badge">${formatLabel}</span>
          <span class="${getBadgeClass(item.signal)}">${escapeHtml(getSignalLabel(item.signal, language))}</span>
          <span class="ghost-badge">${escapeHtml(getRegionLabel(item.region, language))}</span>
          <button class="save-btn${isStorySaved(item.id) ? " is-saved" : ""}" type="button" data-save-story="${escapeHtml(item.id)}">${escapeHtml(savedLabel)}</button>
        </div>

        <h3>${title}</h3>
        <p class="story-deck">${deck}</p>

        <div class="signal-metric">
          <span>${metricLabel}</span>
          <strong>${metricValue}</strong>
        </div>

        <ul class="signal-notes">
          ${(notes.length ? notes : summary).map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
        </ul>

        <div class="story-footer">
          <div class="tag-row">
            ${item.tags.slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="story-links">
            <a class="story-link" href="detail.html?id=${item.id}">${escapeHtml(t("common.viewDetail", language))}</a>
            ${item.sourceUrl ? `<a class="story-link" href="${escapeHtml(item.sourceUrl)}"${getExternalLinkAttributes()}>${escapeHtml(t("common.openSource", language))}</a>` : ""}
          </div>
        </div>
      </article>
    `;
  }

  function createMiniInsightCard(title, value, body) {
    return `
      <div class="panel">
        <span class="mini-label">${escapeHtml(title)}</span>
        <div class="mini-value">${escapeHtml(value)}</div>
        <p class="panel-text">${escapeHtml(body)}</p>
      </div>
    `;
  }

  function createEmptyState(title, body) {
    return `
      <div class="empty-state page-fade">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(body)}</p>
      </div>
    `;
  }

  function normalizeSummaryText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\s*([,.;:!?])\s*/g, "$1 ")
      .trim();
  }

  function clampSummaryText(value, maxLength) {
    const text = normalizeSummaryText(value);

    if (!text || text.length <= maxLength) {
      return text;
    }

    const shortened = text.slice(0, Math.max(0, maxLength - 1)).trim();
    const trimmed = shortened.replace(/[,:;，；、\s]+$/g, "");
    return `${trimmed}...`;
  }

  function getStorySummaryCandidates(story, language) {
    const deck = normalizeSummaryText(localize(story.deck, language));
    const points = (Array.isArray(localize(story.summaryPoints, language)) ? localize(story.summaryPoints, language) : [])
      .map(normalizeSummaryText)
      .filter(Boolean);
    const contentValue = localize(story.content, language);
    const paragraphs = (Array.isArray(contentValue) ? contentValue : [contentValue])
      .map(normalizeSummaryText)
      .filter(Boolean)
      .map((paragraph) => clampSummaryText(paragraph, language === "zh" ? 52 : 110));

    return {
      deck,
      points,
      paragraphs,
      highlights: uniqueStrings([deck, ...points, ...paragraphs]).filter(Boolean)
    };
  }

  function buildLocalSummary(story, language, model, fallback) {
    const sourceName = normalizeSummaryText(story && story.sourceName);
    const isChinese = language === "zh";
    const maxPoints = model === "local-expanded" ? 3 : 2;
    const { deck, points, paragraphs, highlights } = getStorySummaryCandidates(story || {}, language);
    const primary = deck || highlights[0] || normalizeSummaryText(fallback);
    const secondaryItems = uniqueStrings([...points, ...paragraphs])
      .filter((item) => item && item !== primary)
      .slice(0, maxPoints);

    if (!primary) {
      return clampSummaryText(fallback, isChinese ? 120 : 220);
    }

    if (isChinese) {
      const lead = sourceName ? `这条更新来自${sourceName}。` : "";
      const focus = secondaryItems.length ? `重点包括：${secondaryItems.join("；")}。` : "";
      return clampSummaryText(`${lead}${primary}${/[。！？]$/.test(primary) ? "" : "。"}${focus}`, 140);
    }

    const lead = sourceName ? `From ${sourceName}, ` : "";
    const focus = secondaryItems.length ? ` Key details: ${secondaryItems.join("; ")}.` : "";
    return clampSummaryText(`${lead}${primary}${/[.!?]$/.test(primary) ? "" : "."}${focus}`, 240);
  }

  async function summarizeStory(options) {
    const provider = options.provider || getSelectedProvider();
    const model = options.model || getSelectedModel(provider);
    const language = options.language || getLanguage();
    const story = options.story;
    const config = getConfig();
    const fallback = getPrimarySummary(story, language);

    if (provider === "local") {
      return {
        summary: buildLocalSummary(story, language, model, fallback),
        provider,
        model,
        generated: true,
        mode: "local"
      };
    }

    if (!config.summaryEndpoint) {
      return {
        summary: fallback,
        provider,
        model,
        generated: false,
        mode: "seed"
      };
    }

    try {
      const response = await fetch(config.summaryEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider,
          model,
          language,
          story: {
            title: localize(story.title, language),
            deck: localize(story.deck, language),
            content: localize(story.content, language),
            sourceUrl: story.sourceUrl,
            sourceName: story.sourceName,
            date: story.date,
            category: story.category
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Summary endpoint returned ${response.status}`);
      }

      const payload = await response.json();
      const actualProvider = normalizeProviderId(payload.provider || provider);
      const actualModel = getProviderMeta(actualProvider).models.includes(payload.model)
        ? payload.model
        : model;

      return {
        summary: payload.summary || fallback,
        provider: actualProvider,
        model: actualModel,
        generated: Boolean(payload.summary),
        mode: payload.summary ? (actualProvider === "local" ? "local" : "live") : "seed"
      };
    } catch (error) {
      return {
        summary: fallback,
        provider,
        model,
        generated: false,
        mode: "fallback",
        error: error.message
      };
    }
  }

  window.AIInsight = {
    copy,
    categories,
    regions,
    formats,
    getLanguage,
    setLanguage,
    getViewMode,
    setViewMode,
    getBriefingSettings,
    setBriefingSettings,
    updateBriefingSettings,
    getConfig,
    getProviderCatalog,
    getProviderIds,
    getProviderMeta,
    getSummaryPreference,
    getSelectedModel,
    setSummaryPreference,
    t,
    localize,
    escapeHtml,
    formatDate,
    formatDateTime,
    formatRefreshInterval,
    getCategoryLabel,
    getRegionLabel,
    getFormatLabel,
    getSignalLabel,
    getBadgeClass,
    getNews,
    getNewsMeta,
    refreshNews,
    startAutoRefresh,
    stopAutoRefresh,
    getLiveStories,
    getMicroStories,
    getHeadlineStories,
    getEditorialStories,
    isLiveItem,
    isMicroStory,
    getPrimarySummary,
    filterNews,
    getTopTags,
    getStoriesByCategory,
    getJournalSources,
    getSavedStories,
    getSavedSources,
    getTrackedTopics,
    getTopicLabel,
    getStoriesForTrackedTopic,
    getTrackedTopicBundles,
    getTrackedTopicFeed,
    getPreferredCategories,
    getPersonalizedLiveStories,
    getAccountState,
    bootstrapAccountSession,
    registerAccount,
    loginAccount,
    logoutAccount,
    syncAccountState,
    isStorySaved,
    isSourceSaved,
    isTopicTracked,
    toggleSavedStory,
    toggleSavedSource,
    toggleTrackedTopic,
    removeTrackedTopic,
    getAccessLabel,
    getKindLabel,
    getStoryFormatLabel,
    createChips,
    initShell,
    bindChoiceButtons,
    bindTagButtons,
    bindStoryCards,
    bindSaveButtons,
    bindTrackButtons,
    bindRefreshButtons,
    createTagButtons,
    createProviderCards,
    createJournalCard,
    createStoryCard,
    createSignalCard,
    createRefreshStatusCard,
    createMiniInsightCard,
    createEmptyState,
    summarizeStory,
    getExternalLinkAttributes
  };
})();

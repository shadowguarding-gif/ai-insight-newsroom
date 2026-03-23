document.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("search-app");
  let news = [];
  const params = new URLSearchParams(window.location.search);
  const state = {
    query: params.get("q") || "",
    category: AIInsight.categories.some((item) => item.key === params.get("category")) ? params.get("category") : "all",
    format: AIInsight.formats.some((item) => item.key === params.get("format")) ? params.get("format") : "all"
  };

  await AIInsight.initShell("search");
  AIInsight.startAutoRefresh();

  function getCopy(language, meta, count, liveCount, tracked) {
    return {
      zh: {
        eyebrow: "Search The Signal",
        title: "搜索时事新闻、深度简报与原文来源",
        lead: "你可以在这里直接搜模型、公司、技术方向、市场区域或产业变量。搜索结果会把实时新闻、编辑总结、AI 摘要和原文网址一起展示，适合做快速判断。",
        statusLead: meta.remoteConnected
          ? "搜索页会跟着远端 live 源一起刷新，所以更适合拿来追具体公司、模型和主题。"
          : "搜索页当前搜索的是站内精选与内置官方快讯，接上 live backend 后会连远端新闻一起检索。",
        placeholder: "例如：OpenAI、Gemini、agent、推理、APAC、datacenter",
        searchLabel: "输入你想追踪的方向",
        categoryLabel: "限定赛道",
        count: `检索到 ${count} 条结果，其中 ${liveCount} 条带原文链接`,
        tipsTitle: "搜索建议",
        tips: [
          "可以搜公司与产品，如 OpenAI、Anthropic、Gemini、DeepSeek。",
          "也可以搜行业变量，如 inference、robotics、compliance、AI cloud。",
          "中英文关键词都支持，适合做全球化 AI 新闻检索。"
        ],
        tagsTitle: "热门关键词",
        radarTitle: "加入你的主题雷达",
        radarBody: tracked
          ? "这个主题已经进入你的 Radar，后续会自动影响雷达页和 My Briefing。"
          : "把当前搜索主题加入 Radar，之后这个站会持续帮你追它的相关新闻。",
        radarAction: tracked ? AIInsight.t("common.trackedTopic", language) : AIInsight.t("common.trackTopic", language),
        radarLink: "打开 Radar",
        emptyTitle: "暂时没有匹配结果",
        emptyBody: "试试更宽泛的关键词，或者先取消赛道限制。"
      },
      en: {
        eyebrow: "Search The Signal",
        title: "Search live news, deep briefs, and original sources",
        lead: "Search by model, company, technical direction, market region, or industry variable. Results are designed to surface live coverage, editorial wraps, AI summaries, and source URLs in one view for fast evaluation.",
        statusLead: meta.remoteConnected
          ? "This page refreshes with the remote live source, making it better for tracking specific companies, models, and themes."
          : "This page currently searches in-house curation and embedded official updates; once the live backend is connected, remote coverage will join the same search surface.",
        placeholder: "Try: OpenAI, Gemini, agent, reasoning, APAC, datacenter",
        searchLabel: "Describe the signal you want to track",
        categoryLabel: "Limit by lane",
        count: `${count} results found, including ${liveCount} source-backed updates`,
        tipsTitle: "Search tips",
        tips: [
          "Search companies and products such as OpenAI, Anthropic, Gemini, or DeepSeek.",
          "Search industry variables such as inference, robotics, compliance, or AI cloud.",
          "Both Chinese and English queries work for a global AI newsroom flow."
        ],
        tagsTitle: "Popular keywords",
        radarTitle: "Add This Theme To Your Radar",
        radarBody: tracked
          ? "This topic is already being tracked and will keep shaping your Radar page and My Briefing."
          : "Add the current search theme to your Radar so the site keeps following it for you.",
        radarAction: tracked ? AIInsight.t("common.trackedTopic", language) : AIInsight.t("common.trackTopic", language),
        radarLink: "Open Radar",
        emptyTitle: "No matching results yet",
        emptyBody: "Try a broader keyword, or remove the lane filter first."
      }
    }[language];
  }

  function syncUrl() {
    const url = new URL(window.location.href);
    if (state.query) {
      url.searchParams.set("q", state.query);
    } else {
      url.searchParams.delete("q");
    }

    if (state.category !== "all") {
      url.searchParams.set("category", state.category);
    } else {
      url.searchParams.delete("category");
    }

    if (state.format !== "all") {
      url.searchParams.set("format", state.format);
    } else {
      url.searchParams.delete("format");
    }

    window.history.replaceState({}, "", url);
  }

  function render(options) {
    const shouldFocusSearch = options && options.focusSearch;
    const language = AIInsight.getLanguage();
    const meta = AIInsight.getNewsMeta();
    const topTags = AIInsight.getTopTags(news, 12);
    const tracked = state.query.trim() ? AIInsight.isTopicTracked(state.query, state.category, "all") : false;

    if (!news.length) {
      document.title = "AI Insight";
      app.innerHTML = `
        <div class="page-shell">
          ${AIInsight.createRefreshStatusCard(meta, language)}
          ${AIInsight.createEmptyState(
            language === "zh" ? "搜索内容准备中" : "Search is waiting for content",
            language === "zh"
              ? "还没有可检索的数据。接入实时内容后，这里会提供真正的主题搜索能力。"
              : "There is no searchable data yet. Once live coverage is connected, this page becomes a real topic-search surface."
          )}
        </div>
      `;
      AIInsight.bindRefreshButtons(app, () => {
        AIInsight.refreshNews({ forceRefresh: true }).catch(() => {});
      });
      return;
    }

    const filtered = AIInsight.filterNews(news, {
      query: state.query,
      category: state.category,
      region: "all",
      format: state.format
    });
    const pageCopy = getCopy(language, meta, filtered.length, AIInsight.getLiveStories(filtered).length, tracked);
    pageCopy.formatLabel = language === "en" ? "Reading view" : "阅读视图";

    document.title = language === "zh" ? "AI Insight | AI 资讯搜索" : "AI Insight | Search AI signals";
    syncUrl();

    app.innerHTML = `
      <div class="page-shell">
        <section class="hero search-hero page-fade">
          <span class="eyebrow">${AIInsight.escapeHtml(pageCopy.eyebrow)}</span>
          <h1>${AIInsight.escapeHtml(pageCopy.title)}</h1>
          <p class="lead">${AIInsight.escapeHtml(pageCopy.lead)}</p>

          <div class="search-command">
            <label class="control-label" for="search-input">${AIInsight.escapeHtml(pageCopy.searchLabel)}</label>
            <input
              id="search-input"
              class="search-input"
              type="search"
              value="${AIInsight.escapeHtml(state.query)}"
              placeholder="${AIInsight.escapeHtml(pageCopy.placeholder)}"
            >
          </div>
        </section>

        ${AIInsight.createRefreshStatusCard(meta, language, { lead: pageCopy.statusLead })}

        ${
          state.query.trim()
            ? `
              <section class="panel topic-panel page-fade">
                <div class="topic-panel-head">
                  <div>
                    <span class="meta-label">Radar</span>
                    <h3>${AIInsight.escapeHtml(pageCopy.radarTitle)}</h3>
                    <p class="panel-text">${AIInsight.escapeHtml(pageCopy.radarBody)}</p>
                  </div>
                  <div class="topic-panel-actions">
                    <button
                      class="save-btn${tracked ? " is-saved" : ""}"
                      type="button"
                      data-track-query="${AIInsight.escapeHtml(state.query)}"
                      data-track-label="${AIInsight.escapeHtml(state.query)}"
                      data-track-category="${AIInsight.escapeHtml(state.category)}"
                      data-track-region="all"
                    >
                      ${AIInsight.escapeHtml(pageCopy.radarAction)}
                    </button>
                    <a class="button button-secondary" href="radar.html">${AIInsight.escapeHtml(pageCopy.radarLink)}</a>
                  </div>
                </div>
              </section>
            `
            : ""
        }

        <section class="panel search-panel page-fade">
          <div class="control-group">
            <span class="control-label">${AIInsight.escapeHtml(pageCopy.categoryLabel)}</span>
            <div class="chip-row">
              ${AIInsight.createChips(AIInsight.categories, state.category, "category", language)}
            </div>
          </div>
          <div class="control-group">
            <span class="control-label">${AIInsight.escapeHtml(pageCopy.formatLabel)}</span>
            <div class="chip-row">
              ${AIInsight.createChips(AIInsight.formats, state.format, "format", language)}
            </div>
          </div>
          <div class="section-head">
            <p class="results-meta">${AIInsight.escapeHtml(pageCopy.count)}</p>
          </div>
        </section>

        <section class="section tips-grid">
          <article class="tip-card page-fade">
            <span class="meta-label">${AIInsight.escapeHtml(pageCopy.tipsTitle)}</span>
            <ul class="detail-list">
              ${pageCopy.tips.map((tip) => `<li>${AIInsight.escapeHtml(tip)}</li>`).join("")}
            </ul>
          </article>

          <article class="tip-card page-fade">
            <span class="meta-label">${AIInsight.escapeHtml(pageCopy.tagsTitle)}</span>
            <div class="chip-row">
              ${AIInsight.createTagButtons(topTags)}
            </div>
          </article>
        </section>

        <section class="section">
          ${
            filtered.length
              ? `
                <div class="story-grid feed-grid">
                  ${filtered.map((item) => AIInsight.createStoryCard(item, { language })).join("")}
                </div>
              `
              : AIInsight.createEmptyState(pageCopy.emptyTitle, pageCopy.emptyBody)
          }
        </section>
      </div>
    `;

    document.getElementById("search-input").addEventListener("input", (event) => {
      state.query = event.target.value;
      render({ focusSearch: true });
    });

    AIInsight.bindChoiceButtons(app, (group, value) => {
      state[group] = value;
      render();
    });

    AIInsight.bindTagButtons(app, (tag) => {
      state.query = tag;
      render({ focusSearch: true });
    });

    if (shouldFocusSearch) {
      const nextInput = document.getElementById("search-input");
      const length = nextInput.value.length;
      nextInput.focus();
      nextInput.setSelectionRange(length, length);
    }

    AIInsight.bindRefreshButtons(app, () => {
      AIInsight.refreshNews({ forceRefresh: true }).catch(() => {});
    });
    AIInsight.bindTrackButtons(app, () => render(shouldFocusSearch ? { focusSearch: true } : undefined));
    AIInsight.bindStoryCards(app);
    AIInsight.bindSaveButtons(app, () => render(shouldFocusSearch ? { focusSearch: true } : undefined));
  }

  document.addEventListener("ai-insight:news-state", (event) => {
    if (event.detail && Array.isArray(event.detail.items)) {
      news = event.detail.items;
      render();
    }
  });

  document.addEventListener("ai-insight:language", render);
  document.addEventListener("ai-insight:tracked-topics", render);

  news = await AIInsight.getNews();
  render();
});

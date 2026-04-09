document.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("watch-app");
  const params = new URLSearchParams(window.location.search);
  let news = [];
  const platformChoices = [
    { key: "all", label: { zh: "全部平台", en: "All platforms" } },
    { key: "official", label: { zh: "官方站点", en: "Official site" } },
    { key: "youtube", label: { zh: "YouTube", en: "YouTube" } },
    { key: "bilibili", label: { zh: "Bilibili", en: "Bilibili" } }
  ];
  const angleChoices = [
    { key: "all", label: { zh: "全部路线", en: "All routes" } },
    { key: "official", label: { zh: "原视频", en: "Original video" } },
    { key: "analysis", label: { zh: "解读分析", en: "Explainers" } }
  ];
  const state = {
    query: params.get("q") || "",
    category: AIInsight.categories.some((item) => item.key === params.get("category")) ? params.get("category") : "all",
    platform: platformChoices.some((item) => item.key === params.get("platform")) ? params.get("platform") : "all",
    angle: angleChoices.some((item) => item.key === params.get("angle")) ? params.get("angle") : "all"
  };
  let queryCommitTimer = null;
  let isComposingQuery = false;

  await AIInsight.initShell("watch");
  AIInsight.startAutoRefresh();

  function getCopy(language, meta, count, allCount) {
    return {
      zh: {
        eyebrow: "Watch The Signal",
        title: "只把已核实的视频和回放放进这个入口",
        lead: "这里不再猜测 YouTube 或 B 站搜索结果，只保留已经确认存在的官方视频、回放和解读入口。",
        statusLead: meta.remoteConnected
          ? "视频页会跟着远端 live 条目一起扩充，但只有出现真实视频链接时才会进入这里。"
          : "当前视频页优先展示站内已核实的视频条目，接上 live backend 后也只会补进真实可看的链接。",
        searchLabel: "搜公司、产品、会议或工具",
        placeholder: "例如：英伟达、OpenAI、马斯克、Qwen、agent、GTC",
        categoryLabel: "新闻分类",
        platformLabel: "视频平台",
        angleLabel: "观看路线",
        resultsMeta: `当前整理出 ${count} 条已核实的视频主题，全站共有 ${allCount} 条新闻进入候选池`,
        highlightTitle: "先看这几条",
        highlightNote: "优先放最适合先看发布会回放、官方演示或高质量解读的视频主题。",
        emptyTitle: "暂时没有匹配的视频主题",
        emptyBody: "试试换个公司名、产品名或会议关键词。这里不会硬塞不存在的视频。"
      },
      en: {
        eyebrow: "Watch The Signal",
        title: "Only surface verified videos and replays in this watch desk",
        lead: "This page no longer guesses search routes. It only keeps video links that actually exist, including official replays and selected explainers.",
        statusLead: meta.remoteConnected
          ? "The watch desk expands with the remote live feed, but only when a story has a real video link behind it."
          : "The watch desk currently shows only verified video-backed stories from the in-house pool and keeps the same rule when live coverage is connected.",
        searchLabel: "Search a company, product, conference, or tool",
        placeholder: "Try: NVIDIA, OpenAI, Musk, Qwen, agent, GTC",
        categoryLabel: "News lane",
        platformLabel: "Platform",
        angleLabel: "Route",
        resultsMeta: `${count} verified watch themes built from ${allCount} stories in the newsroom`,
        highlightTitle: "Start here",
        highlightNote: "Prioritized for launches, demos, replays, and explainers that are genuinely worth watching first.",
        emptyTitle: "No watch themes matched yet",
        emptyBody: "Try another company, product, or conference keyword. This page will not invent weak watch routes."
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

    if (state.platform !== "all") {
      url.searchParams.set("platform", state.platform);
    } else {
      url.searchParams.delete("platform");
    }

    if (state.angle !== "all") {
      url.searchParams.set("angle", state.angle);
    } else {
      url.searchParams.delete("angle");
    }

    window.history.replaceState({}, "", url);
  }

  function getFilteredLinks(item, language) {
    return AIInsight.getStoryVideoLinks(item, language).filter((link) => {
      const platform = String(link.platformKey || link.platform || "").toLowerCase();
      const angle = String(link.angle || "").toLowerCase();

      if (state.platform !== "all" && platform !== state.platform) {
        return false;
      }

      if (state.angle !== "all" && angle !== state.angle) {
        return false;
      }

      return true;
    });
  }

  function createWatchCard(item, language) {
    const quickRead = AIInsight.getStoryQuickRead(item, language);
    const links = getFilteredLinks(item, language).slice(0, 2);

    if (!links.length) {
      return "";
    }

    return `
      <article class="watch-story-card panel page-fade clickable-card" tabindex="0" role="link" data-story-link="detail.html?id=${item.id}">
        <div class="watch-story-top">
          <div class="story-meta">
            ${AIInsight.isLiveItem(item) ? `<span class="badge badge-live">${AIInsight.escapeHtml(AIInsight.t("common.live", language))}</span>` : ""}
            <span class="${AIInsight.getBadgeClass(item.signal)}">${AIInsight.escapeHtml(AIInsight.getSignalLabel(item.signal, language))}</span>
            <span class="ghost-badge">${AIInsight.escapeHtml(item.sourceName || "AI Insight")}</span>
          </div>
          <button class="save-btn${AIInsight.isStorySaved(item.id) ? " is-saved" : ""}" type="button" data-save-story="${AIInsight.escapeHtml(item.id)}">
            ${AIInsight.escapeHtml(AIInsight.isStorySaved(item.id) ? AIInsight.t("common.saved", language) : AIInsight.t("common.save", language))}
          </button>
        </div>

        <h3>${AIInsight.escapeHtml(AIInsight.localize(item.title, language))}</h3>
        <p class="panel-text">${AIInsight.escapeHtml(AIInsight.getStoryLeadPreview(item, language, true) || quickRead.oneLine)}</p>

        <div class="watch-note-grid">
          <div class="watch-note">
            <span class="mini-label">${AIInsight.escapeHtml(language === "zh" ? "为什么值得看" : "Why watch")}</span>
            <p>${AIInsight.escapeHtml(quickRead.why)}</p>
          </div>
          <div class="watch-note">
            <span class="mini-label">${AIInsight.escapeHtml(language === "zh" ? "继续看什么" : "Next move")}</span>
            <p>${AIInsight.escapeHtml(quickRead.next)}</p>
          </div>
        </div>

        <div class="video-link-list">
          ${links.slice(0, 3).map((link) => `
            <a class="video-link-pill" href="${AIInsight.escapeHtml(link.url)}"${AIInsight.getExternalLinkAttributes()}>
              <span>${AIInsight.escapeHtml(AIInsight.localize(link.platform, language))}</span>
              <strong>${AIInsight.escapeHtml(AIInsight.localize(link.title, language))}</strong>
            </a>
          `).join("")}
        </div>

        <div class="story-footer">
          <div class="story-links">
            <a class="story-link" href="detail.html?id=${item.id}">${AIInsight.escapeHtml(AIInsight.t("common.viewDetail", language))}</a>
            ${
              item.sourceUrl
                ? `<a class="story-link" href="${AIInsight.escapeHtml(item.sourceUrl)}"${AIInsight.getExternalLinkAttributes()}>${AIInsight.escapeHtml(AIInsight.t("common.openSource", language))}</a>`
                : ""
            }
          </div>
        </div>
      </article>
    `;
  }

  function render(options) {
    const shouldFocus = options && options.focusSearch;
    const language = AIInsight.getLanguage();
    const meta = AIInsight.getNewsMeta();
    const baseStories = AIInsight.filterNews(news, {
      query: state.query,
      category: state.category,
      region: "all",
      format: "all"
    });
    const filtered = baseStories.filter((item) => getFilteredLinks(item, language).length);
    const watchCards = filtered.map((item) => createWatchCard(item, language)).filter(Boolean);
    const highlights = filtered.slice(0, 3);
    const topTags = AIInsight.getTopTags(news, 10);
    const pageCopy = getCopy(language, meta, filtered.length, news.length);

    syncUrl();
    document.title = language === "zh" ? "AI Insight | 视频与解读入口" : "AI Insight | Watch desk";

    app.innerHTML = `
      <div class="page-shell">
        <section class="hero search-hero page-fade">
          <span class="eyebrow">${AIInsight.escapeHtml(pageCopy.eyebrow)}</span>
          <h1>${AIInsight.escapeHtml(pageCopy.title)}</h1>
          <p class="lead">${AIInsight.escapeHtml(pageCopy.lead)}</p>

          <div class="search-command">
            <label class="control-label" for="watch-search-input">${AIInsight.escapeHtml(pageCopy.searchLabel)}</label>
            <input
              id="watch-search-input"
              class="search-input"
              type="text"
              inputmode="search"
              enterkeyhint="search"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              value="${AIInsight.escapeHtml(state.query)}"
              placeholder="${AIInsight.escapeHtml(pageCopy.placeholder)}"
            >
          </div>
        </section>

        ${AIInsight.createRefreshStatusCard(meta, language, { lead: pageCopy.statusLead, compact: true })}

        <section class="panel search-panel page-fade">
          <div class="control-group">
            <span class="control-label">${AIInsight.escapeHtml(pageCopy.categoryLabel)}</span>
            <div class="chip-row">
              ${AIInsight.createChips(AIInsight.categories, state.category, "category", language)}
            </div>
          </div>
          <div class="control-group">
            <span class="control-label">${AIInsight.escapeHtml(pageCopy.platformLabel)}</span>
            <div class="chip-row">
              ${AIInsight.createChips(platformChoices, state.platform, "platform", language)}
            </div>
          </div>
          <div class="control-group">
            <span class="control-label">${AIInsight.escapeHtml(pageCopy.angleLabel)}</span>
            <div class="chip-row">
              ${AIInsight.createChips(angleChoices, state.angle, "angle", language)}
            </div>
          </div>
          <div class="section-head">
            <p class="results-meta">${AIInsight.escapeHtml(pageCopy.resultsMeta)}</p>
          </div>
        </section>

        <section class="section tips-grid">
          <article class="tip-card page-fade">
            <span class="meta-label">${AIInsight.escapeHtml(pageCopy.highlightTitle)}</span>
            <p class="panel-text">${AIInsight.escapeHtml(pageCopy.highlightNote)}</p>
            <div class="video-link-list watch-highlight-list">
              ${highlights.length
                ? highlights.map((item) => `
                  <a class="video-link-pill" href="detail.html?id=${item.id}">
                    <span>${AIInsight.escapeHtml(item.sourceName || "AI Insight")}</span>
                    <strong>${AIInsight.escapeHtml(AIInsight.localize(item.title, language))}</strong>
                  </a>
                `).join("")
                : `<p class="panel-text">${AIInsight.escapeHtml(pageCopy.emptyBody)}</p>`
              }
            </div>
          </article>

          <article class="tip-card page-fade">
            <span class="meta-label">${AIInsight.escapeHtml(language === "zh" ? "热门关键词" : "Popular topics")}</span>
            <div class="chip-row">
              ${AIInsight.createTagButtons(topTags)}
            </div>
          </article>
        </section>

        <section class="section">
          ${
            watchCards.length
              ? `<div class="watch-grid">${watchCards.join("")}</div>`
              : AIInsight.createEmptyState(pageCopy.emptyTitle, pageCopy.emptyBody)
          }
        </section>
      </div>
    `;

    const searchInput = document.getElementById("watch-search-input");
    const commitQuery = (nextValue, immediate) => {
      const apply = () => {
        state.query = nextValue;
        render({ focusSearch: true });
      };

      window.clearTimeout(queryCommitTimer);

      if (immediate) {
        apply();
        return;
      }

      queryCommitTimer = window.setTimeout(apply, 220);
    };

    searchInput.addEventListener("compositionstart", () => {
      isComposingQuery = true;
      window.clearTimeout(queryCommitTimer);
    });

    searchInput.addEventListener("compositionend", (event) => {
      isComposingQuery = false;
      commitQuery(event.target.value, true);
    });

    searchInput.addEventListener("input", (event) => {
      if (event.isComposing || isComposingQuery) {
        return;
      }

      commitQuery(event.target.value, false);
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitQuery(event.currentTarget.value, true);
      }
    });

    AIInsight.bindChoiceButtons(app, (group, value) => {
      state[group] = value;
      render();
    });
    AIInsight.bindTagButtons(app, (tag) => {
      state.query = tag;
      render({ focusSearch: true });
    });
    AIInsight.bindRefreshButtons(app, () => {
      AIInsight.refreshNews({ forceRefresh: true }).catch(() => {});
    });
    AIInsight.bindStoryCards(app);
    AIInsight.bindSaveButtons(app, () => render(shouldFocus ? { focusSearch: true } : undefined));

    if (shouldFocus) {
      const nextInput = document.getElementById("watch-search-input");
      const length = nextInput.value.length;
      nextInput.focus();
      nextInput.setSelectionRange(length, length);
    }
  }

  try {
    news = await AIInsight.getNews();
  } catch (error) {
    news = AIInsight.getNews();
  }

  render();
  document.addEventListener("ai-insight:language", () => render());
  document.addEventListener("ai-insight:view-mode", () => render());
  document.addEventListener("ai-insight:news-updated", (event) => {
    news = Array.isArray(event.detail && event.detail.news) ? event.detail.news : AIInsight.getNews();
    render();
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("watch-app");
  const params = new URLSearchParams(window.location.search);
  let news = [];
  const platformChoices = [
    { key: "all", label: { zh: "全部平台", en: "All platforms" } },
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

  await AIInsight.initShell("watch");
  AIInsight.startAutoRefresh();

  function getCopy(language, meta, count, allCount) {
    return {
      zh: {
        eyebrow: "Watch The Signal",
        title: "把原视频、英文分析和中文解读收进一个更省时间的观看入口",
        lead: "这个页面不做昂贵的视频转写，而是先把每条新闻对应的原始视频路线和高质量解读入口整理好。适合先看视频，再决定要不要读长文。",
        statusLead: meta.remoteConnected
          ? "视频页会跟着远端 live 条目一起更新，所以更适合追发布会、演示和产品讲解。"
          : "当前视频页优先用站内高信号条目生成观看路线，接上 live backend 后会跟着实时新闻扩充。",
        searchLabel: "搜公司、产品、会议或工具",
        placeholder: "例如：英伟达、OpenAI、马斯克、Qwen、agent、GTC",
        categoryLabel: "新闻分类",
        platformLabel: "视频平台",
        angleLabel: "观看路线",
        resultsMeta: `当前整理出 ${count} 条可观看主题，全站共有 ${allCount} 条新闻可生成视频路线`,
        highlightTitle: "先看这几条",
        highlightNote: "优先放最适合先看原始视频或演示回放的主题。",
        emptyTitle: "暂时没有匹配的视频主题",
        emptyBody: "试试换个公司名、产品名或会议关键词，或者先把筛选条件放宽。"
      },
      en: {
        eyebrow: "Watch The Signal",
        title: "Collect original videos, English analysis, and Chinese explainers into one lower-friction watch desk",
        lead: "This page avoids expensive transcript pipelines and instead organizes original video routes plus high-signal explainers around each story. Watch first, then decide whether the full article is worth your time.",
        statusLead: meta.remoteConnected
          ? "The watch desk refreshes with the remote live feed, so it works well for launches, demos, and conference coverage."
          : "The watch desk currently builds routes from high-signal in-house coverage first and expands naturally once the live backend is connected.",
        searchLabel: "Search a company, product, conference, or tool",
        placeholder: "Try: NVIDIA, OpenAI, Musk, Qwen, agent, GTC",
        categoryLabel: "News lane",
        platformLabel: "Platform",
        angleLabel: "Route",
        resultsMeta: `${count} watch themes ready, built from ${allCount} stories in the newsroom`,
        highlightTitle: "Start here",
        highlightNote: "Prioritized for topics where the original video or demo is often more useful than opening a long article first.",
        emptyTitle: "No watch themes matched yet",
        emptyBody: "Try another company, product, or conference keyword, or loosen the filters first."
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
      const id = String(link.id || "").toLowerCase();
      const platform = String(link.platform || "").toLowerCase();

      if (state.platform !== "all" && platform !== state.platform) {
        return false;
      }

      if (state.angle === "official" && !id.includes("official")) {
        return false;
      }

      if (state.angle === "analysis" && !id.includes("analysis")) {
        return false;
      }

      return true;
    });
  }

  function createWatchCard(item, language) {
    const quickRead = AIInsight.getStoryQuickRead(item, language);
    const links = getFilteredLinks(item, language);

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
        <p class="panel-text">${AIInsight.escapeHtml(quickRead.oneLine)}</p>

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
              <span>${AIInsight.escapeHtml(link.platform)}</span>
              <strong>${AIInsight.escapeHtml(link.title)}</strong>
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
              type="search"
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

    document.getElementById("watch-search-input").addEventListener("input", (event) => {
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
    AIInsight.bindRefreshButtons(app, () => {
      AIInsight.refreshNews({ forceRefresh: true }).catch(() => {});
    });
    AIInsight.bindStoryCards(app);
    AIInsight.bindSaveButtons(app, () => render(shouldFocus ? { focusSearch: true } : undefined));

    if (shouldFocus) {
      const input = document.getElementById("watch-search-input");
      const length = input.value.length;
      input.focus();
      input.setSelectionRange(length, length);
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

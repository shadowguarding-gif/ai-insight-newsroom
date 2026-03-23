document.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("feed-app");
  const params = new URLSearchParams(window.location.search);
  let news = [];
  const state = {
    query: params.get("q") || "",
    category: AIInsight.categories.some((item) => item.key === params.get("category")) ? params.get("category") : "all",
    region: AIInsight.regions.some((item) => item.key === params.get("region")) ? params.get("region") : "all",
    format: AIInsight.formats.some((item) => item.key === params.get("format")) ? params.get("format") : "all"
  };

  await AIInsight.initShell("feed");
  AIInsight.startAutoRefresh();

  function getCopy(language, meta, resultsCount, liveCount, totalCount) {
    return {
      zh: {
        eyebrow: "Live + Curated Feed",
        title: "全球 AI 资讯总览",
        lead: "这里把时事新闻、原文网址、编辑判断和 AI 摘要入口统一在一个资讯流里。你可以先看实时信号，再用搜索、分类和地区筛选把视野收窄到自己最关心的主题。",
        statusLead: meta.remoteConnected
          ? "当前资讯流已经接到了远端 live 源，所以它会自动把远端时事和站内精选合并。"
          : "当前资讯流仍以站内内容和内置官方快讯为主，接上远端接口后会自动扩成真正的实时总览。",
        searchLabel: "关键词搜索",
        categoryLabel: "按赛道筛选",
        regionLabel: "按区域筛选",
        featuredTitle: "主编精选",
        resultsTitle: "综合资讯流",
        resultsMeta: `当前展示 ${resultsCount} 条内容，其中 ${liveCount} 条带原文链接；全站共 ${totalCount} 条`,
        asideTitle: "摘要引擎支持",
        asideBody: "站点现在支持切换 OpenAI / ChatGPT 与 DeepSeek 两类摘要引擎，适合高质量路线和更低成本路线两种策略。",
        suggestionTitle: "热门关键词",
        reset: "清空条件",
        metrics: [
          {
            label: "实时新闻",
            value: `${meta.liveCount}`,
            copy: "带原文地址的时事条目，适合快速追踪行业动向。"
          },
          {
            label: "综合条目",
            value: `${totalCount}`,
            copy: "把实时快讯和结构化深度简报放进同一个总览。"
          },
          {
            label: "摘要引擎",
            value: `${AIInsight.getProviderIds().length}`,
            copy: "支持多提供商路线，便于后续按成本和质量切换。"
          },
          {
            label: "远端新增",
            value: `${meta.remoteCount}`,
            copy: "如果接入 live backend，这里会直观看到远端补进来的条目量。"
          }
        ],
        emptyTitle: "没有匹配到结果",
        emptyBody: "可以换个关键词，或者先清空筛选条件查看全局趋势。"
      },
      en: {
        eyebrow: "Live + Curated Feed",
        title: "Global AI news feed",
        lead: "This feed brings together breaking coverage, original source URLs, editorial framing, and AI summary hooks in one place. Start with live signals, then narrow the view with search, lane filters, and regional filters.",
        statusLead: meta.remoteConnected
          ? "A remote live source is connected, so this feed is automatically blending remote updates with in-house curation."
          : "This feed is still anchored by in-house coverage and embedded official updates, and it becomes truly live once the backend endpoint is connected.",
        searchLabel: "Keyword search",
        categoryLabel: "Filter by lane",
        regionLabel: "Filter by region",
        featuredTitle: "Editor's pick",
        resultsTitle: "Unified feed",
        resultsMeta: `Showing ${resultsCount} briefs, including ${liveCount} source-backed updates, out of ${totalCount} total`,
        asideTitle: "Summary engine support",
        asideBody: "The site now supports both OpenAI / ChatGPT and DeepSeek summary paths, giving you one route optimized for polish and another for lower-cost generation.",
        suggestionTitle: "Popular topics",
        reset: "Clear filters",
        metrics: [
          {
            label: "Live stories",
            value: `${meta.liveCount}`,
            copy: "Source-linked updates built for rapid tracking of industry movement."
          },
          {
            label: "All briefs",
            value: `${totalCount}`,
            copy: "Breaking stories and structured deep briefs now live in one overview."
          },
          {
            label: "Summary engines",
            value: `${AIInsight.getProviderIds().length}`,
            copy: "Multi-provider support makes it easier to balance quality and cost later."
          },
          {
            label: "Remote adds",
            value: `${meta.remoteCount}`,
            copy: "Once a live backend is connected, you can see how much remote coverage is being merged in."
          }
        ],
        emptyTitle: "No results matched",
        emptyBody: "Try another keyword, or clear the filters to return to the broader signal view."
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

    if (state.region !== "all") {
      url.searchParams.set("region", state.region);
    } else {
      url.searchParams.delete("region");
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
    syncUrl();

    if (!news.length) {
      document.title = "AI Insight";
      app.innerHTML = `
        <div class="page-shell">
          ${AIInsight.createRefreshStatusCard(meta, language)}
          ${AIInsight.createEmptyState(
            language === "zh" ? "内容准备中" : "Coverage is loading",
            language === "zh"
              ? "当前没有可筛选的内容。接入实时资讯源后，这里会成为你的全球 AI 情报主界面。"
              : "There is no content to filter yet. Once a live source is connected, this becomes your global AI intelligence surface."
          )}
        </div>
      `;
      AIInsight.bindRefreshButtons(app, () => {
        AIInsight.refreshNews({ forceRefresh: true }).catch(() => {});
      });
      return;
    }

    const filtered = AIInsight.filterNews(news, state);
    const liveCount = AIInsight.getLiveStories(filtered).length;
    const mainResults = filtered.filter((item) => !AIInsight.isMicroStory(item));
    const microMatches = AIInsight.getMicroStories(filtered).slice(0, 6);
    const displayResults = mainResults.length ? mainResults : filtered;
    const featured = mainResults[0] || filtered[0] || news[0];
    const pageCopy = getCopy(language, meta, filtered.length, liveCount, news.length);
    pageCopy.formatLabel = language === "en" ? "Reading view" : "阅读视图";
    const toolRadarTitle = language === "zh" ? "工具与开源 Radar" : "Launches & OSS Radar";
    const toolRadarNote = language === "zh"
      ? "把热门工具、GitHub 项目和版本更新拆成一层轻量信号，避免它们淹没主线报道。"
      : "A lightweight lane for hot tools, GitHub projects, and release signals so they complement rather than drown the main feed.";
    const proFocusTitle = language === "zh" ? "专业版观察位" : "Pro view";
    const proFocusBody = language === "zh"
      ? "专业版现在会显示更密的信息条、工具信号和更克制的阅读排版，更适合持续扫盘。"
      : "Pro mode now surfaces denser metadata, tool signals, and a more restrained reading layout for sustained scanning.";

    document.title = language === "zh" ? "AI Insight | 全球 AI 资讯总览" : "AI Insight | Global AI news feed";

    app.innerHTML = `
      <div class="page-shell">
        <section class="hero page-fade">
          <div class="hero-grid">
            <div>
              <span class="eyebrow">${AIInsight.escapeHtml(pageCopy.eyebrow)}</span>
              <h1>${AIInsight.escapeHtml(pageCopy.title)}</h1>
              <p class="lead">${AIInsight.escapeHtml(pageCopy.lead)}</p>
            </div>

            <article class="featured-panel panel">
              <div>
                <div class="featured-topline">
                  ${AIInsight.isLiveItem(featured) ? `<span class="badge badge-live">${AIInsight.escapeHtml(AIInsight.t("common.live", language))}</span>` : ""}
                  <span class="${AIInsight.getBadgeClass(featured.signal)}">${AIInsight.escapeHtml(AIInsight.getSignalLabel(featured.signal, language))}</span>
                  <span class="ghost-badge">${AIInsight.escapeHtml(pageCopy.featuredTitle)}</span>
                </div>
                <h2>${AIInsight.escapeHtml(AIInsight.localize(featured.title, language))}</h2>
                <p class="lead">${AIInsight.escapeHtml(AIInsight.localize(featured.deck, language))}</p>
                <div class="story-source">
                  <span>${AIInsight.escapeHtml(AIInsight.t("common.source", language))}</span>
                  <strong>${AIInsight.escapeHtml(featured.sourceName || featured.source || "AI Insight")}</strong>
                  <span>·</span>
                  <span>${AIInsight.escapeHtml(AIInsight.formatDate(featured.date, language))}</span>
                </div>
              </div>
              <div class="featured-stack">
                ${AIInsight.createMiniInsightCard(
                  language === "zh" ? "AI 摘要" : "AI summary",
                  featured.sourceUrl ? AIInsight.t("common.sourceBacked", language) : AIInsight.t("common.summarySeed", language),
                  AIInsight.getPrimarySummary(featured, language)
                )}
                ${AIInsight.createMiniInsightCard(
                  language === "zh" ? "下一观察点" : "Next watchpoint",
                  AIInsight.getCategoryLabel(featured.category, language),
                  AIInsight.localize(featured.watchpoint, language)
                )}
              </div>
              <div class="detail-actions">
                <a class="button button-primary" href="detail.html?id=${featured.id}">${AIInsight.escapeHtml(AIInsight.t("common.viewDetail", language))}</a>
                ${
                  featured.sourceUrl
                    ? `<a class="button button-secondary" href="${AIInsight.escapeHtml(featured.sourceUrl)}"${AIInsight.getExternalLinkAttributes()}>${AIInsight.escapeHtml(AIInsight.t("common.openSource", language))}</a>`
                    : ""
                }
              </div>
            </article>
          </div>
        </section>

        ${AIInsight.createRefreshStatusCard(meta, language, { lead: pageCopy.statusLead })}

        <section class="section">
          <div class="stats-grid">
            ${pageCopy.metrics
              .map(
                (metric) => `
                  <article class="stat-card page-fade">
                    <span class="stat-label">${AIInsight.escapeHtml(metric.label)}</span>
                    <div class="stat-value">${AIInsight.escapeHtml(metric.value)}</div>
                    <p class="stat-copy">${AIInsight.escapeHtml(metric.copy)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="panel control-panel page-fade">
          <div class="control-group">
            <label class="control-label" for="feed-search">${AIInsight.escapeHtml(pageCopy.searchLabel)}</label>
            <input
              id="feed-search"
              class="search-input"
              type="search"
              value="${AIInsight.escapeHtml(state.query)}"
              placeholder="${AIInsight.escapeHtml(AIInsight.t("common.searchPlaceholder", language))}"
            >
          </div>

          <div class="control-group">
            <span class="control-label">${AIInsight.escapeHtml(pageCopy.categoryLabel)}</span>
            <div class="chip-row">
              ${AIInsight.createChips(AIInsight.categories, state.category, "category", language)}
            </div>
          </div>

          <div class="control-group">
            <span class="control-label">${AIInsight.escapeHtml(pageCopy.regionLabel)}</span>
            <div class="chip-row">
              ${AIInsight.createChips(AIInsight.regions, state.region, "region", language)}
            </div>
          </div>

          <div class="control-group">
            <span class="control-label">${AIInsight.escapeHtml(pageCopy.formatLabel)}</span>
            <div class="chip-row">
              ${AIInsight.createChips(AIInsight.formats, state.format, "format", language)}
            </div>
          </div>

          <div class="control-actions">
            <button class="button button-secondary" type="button" id="reset-filters">${AIInsight.escapeHtml(pageCopy.reset)}</button>
          </div>
        </section>

        ${
          microMatches.length && mainResults.length
            ? `
              <section class="section">
                <div class="section-head">
                  <div>
                    <h2>${AIInsight.escapeHtml(toolRadarTitle)}</h2>
                    <p class="section-note">${AIInsight.escapeHtml(toolRadarNote)}</p>
                  </div>
                </div>
                <div class="signal-grid">
                  ${microMatches.map((item) => AIInsight.createSignalCard(item, { language })).join("")}
                </div>
              </section>
            `
            : ""
        }

        <section class="section feed-layout">
          <div>
            <div class="section-head">
              <div>
                <h2>${AIInsight.escapeHtml(pageCopy.resultsTitle)}</h2>
                <p class="results-meta">${AIInsight.escapeHtml(pageCopy.resultsMeta)}</p>
              </div>
            </div>

            ${
              displayResults.length
                ? `
                  <div class="story-grid feed-grid">
                    ${displayResults.map((item) => AIInsight.createStoryCard(item, { language })).join("")}
                  </div>
                `
                : AIInsight.createEmptyState(pageCopy.emptyTitle, pageCopy.emptyBody)
            }
          </div>

          <aside class="article-sidebar">
            <article class="insight-card page-fade">
              <span class="meta-label">${AIInsight.escapeHtml(pageCopy.asideTitle)}</span>
              <h3>${AIInsight.escapeHtml(language === "zh" ? "摘要能力已经进入产品结构" : "Summary is now part of the product structure")}</h3>
              <p>${AIInsight.escapeHtml(pageCopy.asideBody)}</p>
              <p class="panel-text">${AIInsight.escapeHtml(AIInsight.t("common.configureBackend", language))}</p>
            </article>

            <article class="insight-card page-fade">
              <span class="meta-label">${AIInsight.escapeHtml(pageCopy.suggestionTitle)}</span>
              <h3>${AIInsight.escapeHtml(language === "zh" ? "点击即可快速切入主题" : "Click to pivot into a theme instantly")}</h3>
              <div class="chip-row">
                ${AIInsight.createTagButtons(topTags)}
              </div>
            </article>

            <article class="insight-card page-fade pro-only">
              <span class="meta-label">${AIInsight.escapeHtml(proFocusTitle)}</span>
              <h3>${AIInsight.escapeHtml(language === "zh" ? "把工具层和主线新闻拆开看" : "Separate tool signals from the headline layer")}</h3>
              <p>${AIInsight.escapeHtml(proFocusBody)}</p>
              <div class="story-pro-meta is-static">
                <span>${AIInsight.escapeHtml(language === "zh" ? "主线条目" : "Headlines")}: ${AIInsight.escapeHtml(String(mainResults.length))}</span>
                <span>${AIInsight.escapeHtml(language === "zh" ? "工具信号" : "Tool signals")}: ${AIInsight.escapeHtml(String(microMatches.length))}</span>
              </div>
            </article>
          </aside>
        </section>
      </div>
    `;

    const searchInput = document.getElementById("feed-search");
    const resetButton = document.getElementById("reset-filters");

    searchInput.addEventListener("input", (event) => {
      state.query = event.target.value;
      render({ focusSearch: true });
    });

    resetButton.addEventListener("click", () => {
      state.query = "";
      state.category = "all";
      state.region = "all";
      state.format = "all";
      render();
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
      const nextInput = document.getElementById("feed-search");
      const length = nextInput.value.length;
      nextInput.focus();
      nextInput.setSelectionRange(length, length);
    }

    AIInsight.bindRefreshButtons(app, () => {
      AIInsight.refreshNews({ forceRefresh: true }).catch(() => {});
    });
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

  news = await AIInsight.getNews();
  render();
});

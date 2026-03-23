document.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("home-app");
  let news = [];

  await AIInsight.initShell("home");
  AIInsight.startAutoRefresh();

  function getCopy(language, meta, liveCount, totalCount, latestDate, sourceCount) {
    const providerCount = AIInsight.getProviderIds().length;

    return {
      zh: {
        eyebrow: "Global AI Briefing",
        title: "把实时资讯、原文来源和 AI 总结做成一个真正能用的全球 AI 新闻入口",
        lead: "这个版本会同时承载时事新闻、原文网址、编辑判断和 AI 摘要能力。用户既能快速看到发生了什么，也能立刻跳到原文，并按自己偏好的摘要引擎继续深挖。",
        primary: "进入实时资讯流",
        secondary: "搜索新闻主题",
        statusLead: meta.remoteConnected
          ? "站点已经接入远端 live 源，首页会继续混合站内精选和远端时事更新。"
          : "当前首页会先用站内结构化内容与官方种子快讯撑起主视图，接上后端后会自动扩成真正的实时模式。",
        stats: [
          {
            label: "实时条目",
            value: `${liveCount}`,
            copy: "实时层已经不只是一排卡片，而是首页第一层的时事入口。"
          },
          {
            label: "全站条目",
            value: `${totalCount}`,
            copy: "实时快讯、结构化简报和专业来源提示已经开始合并。"
          },
          {
            label: "最近刷新",
            value: latestDate,
            copy: "统一展示绝对日期和时间，全球用户不容易误读。"
          },
          {
            label: "专业来源",
            value: `${sourceCount}`,
            copy: "权威期刊、会议和预印本都能从专业入口继续深挖。"
          },
          {
            label: "摘要引擎",
            value: `${providerCount}`,
            copy: "支持 OpenAI / ChatGPT 与 DeepSeek 两条摘要路径。"
          },
          {
            label: "内容结构",
            value: `${AIInsight.categories.length - 1}`,
            copy: "模型、算力、产品、研究、机器人与政策统一呈现。"
          }
        ],
        featuredLabel: "实时主线",
        liveTitle: "实时资讯流",
        liveNote: "每条都带原文网址，适合快速判断后继续深读。",
        briefsTitle: "深度简报",
        briefsNote: "把时事新闻之外更有判断力的分析内容放在第二层。",
        engineTitle: "摘要引擎",
        engineNote: "用户可以根据预算和偏好，选择更完整的 ChatGPT 路线或更轻量的 DeepSeek 路线。",
        sourceDeskTitle: "权威期刊、会议与专业源",
        sourceDeskNote: "给更专业的用户准备的入口，直接通往顶级期刊、开放获取来源、会议论文和预印本。"
      },
      en: {
        eyebrow: "Global AI Briefing",
        title: "Turn live news, source links, and AI summaries into a real global AI destination",
        lead: "This version combines timely news, original source URLs, editorial judgment, and AI-generated summaries so readers can scan what changed, jump to the source, and continue with the summary engine they prefer.",
        primary: "Open the live feed",
        secondary: "Search news topics",
        statusLead: meta.remoteConnected
          ? "A remote live source is connected, and the homepage now blends it with in-house curated coverage."
          : "The homepage is still anchored by structured in-house coverage and official seed updates, and it will become truly live once the backend endpoint is connected.",
        stats: [
          {
            label: "Live briefs",
            value: `${liveCount}`,
            copy: "The live layer now acts as the first editorial surface rather than a decorative add-on."
          },
          {
            label: "All briefs",
            value: `${totalCount}`,
            copy: "Live updates, structured briefs, and professional-source prompts are beginning to merge."
          },
          {
            label: "Last refresh",
            value: latestDate,
            copy: "Absolute dates and times keep the experience globally legible."
          },
          {
            label: "Professional sources",
            value: `${sourceCount}`,
            copy: "Journals, conferences, and preprints remain one click away for deeper work."
          },
          {
            label: "Summary engines",
            value: `${providerCount}`,
            copy: "Readers can choose between OpenAI / ChatGPT and DeepSeek for summaries."
          },
          {
            label: "Coverage lanes",
            value: `${AIInsight.categories.length - 1}`,
            copy: "Models, compute, products, research, robotics, and policy live in one structure."
          }
        ],
        featuredLabel: "Live lead",
        liveTitle: "Live feed",
        liveNote: "Every brief includes a source link so readers can move from summary to original reporting instantly.",
        briefsTitle: "Deep briefs",
        briefsNote: "A second layer for more interpretive editorial coverage beyond breaking updates.",
        engineTitle: "Summary engines",
        engineNote: "Readers can choose between a more polished ChatGPT route and a lighter, lower-cost DeepSeek route.",
        sourceDeskTitle: "Journals, conferences, and professional sources",
        sourceDeskNote: "A dedicated path for expert readers, with direct routes into top journals, open-access sources, conference proceedings, and preprint feeds."
      }
    }[language];
  }

  function render() {
    const language = AIInsight.getLanguage();
    const meta = AIInsight.getNewsMeta();

    if (!news.length) {
      document.title = "AI Insight";
      app.innerHTML = `
        <div class="page-shell">
          ${AIInsight.createRefreshStatusCard(meta, language)}
          ${AIInsight.createEmptyState(
            language === "zh" ? "内容准备中" : "Coverage is loading",
            language === "zh"
              ? "当前还没有可展示的资讯条目。接入远端 live 数据后，这里会成为首页主视图。"
              : "There are no briefs to display yet. Once remote live data is connected, this becomes the main homepage surface."
          )}
        </div>
      `;
      AIInsight.bindRefreshButtons(app, () => {
        AIInsight.refreshNews({ forceRefresh: true }).catch(() => {});
      });
      return;
    }

    const liveStories = AIInsight.getLiveStories(news).filter((item) => !AIInsight.isMicroStory(item)).slice(0, 6);
    const microStories = AIInsight.getMicroStories(news).slice(0, 6);
    const headlineStories = AIInsight.getHeadlineStories(news);
    const editorialStories = AIInsight.getEditorialStories(news);
    const researchSources = AIInsight.getJournalSources().slice(0, 6);
    const featured = liveStories[0] || editorialStories.find((item) => item.featured) || headlineStories[0] || news[0];
    const topEditorial = (editorialStories.length ? editorialStories : headlineStories).slice(0, 4);
    const latestDate = AIInsight.formatDateTime(meta.refreshedAt || news[0].date, language);
    const pageCopy = getCopy(language, meta, AIInsight.getLiveStories(news).length, news.length, latestDate, AIInsight.getJournalSources().length);
    const quickRoutes = language === "zh"
      ? [
          {
            title: "实时新闻",
            note: "优先看带原文链接的最新动态，适合快速扫一遍行业变化。",
            href: "list.html?format=live"
          },
          {
            title: "深度简报",
            note: "跳到编辑整理过的结构化内容，更适合系统理解。",
            href: "list.html?format=briefs"
          },
          {
            title: "工具与开源",
            note: "集中看小新闻、热门工具、GitHub 项目和产品发布。",
            href: "list.html?format=tools"
          },
          {
            title: "研究来源",
            note: "直接进入期刊、会议和预印本入口，适合更专业的阅读路径。",
            href: "sources.html"
          }
        ]
      : [
          {
            title: "Live news",
            note: "Start with the newest source-linked updates for a fast scan of what changed.",
            href: "list.html?format=live"
          },
          {
            title: "Deep briefs",
            note: "Jump into more structured editorial coverage for higher-context reading.",
            href: "list.html?format=briefs"
          },
          {
            title: "Tools & OSS",
            note: "Focus on small news, hot tools, GitHub projects, and product launches.",
            href: "list.html?format=tools"
          },
          {
            title: "Research desk",
            note: "Move directly into journals, conferences, and preprint sources.",
            href: "sources.html"
          }
        ];
    const toolRadarTitle = language === "zh" ? "工具与开源 Radar" : "Launches & OSS Radar";
    const toolRadarNote = language === "zh"
      ? "补上小新闻、热门 AI 工具、GitHub 高信号项目和版本更新，让首页不仅看大公司，也能看见开发者生态。"
      : "A compact layer for small news, hot AI tools, GitHub projects, and release signals so the homepage covers more than just large-company headlines.";
    const proDeskTitle = language === "zh" ? "专业版信息台" : "Pro desk";
    const proDeskMetrics = [
      {
        value: String(liveStories.length),
        label: language === "zh" ? "主线快讯" : "lead updates"
      },
      {
        value: String(microStories.length),
        label: language === "zh" ? "工具信号" : "tool signals"
      },
      {
        value: String(researchSources.length),
        label: language === "zh" ? "专业来源" : "research sources"
      }
    ];

    document.title = language === "zh" ? "AI Insight | 全球 AI 实时资讯情报台" : "AI Insight | Global AI live intelligence desk";

    app.innerHTML = `
      <div class="page-shell">
        <section class="hero page-fade">
          <div class="hero-grid">
            <div>
              <span class="eyebrow">${AIInsight.escapeHtml(pageCopy.eyebrow)}</span>
              <h1>${AIInsight.escapeHtml(pageCopy.title)}</h1>
              <p class="lead">${AIInsight.escapeHtml(pageCopy.lead)}</p>
              <div class="hero-actions">
                <a class="button button-primary" href="list.html">${AIInsight.escapeHtml(pageCopy.primary)}</a>
                <a class="button button-secondary" href="search.html">${AIInsight.escapeHtml(pageCopy.secondary)}</a>
              </div>
            </div>

            <article class="featured-panel panel">
              <div>
                <div class="featured-topline">
                  ${AIInsight.isLiveItem(featured) ? `<span class="badge badge-live">${AIInsight.escapeHtml(AIInsight.t("common.live", language))}</span>` : ""}
                  <span class="${AIInsight.getBadgeClass(featured.signal)}">${AIInsight.escapeHtml(AIInsight.getSignalLabel(featured.signal, language))}</span>
                  <span class="ghost-badge">${AIInsight.escapeHtml(pageCopy.featuredLabel)}</span>
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
                  AIInsight.isLiveItem(featured) ? AIInsight.t("common.sourceBacked", language) : AIInsight.t("common.summarySeed", language),
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
            ${pageCopy.stats
              .map(
                (stat) => `
                  <article class="stat-card page-fade">
                    <span class="stat-label">${AIInsight.escapeHtml(stat.label)}</span>
                    <div class="stat-value">${AIInsight.escapeHtml(stat.value)}</div>
                    <p class="stat-copy">${AIInsight.escapeHtml(stat.copy)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(language === "zh" ? "快速进入你想看的视图" : "Jump straight into the view you want")}</h2>
              <p class="section-note">${AIInsight.escapeHtml(language === "zh" ? "把首页当成路由台，而不是把所有内容都塞进同一个混合入口。" : "Use the homepage as a routing surface instead of forcing every reader into one mixed stream.")}</p>
            </div>
          </div>
          <div class="promise-grid">
            ${quickRoutes
              .map(
                (route) => `
                  <article class="promise-card page-fade">
                    <span class="meta-label">${AIInsight.escapeHtml(language === "zh" ? "阅读路径" : "Reading path")}</span>
                    <h3>${AIInsight.escapeHtml(route.title)}</h3>
                    <p>${AIInsight.escapeHtml(route.note)}</p>
                    <a class="button button-secondary" href="${AIInsight.escapeHtml(route.href)}">${AIInsight.escapeHtml(language === "zh" ? "直接打开" : "Open now")}</a>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(pageCopy.liveTitle)}</h2>
              <p class="section-note">${AIInsight.escapeHtml(pageCopy.liveNote)}</p>
            </div>
          </div>
          <div class="story-grid feed-grid">
            ${liveStories.length ? liveStories.map((item) => AIInsight.createStoryCard(item, { language })).join("") : AIInsight.createEmptyState(pageCopy.liveTitle, pageCopy.liveNote)}
          </div>
        </section>

        <section class="section">
          <div class="section-head section-head-split">
            <div>
              <h2>${AIInsight.escapeHtml(toolRadarTitle)}</h2>
              <p class="section-note">${AIInsight.escapeHtml(toolRadarNote)}</p>
            </div>
            <article class="pro-desk-card pro-only page-fade">
              <span class="meta-label">${AIInsight.escapeHtml(proDeskTitle)}</span>
              <div class="pro-desk-metrics">
                ${proDeskMetrics
                  .map(
                    (metric) => `
                      <div class="pro-desk-metric">
                        <strong>${AIInsight.escapeHtml(metric.value)}</strong>
                        <span>${AIInsight.escapeHtml(metric.label)}</span>
                      </div>
                    `
                  )
                  .join("")}
              </div>
              <div class="story-links">
                <a class="story-link" href="sources.html">${AIInsight.escapeHtml(AIInsight.t("nav.sources", language))}</a>
                <a class="story-link" href="radar.html">${AIInsight.escapeHtml(AIInsight.t("nav.radar", language))}</a>
              </div>
            </article>
          </div>
          <div class="signal-grid">
            ${microStories.length ? microStories.map((item) => AIInsight.createSignalCard(item, { language })).join("") : AIInsight.createEmptyState(toolRadarTitle, toolRadarNote)}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(pageCopy.briefsTitle)}</h2>
              <p class="section-note">${AIInsight.escapeHtml(pageCopy.briefsNote)}</p>
            </div>
          </div>
          <div class="story-grid">
            ${topEditorial.map((item) => AIInsight.createStoryCard(item, { language, compact: true })).join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(pageCopy.engineTitle)}</h2>
              <p class="section-note">${AIInsight.escapeHtml(pageCopy.engineNote)}</p>
            </div>
          </div>
          <div class="provider-grid">
            ${AIInsight.createProviderCards(language)}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(pageCopy.sourceDeskTitle)}</h2>
              <p class="section-note">${AIInsight.escapeHtml(pageCopy.sourceDeskNote)}</p>
            </div>
            <a class="button button-secondary" href="sources.html">${AIInsight.escapeHtml(AIInsight.t("nav.sources", language))}</a>
          </div>
          <div class="journal-grid">
            ${researchSources.map((item) => AIInsight.createJournalCard(item, language)).join("")}
          </div>
        </section>
      </div>
    `;

    AIInsight.bindRefreshButtons(app, () => {
      AIInsight.refreshNews({ forceRefresh: true }).catch(() => {});
    });
    AIInsight.bindStoryCards(app);
    AIInsight.bindSaveButtons(app, render);
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

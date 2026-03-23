document.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("radar-app");
  let news = [];
  const state = {
    query: "",
    category: "all",
    region: "all"
  };

  await AIInsight.initShell("radar");
  AIInsight.startAutoRefresh();

  function sourceMatchesTopic(source, topic) {
    const haystack = [
      source.title.zh,
      source.title.en,
      source.publisher,
      source.bestFor.zh,
      source.bestFor.en,
      source.coverage.zh,
      source.coverage.en,
      source.latestNote.zh,
      source.latestNote.en,
      (source.tags || []).join(" ")
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(String(topic.query || "").toLowerCase());
  }

  function getSourceMatches(topic) {
    return AIInsight.getJournalSources().filter((source) => sourceMatchesTopic(source, topic)).slice(0, 3);
  }

  function getCopy(language, meta, trackedCount, storyCount, sourceCount) {
    return {
      zh: {
        eyebrow: "Signal Radar",
        title: "把你真正关心的 AI 主题做成持续追踪雷达",
        lead: "这里不是简单收藏，而是主动定义你要长期追的方向。你可以关注公司、技术路线、赛道或区域，然后让站点自动把相关新闻和专业来源重新组织给你。",
        statusLead: meta.remoteConnected
          ? "Radar 现在会跟着远端 live 源一起刷新，所以它已经开始具备真正的持续追踪能力。"
          : "Radar 当前仍基于站内内容和官方种子快讯，接上远端 live 后会更像一个真正的情报终端。",
        addLabel: "新增关注主题",
        addPlaceholder: "例如：OpenAI、agent、安全评测、AI cloud、India",
        categoryLabel: "关注赛道",
        regionLabel: "关注区域",
        addAction: AIInsight.t("common.trackTopic", language),
        stats: [
          {
            label: "关注主题",
            value: `${trackedCount}`,
            copy: "你定义的主题会持续影响 Radar 和 Briefing。"
          },
          {
            label: "匹配新闻",
            value: `${storyCount}`,
            copy: "站点会优先把这些主题相关的新闻重新组织出来。"
          },
          {
            label: "匹配来源",
            value: `${sourceCount}`,
            copy: "专业来源会帮助你把新闻阅读延伸到研究层。"
          }
        ],
        listTitle: "你的追踪主题",
        listNote: "每个主题下面都会挂上匹配的新闻和推荐专业来源。",
        emptyTitle: "先添加一个你想长期追踪的主题",
        emptyBody: "从公司、模型、政策、应用赛道或区域开始都可以。这里更像你的个人 AI 情报雷达，而不是普通收藏夹。",
        openSearch: "去搜索页",
        openBriefing: "打开 My Briefing",
        sourceDesk: "推荐专业来源",
        matchedStories: "匹配新闻"
      },
      en: {
        eyebrow: "Signal Radar",
        title: "Turn the AI themes you actually care about into a persistent tracking radar",
        lead: "This is more than bookmarking. It lets readers define the companies, technologies, lanes, or regions they want to keep following, then reorganizes relevant stories and professional sources around those choices.",
        statusLead: meta.remoteConnected
          ? "Radar is now refreshing with the remote live source, so it behaves much more like a real monitoring desk."
          : "Radar is still built on in-house coverage and official seed updates, and it becomes much closer to a real intelligence surface once the live backend is connected.",
        addLabel: "Add a tracked topic",
        addPlaceholder: "Try: OpenAI, agents, safety evals, AI cloud, India",
        categoryLabel: "Track lane",
        regionLabel: "Track region",
        addAction: AIInsight.t("common.trackTopic", language),
        stats: [
          {
            label: "Tracked topics",
            value: `${trackedCount}`,
            copy: "These themes start shaping both Radar and My Briefing."
          },
          {
            label: "Matched stories",
            value: `${storyCount}`,
            copy: "The site is reorganizing relevant stories around your tracked themes."
          },
          {
            label: "Matched sources",
            value: `${sourceCount}`,
            copy: "Professional sources help extend the workflow from news into research."
          }
        ],
        listTitle: "Your tracked themes",
        listNote: "Each theme gets its own stream of matched stories and recommended sources.",
        emptyTitle: "Start with one theme you want to follow over time",
        emptyBody: "A company, model, policy issue, application lane, or region is enough. Think of this page as your personal AI signal desk rather than a normal bookmark list.",
        openSearch: "Open Search",
        openBriefing: "Open My Briefing",
        sourceDesk: "Recommended source desks",
        matchedStories: "Matched stories"
      }
    }[language];
  }

  function render() {
    const language = AIInsight.getLanguage();
    const meta = AIInsight.getNewsMeta();
    const trackedTopics = AIInsight.getTrackedTopics();
    const bundles = AIInsight.getTrackedTopicBundles(news, { limitPerTopic: 4 });
    const topTags = AIInsight.getTopTags(news, 10);
    const sourceMatchCount = bundles.reduce((sum, bundle) => sum + getSourceMatches(bundle.topic).length, 0);
    const storyMatchCount = bundles.reduce((sum, bundle) => sum + bundle.stories.length, 0);
    const pageCopy = getCopy(language, meta, trackedTopics.length, storyMatchCount, sourceMatchCount);
    const addTracked = AIInsight.isTopicTracked(state.query, state.category, state.region);

    document.title = language === "zh" ? "AI Insight | Signal Radar" : "AI Insight | Signal Radar";

    app.innerHTML = `
      <div class="page-shell">
        <section class="hero page-fade">
          <span class="eyebrow">${AIInsight.escapeHtml(pageCopy.eyebrow)}</span>
          <h1>${AIInsight.escapeHtml(pageCopy.title)}</h1>
          <p class="lead">${AIInsight.escapeHtml(pageCopy.lead)}</p>
          <div class="tag-row">
            ${
              trackedTopics.length
                ? trackedTopics
                    .slice(0, 4)
                    .map((topic) => `<span class="tag">${AIInsight.escapeHtml(AIInsight.getTopicLabel(topic, language))}</span>`)
                    .join("")
                : topTags.slice(0, 4).map((tag) => `<span class="tag">${AIInsight.escapeHtml(tag)}</span>`).join("")
            }
          </div>
        </section>

        ${AIInsight.createRefreshStatusCard(meta, language, { lead: pageCopy.statusLead })}

        <section class="panel control-panel page-fade topic-builder">
          <div class="control-group">
            <label class="control-label" for="radar-query">${AIInsight.escapeHtml(pageCopy.addLabel)}</label>
            <input
              id="radar-query"
              class="search-input"
              type="search"
              value="${AIInsight.escapeHtml(state.query)}"
              placeholder="${AIInsight.escapeHtml(pageCopy.addPlaceholder)}"
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

          <div class="control-actions">
            <button
              class="button button-primary"
              type="button"
              id="radar-submit"
              ${state.query.trim() ? "" : "disabled"}
            >
              ${AIInsight.escapeHtml(addTracked ? AIInsight.t("common.trackedTopic", language) : pageCopy.addAction)}
            </button>
          </div>
        </section>

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

        ${
          trackedTopics.length
            ? `
              <section class="section">
                <div class="section-head">
                  <div>
                    <h2>${AIInsight.escapeHtml(pageCopy.listTitle)}</h2>
                    <p class="section-note">${AIInsight.escapeHtml(pageCopy.listNote)}</p>
                  </div>
                  <div class="topic-panel-actions">
                    <a class="button button-secondary" href="search.html">${AIInsight.escapeHtml(pageCopy.openSearch)}</a>
                    <a class="button button-secondary" href="briefing.html">${AIInsight.escapeHtml(pageCopy.openBriefing)}</a>
                  </div>
                </div>

                <div class="topic-stack">
                  ${bundles
                    .map((bundle) => {
                      const sources = getSourceMatches(bundle.topic);
                      return `
                        <article class="radar-card page-fade">
                          <div class="topic-panel-head">
                            <div>
                              <span class="meta-label">Radar</span>
                              <h3>${AIInsight.escapeHtml(AIInsight.getTopicLabel(bundle.topic, language))}</h3>
                              <p class="panel-text">${AIInsight.escapeHtml(`${pageCopy.matchedStories}: ${bundle.stories.length}`)}</p>
                            </div>
                            <div class="topic-panel-actions">
                              <a class="button button-secondary" href="search.html?q=${encodeURIComponent(bundle.topic.query)}">${AIInsight.escapeHtml(pageCopy.openSearch)}</a>
                              <button
                                class="save-btn is-saved"
                                type="button"
                                data-track-id="${AIInsight.escapeHtml(bundle.topic.id)}"
                                data-track-remove="true"
                              >
                                ${AIInsight.escapeHtml(AIInsight.t("common.removeTopic", language))}
                              </button>
                            </div>
                          </div>

                          ${
                            sources.length
                              ? `
                                <div class="topic-source-list">
                                  <span class="meta-label">${AIInsight.escapeHtml(pageCopy.sourceDesk)}</span>
                                  <div class="tag-row">
                                    ${sources
                                      .map(
                                        (source) => `
                                          <a class="ghost-badge" href="${AIInsight.escapeHtml(source.url)}"${AIInsight.getExternalLinkAttributes()}>
                                            ${AIInsight.escapeHtml(AIInsight.localize(source.title, language))}
                                          </a>
                                        `
                                      )
                                      .join("")}
                                  </div>
                                </div>
                              `
                              : ""
                          }

                          ${
                            bundle.stories.length
                              ? `
                                <div class="story-grid feed-grid">
                                  ${bundle.stories.map((item) => AIInsight.createStoryCard(item, { language, compact: true })).join("")}
                                </div>
                              `
                              : AIInsight.createEmptyState(pageCopy.matchedStories, pageCopy.emptyBody)
                          }
                        </article>
                      `;
                    })
                    .join("")}
                </div>
              </section>
            `
            : `
              <section class="section">
                ${AIInsight.createEmptyState(pageCopy.emptyTitle, pageCopy.emptyBody)}
                <div class="section topic-suggestion-row">
                  <div class="chip-row">
                    ${AIInsight.createTagButtons(topTags)}
                  </div>
                </div>
              </section>
            `
        }
      </div>
    `;

    const queryInput = document.getElementById("radar-query");
    const submitButton = document.getElementById("radar-submit");

    queryInput.addEventListener("input", (event) => {
      state.query = event.target.value;
      render();
    });

    submitButton.addEventListener("click", () => {
      if (!state.query.trim()) {
        return;
      }

      AIInsight.toggleTrackedTopic({
        query: state.query,
        label: state.query,
        category: state.category,
        region: state.region
      });

      state.query = "";
      state.category = "all";
      state.region = "all";
      render();
    });

    AIInsight.bindChoiceButtons(app, (group, value) => {
      state[group] = value;
      render();
    });

    AIInsight.bindTagButtons(app, (tag) => {
      state.query = tag;
      render();
    });

    AIInsight.bindRefreshButtons(app, () => {
      AIInsight.refreshNews({ forceRefresh: true }).catch(() => {});
    });
    AIInsight.bindTrackButtons(app, render);
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
  document.addEventListener("ai-insight:tracked-topics", render);

  news = await AIInsight.getNews();
  render();
});

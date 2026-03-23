document.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("briefing-app");
  let news = [];
  const preference = AIInsight.getSummaryPreference();
  const digestState = {
    provider: preference.provider,
    model: preference.model,
    loading: false,
    summaryText: "",
    summaryState: "idle",
    summaryLanguage: ""
  };

  await AIInsight.initShell("briefing");
  AIInsight.startAutoRefresh();

  function dedupeStories(items) {
    const seen = new Set();

    return items.filter((item) => {
      const key = String(item.id);
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  function getStatusMessage(language) {
    if (digestState.summaryState === "ready") {
      return AIInsight.t("common.summaryReady", language);
    }

    if (digestState.summaryState === "fallback") {
      return AIInsight.t("common.summaryFallback", language);
    }

    if (digestState.summaryState === "error") {
      return AIInsight.t("common.summaryError", language);
    }

    return AIInsight.t("common.configureBackend", language);
  }

  function buildDigestStory(savedStories, trackedTopics, radarStories, liveStories, language) {
    const candidates = dedupeStories([...savedStories, ...radarStories, ...liveStories, ...news]).slice(0, 6);
    const trackedZh = trackedTopics.slice(0, 3).map((topic) => AIInsight.getTopicLabel(topic, "zh")).join("、");
    const trackedEn = trackedTopics.slice(0, 3).map((topic) => AIInsight.getTopicLabel(topic, "en")).join(", ");
    const topZhTitles = candidates.slice(0, 3).map((item) => `《${AIInsight.localize(item.title, "zh")}》`).join("、");
    const topEnTitles = candidates.slice(0, 3).map((item) => `"${AIInsight.localize(item.title, "en")}"`).join(", ");
    const fallbackZh = trackedTopics.length
      ? `今天的简报优先围绕 ${trackedZh} 展开。最值得先看的内容是 ${topZhTitles || "站内重点新闻"}，建议先看 Radar 匹配新闻，再回到实时资讯流补足全局变化。`
      : `今天的简报优先整合你收藏和站内高信号内容。最值得先看的内容是 ${topZhTitles || "站内重点新闻"}，如果时间有限，先看实时推荐再补深度简报。`;
    const fallbackEn = trackedTopics.length
      ? `Today's briefing is anchored around ${trackedEn}. Start with ${topEnTitles || "the highest-signal site coverage"}, then move from Radar-matched stories back into the live feed for broader context.`
      : `Today's briefing combines your saved stories with the site's highest-signal coverage. Start with ${topEnTitles || "the top site coverage"}, then move from live recommendations into deeper briefs if you want more context.`;

    return {
      story: {
        id: "briefing-digest",
        slug: "briefing-digest",
        featured: true,
        live: false,
        category: "products",
        region: "global",
        signal: "frontier",
        date: new Date().toISOString().slice(0, 10),
        sourceName: "AI Insight Briefing",
        sourceType: "editorial",
        sourceUrl: "",
        readingTime: 4,
        tags: dedupeStories(candidates).slice(0, 4).map((item) => item.sourceName || item.source).filter(Boolean),
        title: {
          zh: "今日 AI Briefing",
          en: "Today's AI Briefing"
        },
        deck: {
          zh: `汇总 ${candidates.length} 条高优先级内容，覆盖收藏、Radar 主题与实时资讯。`,
          en: `A high-priority wrap of ${candidates.length} stories across saves, Radar themes, and live coverage.`
        },
        summaryPoints: {
          zh: candidates.slice(0, 3).map((item) => AIInsight.localize(item.title, "zh")),
          en: candidates.slice(0, 3).map((item) => AIInsight.localize(item.title, "en"))
        },
        editorialSummary: {
          zh: fallbackZh,
          en: fallbackEn
        },
        aiSummary: null,
        insight: {
          zh: fallbackZh,
          en: fallbackEn
        },
        who: {
          zh: "需要快速把握今天 AI 重点变化的产品、投资、研究和战略团队",
          en: "Product, investment, research, and strategy teams that need a fast read on today's AI priorities"
        },
        watchpoint: {
          zh: "继续看哪些主题在你的 Radar 中反复出现，以及哪些官方源开始集中释放新信号。",
          en: "Watch which themes keep recurring in your Radar and which official sources are starting to cluster around new signals."
        },
        content: {
          zh: candidates.map(
            (item, index) =>
              `${index + 1}. ${AIInsight.localize(item.title, "zh")} | ${item.sourceName || item.source || "AI Insight"} | ${AIInsight.formatDate(item.date, "zh")} | ${AIInsight.localize(item.insight, "zh") || AIInsight.localize(item.deck, "zh")}`
          ),
          en: candidates.map(
            (item, index) =>
              `${index + 1}. ${AIInsight.localize(item.title, "en")} | ${item.sourceName || item.source || "AI Insight"} | ${AIInsight.formatDate(item.date, "en")} | ${AIInsight.localize(item.insight, "en") || AIInsight.localize(item.deck, "en")}`
          )
        }
      },
      candidates,
      fallback: language === "zh" ? fallbackZh : fallbackEn
    };
  }

  function getCopy(language, meta, savedCount, trackedCount, sourceCount, liveCount) {
    return {
      zh: {
        eyebrow: "My Briefing",
        title: "为你整理的 AI 每日 Briefing",
        lead: "这一页会优先聚合你收藏过的文章、关注的主题、与你兴趣更接近的实时新闻，以及你保存的专业来源。现在先用本地个性化做第一层，后面接登录后可以继续同步到云端。",
        syncGuest: "你现在还是本地个性化模式，登录后收藏、Radar 和每日 Briefing 设置都可以跨设备同步。",
        syncUser: "你的 Briefing 已经接入账号同步，后续收藏和 Radar 变化会自动影响这里的排序和结构。",
        syncAction: "打开账号",
        statusLead: meta.remoteConnected
          ? "你的 Briefing 现在会跟着远端 live 源更新，所以它已经开始更像一个真正的个人情报台。"
          : "你的 Briefing 目前还是建立在站内种子内容和本地收藏之上，接上 live backend 后会继续长成真正的每日情报流。",
        digestTitle: "今日总览",
        digestNote: "用你已经表现出来的偏好，把今天最值得看的内容先压缩成一个高密度入口。",
        digestEngine: "简报摘要引擎",
        stats: [
          {
            label: "已收藏文章",
            value: `${savedCount}`,
            copy: "你收藏的内容会优先影响个性化排序。"
          },
          {
            label: "关注主题",
            value: `${trackedCount}`,
            copy: "你主动定义的 Radar 主题会持续影响推荐内容。"
          },
          {
            label: "关注来源",
            value: `${sourceCount}`,
            copy: "专业来源会被整理成你自己的研究入口。"
          },
          {
            label: "推荐实时新闻",
            value: `${liveCount}`,
            copy: "根据你的收藏和 Radar 偏好优先给出更相关的时事更新。"
          }
        ],
        fallbackTitle: "先从全站重点开始",
        fallbackBody: "你目前的收藏和关注主题还不够多，所以我先用全站最值得看的内容给你占位。再多保存几篇、追几个主题之后，这个页面就会越来越像你自己的情报台。",
        radarTitle: "你的 Radar 主题",
        radarNote: "这些是你主动想持续追踪的方向，会优先影响后续匹配结果。",
        radarStoriesTitle: "Radar 匹配到的重点新闻",
        radarStoriesNote: "这些内容来自你关注的公司、技术、区域或赛道。",
        openRadar: "打开 Radar",
        noRadar: "你还没有关注任何主题，先去 Radar 页加几个你想长期追踪的方向。"
      },
      en: {
        eyebrow: "My Briefing",
        title: "An AI daily briefing shaped around your interests",
        lead: "This page prioritizes stories you saved, topics you actively track, live updates that better match your interests, and the professional sources you chose to follow. For now it runs on local personalization, and later it can sync to the cloud once login is added.",
        syncGuest: "You are still in local personalization mode. Sign in to sync saves, Radar themes, and daily briefing settings across devices.",
        syncUser: "Your briefing is now connected to account sync, so new saves and Radar changes will keep reshaping this page automatically.",
        syncAction: "Open Account",
        statusLead: meta.remoteConnected
          ? "Your briefing now refreshes with the remote live source, which makes it feel more like a real personal intelligence desk."
          : "Your briefing is still built on seeded in-house content and local saves; once the live backend is connected, it can grow into a more real daily intelligence stream.",
        digestTitle: "Today's Brief",
        digestNote: "A compressed, high-signal entry point built from the preferences you have already expressed.",
        digestEngine: "Briefing summary engine",
        stats: [
          {
            label: "Saved stories",
            value: `${savedCount}`,
            copy: "Your bookmarks start shaping the ranking and recommendations here."
          },
          {
            label: "Tracked topics",
            value: `${trackedCount}`,
            copy: "Radar themes give the site a stronger sense of what you want to keep following."
          },
          {
            label: "Tracked sources",
            value: `${sourceCount}`,
            copy: "Your professional sources are grouped into a more personal research desk."
          },
          {
            label: "Live recommendations",
            value: `${liveCount}`,
            copy: "Live coverage is biased toward your saved items and Radar preferences."
          }
        ],
        fallbackTitle: "Starting with the site-wide highlights",
        fallbackBody: "You have not saved or tracked enough yet, so the page is using the broadest high-signal coverage as a starting point. As you add more intent, this briefing will become much more personal.",
        radarTitle: "Your Radar themes",
        radarNote: "These are the directions you explicitly want to keep following over time.",
        radarStoriesTitle: "High-priority stories matched by Radar",
        radarStoriesNote: "These stories come from the companies, technologies, regions, and lanes you chose to track.",
        openRadar: "Open Radar",
        noRadar: "You are not tracking any topics yet. Start by adding a few long-term themes on the Radar page."
      }
    }[language];
  }

  function render() {
    const language = AIInsight.getLanguage();
    const meta = AIInsight.getNewsMeta();
    const account = AIInsight.getAccountState();

    if (!news.length) {
      document.title = "AI Insight";
      app.innerHTML = `
        <div class="page-shell">
          ${AIInsight.createRefreshStatusCard(meta, language)}
          ${AIInsight.createEmptyState(
            language === "zh" ? "Briefing 内容准备中" : "Briefing is loading",
            language === "zh"
              ? "当前还没有足够的内容生成你的个性化 Briefing。接入实时内容后，这里会成为你的每日入口。"
              : "There is not enough content yet to build your personalized briefing. Once live coverage is connected, this becomes your daily entry point."
          )}
        </div>
      `;
      AIInsight.bindRefreshButtons(app, () => {
        AIInsight.refreshNews({ forceRefresh: true }).catch(() => {});
      });
      return;
    }

    const savedStories = AIInsight.getSavedStories(news);
    const savedSources = AIInsight.getSavedSources();
    const trackedTopics = AIInsight.getTrackedTopics();
    const preferredCategories = AIInsight.getPreferredCategories(news);
    const radarStories = AIInsight.getTrackedTopicFeed(news, 6).filter(
      (item) => !savedStories.some((saved) => String(saved.id) === String(item.id))
    );
    const personalizedLive = AIInsight.getPersonalizedLiveStories(news, 4).filter(
      (item) => !savedStories.some((saved) => String(saved.id) === String(item.id))
    );
    const fallbackStories = news.slice(0, 4);
    const pageCopy = getCopy(
      language,
      meta,
      savedStories.length,
      trackedTopics.length,
      savedSources.length,
      personalizedLive.length || fallbackStories.length
    );
    const digest = buildDigestStory(savedStories, trackedTopics, radarStories, personalizedLive.length ? personalizedLive : fallbackStories, language);
    const briefingStories = savedStories.length ? savedStories : fallbackStories;
    const briefingLiveStories = personalizedLive.length ? personalizedLive : AIInsight.getLiveStories(news).slice(0, 4);
    const briefingSources = savedSources.length ? savedSources : AIInsight.getJournalSources().slice(0, 4);
    const providerMeta = AIInsight.getProviderMeta(digestState.provider);
    const models = providerMeta.models;
    const digestSummary =
      digestState.summaryLanguage === language && digestState.summaryText
        ? digestState.summaryText
        : AIInsight.localize(digest.story.editorialSummary, language);

    if (!models.includes(digestState.model)) {
      digestState.model = models[0];
      AIInsight.setSummaryPreference(digestState.provider, digestState.model);
    }

    document.title = language === "zh" ? "AI Insight | 我的 Briefing" : "AI Insight | My Briefing";

    app.innerHTML = `
      <div class="page-shell">
        <section class="hero briefing-hero page-fade">
          <span class="eyebrow">${AIInsight.escapeHtml(AIInsight.t("common.personalized", language))}</span>
          <h1>${AIInsight.escapeHtml(pageCopy.title)}</h1>
          <p class="lead">${AIInsight.escapeHtml(pageCopy.lead)}</p>
          <div class="tag-row">
            ${
              trackedTopics.length
                ? trackedTopics
                    .slice(0, 3)
                    .map((topic) => `<span class="tag">${AIInsight.escapeHtml(AIInsight.getTopicLabel(topic, language))}</span>`)
                    .join("")
                : preferredCategories.length
                  ? preferredCategories
                      .slice(0, 3)
                      .map((category) => `<span class="tag">${AIInsight.escapeHtml(AIInsight.getCategoryLabel(category, language))}</span>`)
                      .join("")
                  : `<span class="tag">${AIInsight.escapeHtml(AIInsight.t("common.saveToBriefing", language))}</span>`
            }
            <span class="tag">${AIInsight.escapeHtml(AIInsight.localize(providerMeta.label, language))}</span>
            <span class="tag">${AIInsight.escapeHtml(digestState.model)}</span>
          </div>
        </section>

        ${AIInsight.createRefreshStatusCard(meta, language, { lead: pageCopy.statusLead })}

        ${
          account.remoteEnabled
            ? `
              <section class="panel page-fade">
                <div class="section-head">
                  <div>
                    <span class="meta-label">Sync</span>
                    <p class="section-note">${AIInsight.escapeHtml(account.authenticated ? pageCopy.syncUser : pageCopy.syncGuest)}</p>
                  </div>
                  <a class="button button-secondary" href="account.html">${AIInsight.escapeHtml(pageCopy.syncAction)}</a>
                </div>
              </section>
            `
            : ""
        }

        <section class="section briefing-grid">
          <article class="article-block summary-box summary-box-ai page-fade briefing-digest">
            <div class="section-head">
              <div>
                <h2>${AIInsight.escapeHtml(pageCopy.digestTitle)}</h2>
                <p class="section-note">${AIInsight.escapeHtml(pageCopy.digestNote)}</p>
              </div>
            </div>

            <div class="summary-headline">
              <span class="meta-label">${AIInsight.escapeHtml(AIInsight.t("common.aiSummary", language))}</span>
              <span class="ghost-badge">${AIInsight.escapeHtml(AIInsight.localize(providerMeta.label, language))}</span>
            </div>
            <p>${AIInsight.escapeHtml(digestSummary)}</p>

            <ul class="summary-list">
              ${AIInsight.localize(digest.story.summaryPoints, language).map((point) => `<li>${AIInsight.escapeHtml(point)}</li>`).join("")}
            </ul>

            <div class="provider-form">
              <div class="field-grid">
                <div>
                  <label class="control-label" for="briefing-provider-select">${AIInsight.escapeHtml(AIInsight.t("common.chooseProvider", language))}</label>
                  <select id="briefing-provider-select" class="select-input">
                    ${AIInsight.getProviderIds()
                      .map((providerId) => {
                        const metaItem = AIInsight.getProviderMeta(providerId);
                        const selected = providerId === digestState.provider ? " selected" : "";
                        return `<option value="${AIInsight.escapeHtml(providerId)}"${selected}>${AIInsight.escapeHtml(AIInsight.localize(metaItem.label, language))}</option>`;
                      })
                      .join("")}
                  </select>
                </div>
                <div>
                  <label class="control-label" for="briefing-model-select">${AIInsight.escapeHtml(AIInsight.t("common.chooseModel", language))}</label>
                  <select id="briefing-model-select" class="select-input">
                    ${models
                      .map((modelId) => {
                        const selected = modelId === digestState.model ? " selected" : "";
                        return `<option value="${AIInsight.escapeHtml(modelId)}"${selected}>${AIInsight.escapeHtml(modelId)}</option>`;
                      })
                      .join("")}
                  </select>
                </div>
              </div>
              <p class="panel-text">${AIInsight.escapeHtml(AIInsight.localize(providerMeta.description, language))}</p>
              <div class="topic-panel-actions">
                <button class="button button-primary" type="button" id="generate-briefing-summary">${AIInsight.escapeHtml(digestState.loading ? AIInsight.t("common.generating", language) : AIInsight.t("common.generateSummary", language))}</button>
              </div>
              <p class="summary-status">${AIInsight.escapeHtml(getStatusMessage(language))}</p>
            </div>
          </article>
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
          !savedStories.length && !savedSources.length && !trackedTopics.length
            ? `
              <section class="section">
                ${AIInsight.createEmptyState(pageCopy.fallbackTitle, pageCopy.fallbackBody)}
              </section>
            `
            : ""
        }

        <section class="section briefing-grid">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(pageCopy.radarTitle)}</h2>
              <p class="section-note">${AIInsight.escapeHtml(pageCopy.radarNote)}</p>
            </div>
            <a class="button button-secondary" href="radar.html">${AIInsight.escapeHtml(pageCopy.openRadar)}</a>
          </div>
          ${
            trackedTopics.length
              ? `
                <div class="tag-row">
                  ${trackedTopics.map((topic) => `<span class="tag">${AIInsight.escapeHtml(AIInsight.getTopicLabel(topic, language))}</span>`).join("")}
                </div>
              `
              : AIInsight.createEmptyState(pageCopy.radarTitle, pageCopy.noRadar)
          }
        </section>

        <section class="section briefing-grid">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(AIInsight.t("common.briefingSaved", language))}</h2>
              <p class="section-note">${AIInsight.escapeHtml(AIInsight.t("common.briefingIntro", language))}</p>
            </div>
            <a class="button button-secondary" href="list.html">${AIInsight.escapeHtml(AIInsight.t("nav.feed", language))}</a>
          </div>
          <div class="story-grid feed-grid">
            ${briefingStories.length ? briefingStories.map((item) => AIInsight.createStoryCard(item, { language })).join("") : AIInsight.createEmptyState(AIInsight.t("common.myBriefing", language), AIInsight.t("common.noSavedStories", language))}
          </div>
        </section>

        <section class="section briefing-grid">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(pageCopy.radarStoriesTitle)}</h2>
              <p class="section-note">${AIInsight.escapeHtml(pageCopy.radarStoriesNote)}</p>
            </div>
            <a class="button button-secondary" href="radar.html">${AIInsight.escapeHtml(pageCopy.openRadar)}</a>
          </div>
          <div class="story-grid feed-grid">
            ${radarStories.length ? radarStories.map((item) => AIInsight.createStoryCard(item, { language, compact: true })).join("") : AIInsight.createEmptyState(pageCopy.radarStoriesTitle, pageCopy.noRadar)}
          </div>
        </section>

        <section class="section briefing-grid">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(AIInsight.t("common.briefingLive", language))}</h2>
              <p class="section-note">${AIInsight.escapeHtml(AIInsight.t("common.liveFeed", language))}</p>
            </div>
            <a class="button button-secondary" href="search.html">${AIInsight.escapeHtml(AIInsight.t("nav.search", language))}</a>
          </div>
          <div class="story-grid feed-grid">
            ${briefingLiveStories.map((item) => AIInsight.createStoryCard(item, { language })).join("")}
          </div>
        </section>

        <section class="section briefing-grid">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(AIInsight.t("common.briefingSources", language))}</h2>
              <p class="section-note">${AIInsight.escapeHtml(AIInsight.t("common.sourceDesk", language))}</p>
            </div>
            <a class="button button-secondary" href="sources.html">${AIInsight.escapeHtml(AIInsight.t("nav.sources", language))}</a>
          </div>
          <div class="journal-grid">
            ${briefingSources.length ? briefingSources.map((item) => AIInsight.createJournalCard(item, language)).join("") : AIInsight.createEmptyState(AIInsight.t("common.sourceDesk", language), AIInsight.t("common.noSavedSources", language))}
          </div>
        </section>
      </div>
    `;

    const providerSelect = document.getElementById("briefing-provider-select");
    const modelSelect = document.getElementById("briefing-model-select");
    const generateButton = document.getElementById("generate-briefing-summary");

    providerSelect.addEventListener("change", () => {
      digestState.provider = providerSelect.value;
      digestState.model = AIInsight.getProviderMeta(digestState.provider).defaultModel || AIInsight.getProviderMeta(digestState.provider).models[0];
      AIInsight.setSummaryPreference(digestState.provider, digestState.model);
      render();
    });

    modelSelect.addEventListener("change", () => {
      digestState.model = modelSelect.value;
      AIInsight.setSummaryPreference(digestState.provider, digestState.model);
      render();
    });

    generateButton.addEventListener("click", async () => {
      if (digestState.loading) {
        return;
      }

      digestState.loading = true;
      render();

      const result = await AIInsight.summarizeStory({
        provider: digestState.provider,
        model: digestState.model,
        story: digest.story,
        language
      });

      digestState.loading = false;
      digestState.provider = result.provider || digestState.provider;
      digestState.model = result.model || digestState.model;
      AIInsight.setSummaryPreference(digestState.provider, digestState.model);
      digestState.summaryLanguage = language;
      digestState.summaryText = result.summary || "";
      digestState.summaryState = result.generated ? "ready" : result.mode === "fallback" ? "error" : "fallback";
      render();
    });

    AIInsight.bindRefreshButtons(app, () => {
      AIInsight.refreshNews({ forceRefresh: true }).catch(() => {});
    });
    AIInsight.bindStoryCards(app);
    AIInsight.bindSaveButtons(app, render);
    AIInsight.bindTrackButtons(app, render);
  }

  document.addEventListener("ai-insight:news-state", (event) => {
    if (event.detail && Array.isArray(event.detail.items)) {
      news = event.detail.items;
      render();
    }
  });

  document.addEventListener("ai-insight:language", render);
  document.addEventListener("ai-insight:saved-stories", render);
  document.addEventListener("ai-insight:saved-sources", render);
  document.addEventListener("ai-insight:tracked-topics", render);

  news = await AIInsight.getNews();
  render();
});

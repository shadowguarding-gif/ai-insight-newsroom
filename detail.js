document.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("detail-app");
  await AIInsight.initShell("feed");
  const news = await AIInsight.getNews();
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const preference = AIInsight.getSummaryPreference();
  const state = {
    provider: preference.provider,
    model: preference.model,
    loading: false,
    summaryText: "",
    summaryState: "idle",
    bodyExpanded: false
  };

  function getCopy(language) {
    return {
      zh: {
        decisionTitle: "先做判断",
        decisionLead: "这页先帮你决定更适合看原文、看视频，还是继续在站内深读。",
        summaryTitle: "关键信号",
        bodyTitle: "全文精读",
        relatedTitle: "延伸阅读",
        engineTitle: "AI 摘要实验台",
        quickReadTitle: "三十秒快读卡",
        oneLineTitle: "一句话看完",
        whyTitle: "为什么重要",
        audienceTitle: "适合谁看",
        nextTitle: "下一步看什么",
        mediaTitle: "原始材料与视频入口",
        mediaLead: "先看官方原文或原视频，再看解读，会比一上来读长文更省时间。",
        mediaEmpty: "这条内容当前不强推视频路线，直接看原文通常更有效。",
        bodyHint: "默认只展示前几段，先帮你判断这条值不值得继续往下读。",
        expandBody: "展开全文",
        collapseBody: "收起全文",
        hiddenParagraphs: (count) => `还有 ${count} 段未展开`,
        localSummaryLabel: "本地快读",
        generatedSummaryLabel: "模型视角",
        proContextTitle: "专业版观察",
        decisionSourceTitle: "先看原文",
        decisionSourceNote: "如果这条是发布、产品或会议消息，优先看官方原始材料通常最快。",
        decisionWatchTitle: "看视频入口",
        decisionWatchNote: "只有更像发布会、演示或解读型话题时，这条路线才值得先点。",
        decisionReadTitle: "继续读这页",
        decisionReadNote: "如果你已经知道来源，只想快速抓重点，就继续看站内精读版。",
        decisionSourceAction: "打开原文",
        decisionWatchAction: "看视频路线",
        decisionReadAction: "继续快读",
        decisionFallbackWatch: "这条不建议先找视频，原文通常更有效。",
        quickNav: {
          decide: "先看",
          brief: "快读",
          watch: "视频",
          full: "全文",
          ai: "摘要"
        }
      },
      en: {
        decisionTitle: "Decide first",
        decisionLead: "This page helps you decide whether the fastest next step is the original source, a watch route, or reading on here.",
        summaryTitle: "Key signals",
        bodyTitle: "Full read",
        relatedTitle: "Related briefs",
        engineTitle: "AI summary studio",
        quickReadTitle: "30-second brief",
        oneLineTitle: "In one line",
        whyTitle: "Why it matters",
        audienceTitle: "Who should care",
        nextTitle: "What to watch next",
        mediaTitle: "Source and video routes",
        mediaLead: "Start with the official source or original video, then move to explainers if the topic deserves more time.",
        mediaEmpty: "This story does not currently force a watch route. Going straight to the source is usually the better use of time.",
        bodyHint: "The article opens in a shorter preview first so you can decide whether the full read is worth it.",
        expandBody: "Expand full article",
        collapseBody: "Collapse article",
        hiddenParagraphs: (count) => `${count} more paragraphs hidden`,
        localSummaryLabel: "Local brief",
        generatedSummaryLabel: "Model lens",
        proContextTitle: "Pro context",
        decisionSourceTitle: "Open the source first",
        decisionSourceNote: "If this is a launch, product, or conference story, the official source is usually the fastest route.",
        decisionWatchTitle: "Try watch routes",
        decisionWatchNote: "This route only deserves priority when the topic is likely to have launch clips, demos, or good explainers.",
        decisionReadTitle: "Keep reading here",
        decisionReadNote: "If you already trust the source and only need the key takeaway, stay in the on-site brief.",
        decisionSourceAction: "Open source",
        decisionWatchAction: "Open watch routes",
        decisionReadAction: "Keep skimming",
        decisionFallbackWatch: "This story is usually better handled by going straight to the source instead of hunting for video first.",
        quickNav: {
          decide: "First",
          brief: "Brief",
          watch: "Watch",
          full: "Full read",
          ai: "AI"
        }
      }
    }[language];
  }

  function renderMissing(language) {
    app.innerHTML = `
      <div class="page-shell">
        ${AIInsight.createEmptyState(AIInsight.t("common.notFoundTitle", language), AIInsight.t("common.notFoundBody", language))}
      </div>
    `;
  }

  function getStatusMessage(language) {
    if (state.summaryState === "ready") {
      return AIInsight.t("common.summaryReady", language);
    }

    if (state.summaryState === "fallback") {
      return AIInsight.t("common.summaryFallback", language);
    }

    if (state.summaryState === "error") {
      return AIInsight.t("common.summaryError", language);
    }

    return AIInsight.t("common.configureBackend", language);
  }

  function getLocalPreview(article, language, quickRead) {
    if (language === "zh") {
      return `先看：${quickRead.oneLine} 更重要的是：${quickRead.why}`;
    }

    return `First take: ${quickRead.oneLine} Why this matters: ${quickRead.why}`;
  }

  function getPreviewParagraphCount() {
    return window.matchMedia("(max-width: 640px)").matches ? 2 : 3;
  }

  function createDecisionCard(title, note, actionLabel, href, extraClass) {
    const mutedClass = extraClass ? ` ${extraClass}` : "";
    const externalAttrs = /^https?:/i.test(String(href || "")) ? AIInsight.getExternalLinkAttributes() : "";
    const actionMarkup = href
      ? `<a class="button button-secondary" href="${AIInsight.escapeHtml(href)}"${externalAttrs}>${AIInsight.escapeHtml(actionLabel)}</a>`
      : `<span class="ghost-badge">${AIInsight.escapeHtml(actionLabel)}</span>`;

    return `
      <article class="decision-card page-fade${mutedClass}">
        <h3>${AIInsight.escapeHtml(title)}</h3>
        <p>${AIInsight.escapeHtml(note)}</p>
        <div class="decision-card-action">
          ${actionMarkup}
        </div>
      </article>
    `;
  }

  function render() {
    const language = AIInsight.getLanguage();
    const article = news.find((item) => String(item.id) === String(id));

    if (!news.length || !article) {
      document.title = "AI Insight";
      renderMissing(language);
      return;
    }

    const pageCopy = getCopy(language);
    const companyKey = AIInsight.getPrimaryCompanyKey(article);
    const relatedPool = companyKey
      ? news.filter((item) => item.id !== article.id && AIInsight.getPrimaryCompanyKey(item) === companyKey)
      : news.filter((item) => item.id !== article.id && item.category === article.category);
    const related = AIInsight.limitStoriesPerCompany(relatedPool, { maxPerCompany: 1, maxFallback: 1 }).slice(0, 3);
    const paragraphs = AIInsight.localize(article.content, language);
    const summary = AIInsight.localize(article.summaryPoints, language);
    const quickRead = AIInsight.getStoryQuickRead(article, language);
    const editorialSummary = AIInsight.getStoryCardSummary(article, language).text || AIInsight.localize(article.insight, language) || quickRead.why;
    const localPreview = getLocalPreview(article, language, quickRead);
    const aiSummary = state.summaryText
      || (state.provider === "local" ? getLocalPreview(article, language, quickRead) : AIInsight.getStoryCardSummary(article, language).text)
      || localPreview;
    const providerMeta = AIInsight.getProviderMeta(state.provider);
    const models = providerMeta.models;
    const proNotes = AIInsight.localize(article.proNotes, language).slice(0, 3);
    const formatLabel = AIInsight.getStoryFormatLabel(article, language);
    const metricLabel = AIInsight.localize(article.metricLabel, language) || (language === "zh" ? "信号" : "Signal");
    const metricValue = article.metricValue || `${article.readingTime} ${AIInsight.t("common.readingTimeSuffix", language)}`;
    const relatedSources = AIInsight.getJournalSources()
      .filter((source) => {
        const haystack = [
          source.title.zh,
          source.title.en,
          source.publisher,
          source.coverage.zh,
          source.coverage.en,
          source.bestFor.zh,
          source.bestFor.en,
          (source.tags || []).join(" ")
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(article.category) || article.tags.some((tag) => haystack.includes(String(tag).toLowerCase()));
      })
      .slice(0, 3);
    const videoLinks = AIInsight.getStoryVideoLinks(article, language);
    const primaryVideoLinks = videoLinks.slice(0, 2);
    const heroLead = AIInsight.getStoryLeadPreview(article, language);
    const previewCount = getPreviewParagraphCount();
    const previewParagraphs = state.bodyExpanded ? paragraphs : paragraphs.slice(0, previewCount);
    const hiddenParagraphCount = Math.max(0, paragraphs.length - previewParagraphs.length);
    const sourceHref = article.sourceUrl || "";
    const watchHref = videoLinks.length ? `watch.html?q=${encodeURIComponent(AIInsight.localize(article.title, language))}` : "";
    const readHref = "#quick-read";
    const decisionCards = [
      createDecisionCard(
        pageCopy.decisionSourceTitle,
        pageCopy.decisionSourceNote,
        pageCopy.decisionSourceAction,
        sourceHref
      ),
      createDecisionCard(
        pageCopy.decisionWatchTitle,
        videoLinks.length ? pageCopy.decisionWatchNote : pageCopy.decisionFallbackWatch,
        videoLinks.length ? pageCopy.decisionWatchAction : (language === "zh" ? "直接看原文" : "Use the source instead"),
        watchHref || sourceHref,
        videoLinks.length ? "" : " is-muted"
      ),
      createDecisionCard(
        pageCopy.decisionReadTitle,
        hiddenParagraphCount
          ? `${pageCopy.decisionReadNote} ${pageCopy.hiddenParagraphs(hiddenParagraphCount)}。`
          : pageCopy.decisionReadNote,
        pageCopy.decisionReadAction,
        readHref
      )
    ];

    if (!models.includes(state.model)) {
      state.model = models[0];
      AIInsight.setSummaryPreference(state.provider, state.model);
    }

    document.title = `${AIInsight.localize(article.title, language)} | AI Insight`;

    app.innerHTML = `
      <div class="page-shell">
        <section class="article-hero page-fade">
          <div class="detail-breadcrumb">
            <a href="index.html">${AIInsight.escapeHtml(AIInsight.t("nav.home", language))}</a>
            <span>/</span>
            <a href="list.html">${AIInsight.escapeHtml(AIInsight.t("nav.feed", language))}</a>
            <span>/</span>
            <span>${AIInsight.escapeHtml(AIInsight.getCategoryLabel(article.category, language))}</span>
          </div>

          <div class="article-badges">
            ${AIInsight.isLiveItem(article) ? `<span class="badge badge-live">${AIInsight.escapeHtml(AIInsight.t("common.live", language))}</span>` : ""}
            <span class="${AIInsight.getBadgeClass(article.signal)}">${AIInsight.escapeHtml(AIInsight.getSignalLabel(article.signal, language))}</span>
            <span class="ghost-badge">${AIInsight.escapeHtml(AIInsight.getCategoryLabel(article.category, language))}</span>
            <span class="ghost-badge">${AIInsight.escapeHtml(AIInsight.getRegionLabel(article.region, language))}</span>
          </div>

          <h1 class="article-title">${AIInsight.escapeHtml(AIInsight.localize(article.title, language))}</h1>
          <p class="lead">${AIInsight.escapeHtml(heroLead)}</p>

          <div class="article-meta">
            <span>${AIInsight.escapeHtml(AIInsight.formatDate(article.date, language))}</span>
            <span>·</span>
            <span>${AIInsight.escapeHtml(article.sourceName || article.source || "AI Insight")}</span>
            <span>·</span>
            <span>${AIInsight.escapeHtml(`${article.readingTime} ${AIInsight.t("common.readingTimeSuffix", language)}`)}</span>
          </div>

          <div class="article-pro-strip pro-only">
            <span>${AIInsight.escapeHtml(formatLabel)}</span>
            <span>${AIInsight.escapeHtml(metricLabel)}: ${AIInsight.escapeHtml(metricValue)}</span>
            <span>${AIInsight.escapeHtml(AIInsight.getCategoryLabel(article.category, language))}</span>
          </div>

          <div class="detail-actions">
            <a class="button button-secondary" href="list.html">${AIInsight.escapeHtml(AIInsight.t("common.backToFeed", language))}</a>
            <button class="button button-secondary" type="button" data-save-story="${AIInsight.escapeHtml(article.id)}">${AIInsight.escapeHtml(AIInsight.isStorySaved(article.id) ? AIInsight.t("common.saved", language) : AIInsight.t("common.save", language))}</button>
            ${
              article.sourceUrl
                ? `<a class="button button-primary" href="${AIInsight.escapeHtml(article.sourceUrl)}"${AIInsight.getExternalLinkAttributes()}>${AIInsight.escapeHtml(AIInsight.t("common.openSource", language))}</a>`
                : ""
            }
          </div>
        </section>

        <section class="detail-quick-nav page-fade">
          <a class="chip" href="#decide-fast">${AIInsight.escapeHtml(pageCopy.quickNav.decide)}</a>
          <a class="chip" href="#quick-read">${AIInsight.escapeHtml(pageCopy.quickNav.brief)}</a>
          <a class="chip" href="#media-desk">${AIInsight.escapeHtml(pageCopy.quickNav.watch)}</a>
          <a class="chip" href="#full-read">${AIInsight.escapeHtml(pageCopy.quickNav.full)}</a>
          <a class="chip" href="#ai-studio">${AIInsight.escapeHtml(pageCopy.quickNav.ai)}</a>
        </section>

        <section class="section page-fade" id="decide-fast">
          <article class="article-block detail-decision-panel">
            <div class="summary-headline">
              <span class="meta-label">${AIInsight.escapeHtml(pageCopy.decisionTitle)}</span>
              <span class="ghost-badge">${AIInsight.escapeHtml(language === "zh" ? "先省时间" : "Save time first")}</span>
            </div>
            <p class="panel-text detail-decision-lead">${AIInsight.escapeHtml(pageCopy.decisionLead)}</p>
            <div class="detail-decision-grid">
              ${decisionCards.join("")}
            </div>
          </article>
        </section>

        <section class="section article-fast-grid">
          <article class="article-block quick-read-card page-fade" id="quick-read">
            <div class="summary-headline">
              <span class="meta-label">${AIInsight.escapeHtml(pageCopy.quickReadTitle)}</span>
              <span class="ghost-badge">${AIInsight.escapeHtml(pageCopy.localSummaryLabel)}</span>
            </div>
            <div class="quick-read-grid">
              <div class="quick-read-item">
                <span class="mini-label">${AIInsight.escapeHtml(pageCopy.oneLineTitle)}</span>
                <p>${AIInsight.escapeHtml(quickRead.oneLine)}</p>
              </div>
              <div class="quick-read-item">
                <span class="mini-label">${AIInsight.escapeHtml(pageCopy.whyTitle)}</span>
                <p>${AIInsight.escapeHtml(quickRead.why)}</p>
              </div>
              <div class="quick-read-item">
                <span class="mini-label">${AIInsight.escapeHtml(pageCopy.audienceTitle)}</span>
                <p>${AIInsight.escapeHtml(quickRead.who)}</p>
              </div>
              <div class="quick-read-item">
                <span class="mini-label">${AIInsight.escapeHtml(pageCopy.nextTitle)}</span>
                <p>${AIInsight.escapeHtml(quickRead.next)}</p>
              </div>
            </div>
            ${
              quickRead.bullets.length
                ? `
                  <ul class="signal-notes quick-read-notes">
                    ${quickRead.bullets.map((note) => `<li>${AIInsight.escapeHtml(note)}</li>`).join("")}
                  </ul>
                `
                : ""
            }
          </article>

          <article class="article-block media-desk-card page-fade" id="media-desk">
            <div class="summary-headline">
              <span class="meta-label">${AIInsight.escapeHtml(pageCopy.mediaTitle)}</span>
              <span class="ghost-badge">${AIInsight.escapeHtml(article.sourceName || "AI Insight")}</span>
            </div>
            <p class="panel-text">${AIInsight.escapeHtml(pageCopy.mediaLead)}</p>
            <div class="detail-actions media-actions">
              ${
                article.sourceUrl
                  ? `<a class="button button-primary" href="${AIInsight.escapeHtml(article.sourceUrl)}"${AIInsight.getExternalLinkAttributes()}>${AIInsight.escapeHtml(AIInsight.t("common.openSource", language))}</a>`
                  : ""
              }
              <a class="button button-secondary" href="watch.html?q=${encodeURIComponent(AIInsight.localize(article.title, language))}">${AIInsight.escapeHtml(language === "zh" ? "打开视频页" : "Open watch desk")}</a>
              ${primaryVideoLinks
                .map(
                  (link) => `<a class="button button-secondary" href="${AIInsight.escapeHtml(link.url)}"${AIInsight.getExternalLinkAttributes()}>${AIInsight.escapeHtml(link.title)}</a>`
                )
                .join("")}
            </div>
            ${
              videoLinks.length
                ? `
                  <div class="video-link-grid">
                    ${videoLinks.map((link) => AIInsight.createVideoLinkCard(link, language)).join("")}
                  </div>
                `
                : `<p class="panel-text media-empty-note">${AIInsight.escapeHtml(pageCopy.mediaEmpty)}</p>`
            }
          </article>
        </section>

        <section class="section article-wrap">
          <div>
            <article class="article-block page-fade">
              <span class="meta-label">${AIInsight.escapeHtml(pageCopy.summaryTitle)}</span>
              <ul class="summary-list">
                ${summary.map((point) => `<li>${AIInsight.escapeHtml(point)}</li>`).join("")}
              </ul>
            </article>

            <div class="summary-stack">
              <article class="article-block summary-box page-fade">
                <div class="summary-headline">
                  <span class="meta-label">${AIInsight.escapeHtml(AIInsight.t("common.editorialSummary", language))}</span>
                  <span class="ghost-badge">${AIInsight.escapeHtml(AIInsight.t("common.insight", language))}</span>
                </div>
                <p>${AIInsight.escapeHtml(editorialSummary)}</p>
              </article>

              <article class="article-block summary-box summary-box-ai page-fade">
                <div class="summary-headline">
                  <span class="meta-label">${AIInsight.escapeHtml(AIInsight.t("common.aiSummary", language))}</span>
                  <span class="ghost-badge">${AIInsight.escapeHtml(state.summaryText ? pageCopy.generatedSummaryLabel : pageCopy.localSummaryLabel)}</span>
                  <span class="ghost-badge">${AIInsight.escapeHtml(providerMeta ? AIInsight.localize(providerMeta.label, language) : "")}</span>
                </div>
                <p>${AIInsight.escapeHtml(aiSummary)}</p>
              </article>
            </div>

            <article class="article-block article-body page-fade" id="full-read">
              <div class="summary-headline">
                <span class="meta-label">${AIInsight.escapeHtml(pageCopy.bodyTitle)}</span>
                <span class="ghost-badge">${AIInsight.escapeHtml(pageCopy.bodyHint)}</span>
              </div>
              ${previewParagraphs.map((paragraph) => `<p>${AIInsight.escapeHtml(paragraph)}</p>`).join("")}
              ${
                hiddenParagraphCount
                  ? `
                    <div class="body-toggle-row">
                      <span class="panel-text">${AIInsight.escapeHtml(pageCopy.hiddenParagraphs(hiddenParagraphCount))}</span>
                      <button class="button button-secondary body-toggle-btn" type="button" id="toggle-body">${AIInsight.escapeHtml(state.bodyExpanded ? pageCopy.collapseBody : pageCopy.expandBody)}</button>
                    </div>
                  `
                  : ""
              }
            </article>
          </div>

          <aside class="article-sidebar">
            <article class="article-block page-fade" id="ai-studio">
              <h3>${AIInsight.escapeHtml(pageCopy.engineTitle)}</h3>
              <div class="provider-form">
                <div class="field-grid">
                  <div>
                    <label class="control-label" for="provider-select">${AIInsight.escapeHtml(AIInsight.t("common.chooseProvider", language))}</label>
                    <select id="provider-select" class="select-input">
                      ${AIInsight.getProviderIds()
                        .map((providerId) => {
                          const meta = AIInsight.getProviderMeta(providerId);
                          const selected = providerId === state.provider ? " selected" : "";
                          return `<option value="${AIInsight.escapeHtml(providerId)}"${selected}>${AIInsight.escapeHtml(AIInsight.localize(meta.label, language))}</option>`;
                        })
                        .join("")}
                    </select>
                  </div>
                  <div>
                    <label class="control-label" for="model-select">${AIInsight.escapeHtml(AIInsight.t("common.chooseModel", language))}</label>
                    <select id="model-select" class="select-input">
                      ${models
                        .map((modelId) => {
                          const selected = modelId === state.model ? " selected" : "";
                          return `<option value="${AIInsight.escapeHtml(modelId)}"${selected}>${AIInsight.escapeHtml(modelId)}</option>`;
                        })
                        .join("")}
                    </select>
                  </div>
                </div>
                <p class="panel-text">${AIInsight.escapeHtml(AIInsight.localize(providerMeta.description, language))}</p>
                <button class="button button-primary" type="button" id="generate-summary">${AIInsight.escapeHtml(state.loading ? AIInsight.t("common.generating", language) : AIInsight.t("common.generateSummary", language))}</button>
                <p class="summary-status">${AIInsight.escapeHtml(getStatusMessage(language))}</p>
              </div>
            </article>

            <article class="article-block page-fade pro-only">
              <h3>${AIInsight.escapeHtml(pageCopy.proContextTitle)}</h3>
              <div class="story-pro-meta is-static">
                <span>${AIInsight.escapeHtml(formatLabel)}</span>
                <span>${AIInsight.escapeHtml(metricLabel)}: ${AIInsight.escapeHtml(metricValue)}</span>
                <span>${AIInsight.escapeHtml(AIInsight.getRegionLabel(article.region, language))}</span>
              </div>
              ${
                proNotes.length
                  ? `
                    <ul class="signal-notes">
                      ${proNotes.map((note) => `<li>${AIInsight.escapeHtml(note)}</li>`).join("")}
                    </ul>
                  `
                  : `<p>${AIInsight.escapeHtml(language === "zh" ? "这篇内容更适合放进专业版做持续跟踪。"
                    : "This item fits naturally into the Pro view for ongoing tracking.")}</p>`
              }
              ${
                relatedSources.length
                  ? `
                    <div class="pro-source-list">
                      ${relatedSources
                        .map(
                          (source) => `
                            <a class="text-link" href="${AIInsight.escapeHtml(source.url)}"${AIInsight.getExternalLinkAttributes()}>
                              ${AIInsight.escapeHtml(AIInsight.localize(source.title, language))}
                            </a>
                          `
                        )
                        .join("")}
                    </div>
                  `
                  : ""
              }
            </article>
          </aside>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>${AIInsight.escapeHtml(pageCopy.relatedTitle)}</h2>
          </div>
          ${
            related.length
              ? `<div class="related-grid">${related.map((item) => AIInsight.createStoryCard(item, { language, compact: true })).join("")}</div>`
              : AIInsight.createEmptyState(AIInsight.t("common.related", language), AIInsight.t("common.notFoundBody", language))
          }
        </section>
      </div>
    `;

    const providerSelect = document.getElementById("provider-select");
    const modelSelect = document.getElementById("model-select");
    const generateButton = document.getElementById("generate-summary");
    const toggleBodyButton = document.getElementById("toggle-body");

    providerSelect.addEventListener("change", () => {
      state.provider = providerSelect.value;
      state.model = AIInsight.getProviderMeta(state.provider).defaultModel || AIInsight.getProviderMeta(state.provider).models[0];
      AIInsight.setSummaryPreference(state.provider, state.model);
      render();
    });

    modelSelect.addEventListener("change", () => {
      state.model = modelSelect.value;
      AIInsight.setSummaryPreference(state.provider, state.model);
      render();
    });

    generateButton.addEventListener("click", async () => {
      if (state.loading) {
        return;
      }

      state.loading = true;
      render();

      const result = await AIInsight.summarizeStory({
        provider: state.provider,
        model: state.model,
        story: article,
        language
      });

      state.loading = false;
      state.provider = result.provider || state.provider;
      state.model = result.model || state.model;
      AIInsight.setSummaryPreference(state.provider, state.model);
      state.summaryText = result.summary || "";
      state.summaryState = result.generated ? "ready" : result.mode === "fallback" ? "error" : "fallback";
      render();
    });

    if (toggleBodyButton) {
      toggleBodyButton.addEventListener("click", () => {
        state.bodyExpanded = !state.bodyExpanded;
        render();
      });
    }

    AIInsight.bindStoryCards(app);
    AIInsight.bindSaveButtons(app, render);
  }

  render();
  document.addEventListener("ai-insight:language", render);
  window.addEventListener("resize", () => {
    if (!state.bodyExpanded) {
      render();
    }
  });
});

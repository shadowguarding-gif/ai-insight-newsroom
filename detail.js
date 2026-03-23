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
    summaryState: "idle"
  };

  function getCopy(language) {
    return {
      zh: {
        summaryTitle: "关键信号",
        whoTitle: "谁应该重点关注",
        watchTitle: "下一观察点",
        bodyTitle: "深度解读",
        relatedTitle: "延伸阅读",
        sourceTitle: "原文来源",
        engineTitle: "AI 摘要实验台"
      },
      en: {
        summaryTitle: "Key signals",
        whoTitle: "Who should care",
        watchTitle: "Next watchpoint",
        bodyTitle: "Deep read",
        relatedTitle: "Related briefs",
        sourceTitle: "Original source",
        engineTitle: "AI summary studio"
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

  function render() {
    const language = AIInsight.getLanguage();
    const article = news.find((item) => String(item.id) === String(id));

    if (!news.length || !article) {
      document.title = "AI Insight";
      renderMissing(language);
      return;
    }

    const pageCopy = getCopy(language);
    const related = news
      .filter((item) => item.id !== article.id && item.category === article.category)
      .slice(0, 3);
    const paragraphs = AIInsight.localize(article.content, language);
    const summary = AIInsight.localize(article.summaryPoints, language);
    const editorialSummary = AIInsight.localize(article.editorialSummary, language) || AIInsight.localize(article.insight, language);
    const aiSummary = state.summaryText || AIInsight.localize(article.aiSummary, language) || editorialSummary;
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
          <p class="lead">${AIInsight.escapeHtml(AIInsight.localize(article.deck, language))}</p>

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
                  <span class="ghost-badge">${AIInsight.escapeHtml(providerMeta ? AIInsight.localize(providerMeta.label, language) : "")}</span>
                </div>
                <p>${AIInsight.escapeHtml(aiSummary)}</p>
              </article>
            </div>

            <article class="article-block article-body page-fade">
              <span class="meta-label">${AIInsight.escapeHtml(pageCopy.bodyTitle)}</span>
              ${paragraphs.map((paragraph) => `<p>${AIInsight.escapeHtml(paragraph)}</p>`).join("")}
            </article>
          </div>

          <aside class="article-sidebar">
            <article class="article-block page-fade">
              <h3>${AIInsight.escapeHtml(pageCopy.sourceTitle)}</h3>
              <p>${AIInsight.escapeHtml(article.sourceName || article.source || "AI Insight")}</p>
              ${
                article.sourceUrl
                  ? `<a class="text-link" href="${AIInsight.escapeHtml(article.sourceUrl)}"${AIInsight.getExternalLinkAttributes()}>${AIInsight.escapeHtml(article.sourceUrl)}</a>`
                  : `<p>${AIInsight.escapeHtml(language === "zh" ? "当前为站内编辑整合内容。" : "This is currently an internal editorial brief.")}</p>`
              }
            </article>

            <article class="article-block page-fade">
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

            <article class="article-block page-fade">
              <h3>${AIInsight.escapeHtml(pageCopy.whoTitle)}</h3>
              <p>${AIInsight.escapeHtml(AIInsight.localize(article.who, language))}</p>
            </article>

            <article class="article-block page-fade">
              <h3>${AIInsight.escapeHtml(pageCopy.watchTitle)}</h3>
              <p>${AIInsight.escapeHtml(AIInsight.localize(article.watchpoint, language))}</p>
              <div class="tag-row">
                ${article.tags.map((tag) => `<span class="tag">${AIInsight.escapeHtml(tag)}</span>`).join("")}
              </div>
            </article>

            <article class="article-block page-fade pro-only">
              <h3>${AIInsight.escapeHtml(language === "zh" ? "专业版观察" : "Pro context")}</h3>
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

    AIInsight.bindStoryCards(app);
    AIInsight.bindSaveButtons(app, render);
  }

  render();
  document.addEventListener("ai-insight:language", render);
});

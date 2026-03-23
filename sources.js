document.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("sources-app");
  const sources = AIInsight.getJournalSources();
  const state = {
    query: "",
    access: "all",
    kind: "all"
  };
  await AIInsight.initShell("sources");

  function matches(source) {
    const query = state.query.trim().toLowerCase();
    const accessMatch = state.access === "all" || source.access === state.access;
    const kindMatch = state.kind === "all" || source.kind === state.kind;

    if (!accessMatch || !kindMatch) {
      return false;
    }

    if (!query) {
      return true;
    }

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

    return haystack.includes(query);
  }

  function getCopy(language, count) {
    return {
      zh: {
        eyebrow: "Professional Source Desk",
        title: "给专业用户的 AI 期刊与前沿来源入口",
        lead: "这个页面更偏专业版阅读体验。它把顶级期刊、开放获取来源、会议论文和预印本入口单独列出来，让科研人员、工程师和深度读者可以更快进入原始研究生态，而不是只看新闻摘要。",
        searchLabel: "搜索期刊、预印本或来源",
        accessLabel: "按获取方式筛选",
        kindLabel: "按来源类型筛选",
        count: `当前展示 ${count} 个专业来源`,
        noteTitle: "使用建议",
        noteBody: "订阅制来源更适合做高质量正式研究跟踪，开放获取、会议和预印本更适合高频扫描。你可以把这个页当作专业入口，而把炫酷版首页当作更轻量的实时入口。",
        emptyTitle: "没有匹配到来源",
        emptyBody: "可以换一个关键词，或者先取消筛选条件。",
        accessOptions: [
          { key: "all", label: { zh: "全部", en: "All" } },
          { key: "open", label: { zh: "开放获取", en: "Open access" } },
          { key: "hybrid", label: { zh: "混合获取", en: "Hybrid" } },
          { key: "subscription", label: { zh: "订阅制", en: "Subscription" } }
        ],
        kindOptions: [
          { key: "all", label: { zh: "全部", en: "All" } },
          { key: "journal", label: { zh: "期刊", en: "Journal" } },
          { key: "conference", label: { zh: "会议", en: "Conference" } },
          { key: "preprint", label: { zh: "预印本", en: "Preprint" } }
        ]
      },
      en: {
        eyebrow: "Professional Source Desk",
        title: "A dedicated AI journal and frontier-source entry point for professional readers",
        lead: "This page is designed as the more professional reading mode. It separates top journals, open-access sources, conference proceedings, and preprint feeds so researchers, engineers, and deep readers can move quickly into the primary research ecosystem rather than stopping at news summaries.",
        searchLabel: "Search journals, preprints, or source desks",
        accessLabel: "Filter by access",
        kindLabel: "Filter by source type",
        count: `Showing ${count} professional sources`,
        noteTitle: "How to use this page",
        noteBody: "Subscription journals are stronger for formal long-form research tracking, while open-access, conference, and preprint sources are better for fast scanning. Think of this page as the professional desk, while the pulse homepage remains the lighter live entry point.",
        emptyTitle: "No sources matched",
        emptyBody: "Try another keyword, or clear the filters first.",
        accessOptions: [
          { key: "all", label: { zh: "全部", en: "All" } },
          { key: "open", label: { zh: "开放获取", en: "Open access" } },
          { key: "hybrid", label: { zh: "混合获取", en: "Hybrid" } },
          { key: "subscription", label: { zh: "订阅制", en: "Subscription" } }
        ],
        kindOptions: [
          { key: "all", label: { zh: "全部", en: "All" } },
          { key: "journal", label: { zh: "期刊", en: "Journal" } },
          { key: "conference", label: { zh: "会议", en: "Conference" } },
          { key: "preprint", label: { zh: "预印本", en: "Preprint" } }
        ]
      }
    }[language];
  }

  function render() {
    const language = AIInsight.getLanguage();
    const filtered = sources.filter(matches);
    const pageCopy = getCopy(language, filtered.length);

    document.title = language === "zh" ? "AI Insight | 权威期刊与专业来源" : "AI Insight | Professional AI sources";

    app.innerHTML = `
      <div class="page-shell">
        <section class="hero page-fade">
          <span class="eyebrow">${AIInsight.escapeHtml(pageCopy.eyebrow)}</span>
          <h1>${AIInsight.escapeHtml(pageCopy.title)}</h1>
          <p class="lead">${AIInsight.escapeHtml(pageCopy.lead)}</p>
        </section>

        <section class="panel control-panel page-fade">
          <div class="control-group">
            <label class="control-label" for="source-search">${AIInsight.escapeHtml(pageCopy.searchLabel)}</label>
            <input id="source-search" class="search-input" type="search" value="${AIInsight.escapeHtml(state.query)}" placeholder="${AIInsight.escapeHtml(pageCopy.searchLabel)}">
          </div>
          <div class="control-group">
            <span class="control-label">${AIInsight.escapeHtml(pageCopy.accessLabel)}</span>
            <div class="chip-row">
              ${AIInsight.createChips(pageCopy.accessOptions, state.access, "access", language)}
            </div>
          </div>
          <div class="control-group">
            <span class="control-label">${AIInsight.escapeHtml(pageCopy.kindLabel)}</span>
            <div class="chip-row">
              ${AIInsight.createChips(pageCopy.kindOptions, state.kind, "kind", language)}
            </div>
          </div>
          <div class="section-head">
            <p class="results-meta">${AIInsight.escapeHtml(pageCopy.count)}</p>
          </div>
        </section>

        <section class="section feed-layout">
          <div>
            ${
              filtered.length
                ? `<div class="journal-grid">${filtered.map((item) => AIInsight.createJournalCard(item, language)).join("")}</div>`
                : AIInsight.createEmptyState(pageCopy.emptyTitle, pageCopy.emptyBody)
            }
          </div>

          <aside class="article-sidebar">
            <article class="insight-card page-fade">
              <span class="meta-label">${AIInsight.escapeHtml(pageCopy.noteTitle)}</span>
              <h3>${AIInsight.escapeHtml(language === "zh" ? "把专业阅读和快讯阅读拆开" : "Separate expert reading from rapid scanning")}</h3>
              <p>${AIInsight.escapeHtml(pageCopy.noteBody)}</p>
            </article>
          </aside>
        </section>
      </div>
    `;

    document.getElementById("source-search").addEventListener("input", (event) => {
      state.query = event.target.value;
      render();
    });

    AIInsight.bindChoiceButtons(app, (group, value) => {
      state[group] = value;
      render();
    });

    AIInsight.bindSaveButtons(app, render);
  }

  render();
  document.addEventListener("ai-insight:language", render);
});

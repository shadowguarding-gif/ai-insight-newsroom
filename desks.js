document.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("desks-app");
  const params = new URLSearchParams(window.location.search);
  let news = [];
  const state = {
    company: params.get("company") || ""
  };

  await AIInsight.initShell("desks");
  AIInsight.startAutoRefresh();

  function getCopy(language, meta, desk, archive) {
    const deskName = AIInsight.localize(desk.label, language);
    const totalStories = archive.totalStories || 0;
    const featureStories = archive.featureStories.length;
    const archiveStories = archive.archiveStories.length;
    const latestDate = archive.latestDate
      ? AIInsight.formatDate(archive.latestDate, language)
      : (language === "zh" ? "待补充" : "Pending");

    return {
      zh: {
        eyebrow: "Company Desk",
        title: `${deskName} 专栏`,
        lead: `把 ${deskName} 过去几个月的重要新闻、产品动作、芯片路线和平台节奏单独放在一个长期档案里，不和主信息流混在一起。`,
        statusLead: meta.remoteConnected
          ? "专栏页会跟着 live 源一起更新，但旧内容会继续留在这里，方便回看一个阶段的方向。"
          : "当前专栏页优先用站内已整理内容生成公司档案，远端源接通后会自动继续补厚。",
        switchLabel: "切换公司",
        archiveLabel: "长期归档",
        archiveIntro: "这里保留过去几个月的重点文章和快讯，不会被当天的主流新闻挤掉。",
        focusTitle: "专栏焦点",
        focusNote: `这条专栏优先看 ${AIInsight.localize(desk.focus, language)}。`,
        currentTitle: "当期重点",
        currentNote: "先看最值得代表这个阶段方向的几条，再回看归档。",
        archiveTitle: "月度归档",
        archiveNote: "按月份往回看，适合追公司路线、产品节奏和阶段性判断。",
        quickTitle: "快讯补充",
        quickNote: "这层保留更轻的动态和工具发布，帮助你补足上下文。",
        openSearch: "搜索该公司",
        openWatch: "看视频路线",
        openFeed: "返回资讯流",
        deskRuleTitle: "为什么单独做专栏",
        deskRuleBody: "像英伟达、微软、OpenAI 这类公司，旧新闻也常常决定一个阶段的行业方向，所以更适合放进长期追踪位，而不是只留在当天流里。",
        stats: [
          { label: "累计内容", value: `${totalStories}` },
          { label: "重点文章", value: `${featureStories}` },
          { label: "归档条目", value: `${archiveStories}` },
          { label: "最近更新", value: latestDate }
        ],
        emptyTitle: `${deskName} 专栏暂时还不够厚`,
        emptyBody: "当前内容池里还没有足够多的相关条目，先用搜索和视频路线兜底，后面会继续补齐。",
        monthSuffix: "条"
      },
      en: {
        eyebrow: "Company Desk",
        title: `${deskName} desk`,
        lead: `Keep ${deskName}'s important coverage from the past few months in one standing archive so it does not get buried inside the main daily flow.`,
        statusLead: meta.remoteConnected
          ? "The desk refreshes with the live feed while keeping older coverage in place so readers can revisit the direction of an entire cycle."
          : "The desk currently builds from the in-house archive first and will grow automatically once the remote feed responds.",
        switchLabel: "Switch company",
        archiveLabel: "Standing archive",
        archiveIntro: "This lane keeps the past few months of key stories and quick updates instead of letting them disappear under the daily feed.",
        focusTitle: "Desk focus",
        focusNote: `This desk prioritizes ${AIInsight.localize(desk.focus, language)}.`,
        currentTitle: "Current cycle",
        currentNote: "Start with the few stories that best represent the current direction, then step back into the archive.",
        archiveTitle: "Monthly archive",
        archiveNote: "Read backwards by month to track product timing, platform movement, and the shape of the company narrative.",
        quickTitle: "Quick updates",
        quickNote: "A lighter lane for smaller updates and tooling moves that still matter for context.",
        openSearch: "Search this company",
        openWatch: "Open watch routes",
        openFeed: "Back to feed",
        deskRuleTitle: "Why isolate company desks",
        deskRuleBody: "For companies such as NVIDIA, Microsoft, or OpenAI, older stories can still define the direction of an entire cycle. A standing desk makes that easier to follow.",
        stats: [
          { label: "Total stories", value: `${totalStories}` },
          { label: "Feature reads", value: `${featureStories}` },
          { label: "Archive items", value: `${archiveStories}` },
          { label: "Latest update", value: latestDate }
        ],
        emptyTitle: `${deskName} needs a thicker archive`,
        emptyBody: "There are not enough matching stories in the current pool yet, so use search and watch routes as the fallback for now.",
        monthSuffix: "stories"
      }
    }[language];
  }

  function formatMonthLabel(monthKey, language) {
    const match = /^(\d{4})-(\d{2})/.exec(String(monthKey || ""));

    if (!match) {
      return language === "zh" ? "更早" : "Earlier";
    }

    const year = match[1];
    const month = Number(match[2]);
    const englishMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return language === "zh" ? `${year} 年 ${month} 月` : `${englishMonths[month - 1] || match[2]} ${year}`;
  }

  function groupStoriesByMonth(items, language) {
    const groups = new Map();

    (Array.isArray(items) ? items : []).forEach((item) => {
      const key = String(item && item.date || "").slice(0, 7) || "earlier";

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(item);
    });

    return [...groups.entries()]
      .sort((left, right) => String(right[0]).localeCompare(String(left[0])))
      .map(([key, stories]) => ({
        key,
        label: formatMonthLabel(key, language),
        stories
      }));
  }

  function getDeskStates(items) {
    return AIInsight.getCompanyDeskDefinitions().map((desk) => {
      const archive = AIInsight.getCompanyDeskArchive(items, desk.key);

      return {
        ...desk,
        archive,
        totalStories: archive.totalStories
      };
    });
  }

  function resolveCompanyKey(deskStates) {
    const current = deskStates.find((desk) => desk.key === state.company);

    if (current) {
      return current.key;
    }

    const withStories = deskStates.find((desk) => desk.totalStories > 0);
    return (withStories || deskStates[0] || {}).key || "nvidia";
  }

  function syncUrl() {
    const url = new URL(window.location.href);

    if (state.company) {
      url.searchParams.set("company", state.company);
    } else {
      url.searchParams.delete("company");
    }

    window.history.replaceState({}, "", url);
  }

  function createDeskSwitches(deskStates, activeKey, language) {
    return deskStates
      .map((desk) => `
        <button
          class="chip desk-switch${desk.key === activeKey ? " is-active" : ""}${desk.totalStories ? "" : " is-muted"}"
          type="button"
          data-desk-key="${AIInsight.escapeHtml(desk.key)}"
        >
          <span>${AIInsight.escapeHtml(AIInsight.localize(desk.label, language))}</span>
          <strong class="desk-chip-count">${AIInsight.escapeHtml(String(desk.totalStories || 0))}</strong>
        </button>
      `)
      .join("");
  }

  function createMonthArchive(group, language, copy) {
    return `
      <article class="desk-month panel page-fade">
        <div class="desk-month-head">
          <div>
            <span class="meta-label">${AIInsight.escapeHtml(copy.archiveLabel)}</span>
            <h3>${AIInsight.escapeHtml(group.label)}</h3>
          </div>
          <span class="ghost-badge">${AIInsight.escapeHtml(`${group.stories.length} ${copy.monthSuffix}`)}</span>
        </div>
        <div class="story-grid feed-grid desk-archive-grid">
          ${group.stories.map((item) => AIInsight.createStoryCard(item, { language, compact: true })).join("")}
        </div>
      </article>
    `;
  }

  function render() {
    const language = AIInsight.getLanguage();
    const meta = AIInsight.getNewsMeta();
    const deskStates = getDeskStates(news);

    state.company = resolveCompanyKey(deskStates);
    syncUrl();

    const selectedDesk = deskStates.find((desk) => desk.key === state.company) || deskStates[0];
    const archive = selectedDesk.archive;
    const copy = getCopy(language, meta, selectedDesk, archive);
    const featureStories = archive.featureStories.slice(0, 4);
    const quickStories = archive.archiveStories.filter((item) => AIInsight.isMicroStory(item)).slice(0, 4);
    const timelineGroups = groupStoriesByMonth(
      archive.stories.filter((item) => !AIInsight.isMicroStory(item)),
      language
    );
    const searchHref = `search.html?q=${encodeURIComponent(AIInsight.localize(selectedDesk.query, language))}`;
    const watchHref = `watch.html?q=${encodeURIComponent(AIInsight.localize(selectedDesk.query, language))}`;

    document.title = language === "zh"
      ? `AI Insight | ${AIInsight.localize(selectedDesk.label, language)} 专栏`
      : `AI Insight | ${AIInsight.localize(selectedDesk.label, language)} desk`;

    app.innerHTML = `
      <div class="page-shell">
        <section class="hero desk-hero page-fade">
          <span class="eyebrow">${AIInsight.escapeHtml(copy.eyebrow)}</span>
          <div class="desk-hero-grid">
            <div>
              <h1>${AIInsight.escapeHtml(copy.title)}</h1>
              <p class="lead">${AIInsight.escapeHtml(copy.lead)}</p>

              <div class="control-group desk-switch-group">
                <span class="control-label">${AIInsight.escapeHtml(copy.switchLabel)}</span>
                <div class="chip-row desk-company-switches">
                  ${createDeskSwitches(deskStates, state.company, language)}
                </div>
              </div>

              <div class="desk-hero-actions">
                <a class="button button-primary" href="${AIInsight.escapeHtml(searchHref)}">${AIInsight.escapeHtml(copy.openSearch)}</a>
                <a class="button button-secondary" href="${AIInsight.escapeHtml(watchHref)}">${AIInsight.escapeHtml(copy.openWatch)}</a>
                <a class="button button-secondary" href="list.html">${AIInsight.escapeHtml(copy.openFeed)}</a>
              </div>
            </div>

            <aside class="panel desk-side-panel page-fade">
              <span class="meta-label">${AIInsight.escapeHtml(copy.focusTitle)}</span>
              <h3>${AIInsight.escapeHtml(AIInsight.localize(selectedDesk.label, language))}</h3>
              <p class="panel-text">${AIInsight.escapeHtml(copy.focusNote)}</p>
              <div class="scan-rail desk-summary-rail">
                ${copy.stats
                  .map((item) => `
                    <article class="scan-card">
                      <span class="stat-label">${AIInsight.escapeHtml(item.label)}</span>
                      <strong class="scan-value">${AIInsight.escapeHtml(item.value)}</strong>
                    </article>
                  `)
                  .join("")}
              </div>
              <div class="pro-divider"></div>
              <span class="meta-label">${AIInsight.escapeHtml(copy.deskRuleTitle)}</span>
              <p class="panel-text">${AIInsight.escapeHtml(copy.deskRuleBody)}</p>
            </aside>
          </div>
        </section>

        ${AIInsight.createRefreshStatusCard(meta, language, { lead: copy.statusLead, compact: true })}

        ${
          archive.totalStories
            ? `
              <section class="section">
                <div class="section-head">
                  <div>
                    <h2>${AIInsight.escapeHtml(copy.currentTitle)}</h2>
                    <p class="section-note">${AIInsight.escapeHtml(copy.currentNote)}</p>
                  </div>
                </div>
                <div class="story-grid feed-grid">
                  ${featureStories.map((item) => AIInsight.createStoryCard(item, { language })).join("")}
                </div>
              </section>

              ${
                quickStories.length
                  ? `
                    <section class="section">
                      <div class="section-head">
                        <div>
                          <h2>${AIInsight.escapeHtml(copy.quickTitle)}</h2>
                          <p class="section-note">${AIInsight.escapeHtml(copy.quickNote)}</p>
                        </div>
                      </div>
                      <div class="signal-grid">
                        ${quickStories.map((item) => AIInsight.createSignalCard(item, { language })).join("")}
                      </div>
                    </section>
                  `
                  : ""
              }

              <section class="section">
                <div class="section-head">
                  <div>
                    <h2>${AIInsight.escapeHtml(copy.archiveTitle)}</h2>
                    <p class="section-note">${AIInsight.escapeHtml(copy.archiveNote)}</p>
                  </div>
                </div>
                <div class="desk-archive-stack">
                  ${timelineGroups.length
                    ? timelineGroups.map((group) => createMonthArchive(group, language, copy)).join("")
                    : AIInsight.createEmptyState(copy.archiveTitle, copy.archiveIntro)
                  }
                </div>
              </section>
            `
            : `
              <section class="section">
                ${AIInsight.createEmptyState(copy.emptyTitle, copy.emptyBody)}
              </section>
            `
        }
      </div>
    `;

    app.querySelectorAll("[data-desk-key]").forEach((button) => {
      button.addEventListener("click", () => {
        state.company = button.getAttribute("data-desk-key") || state.company;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

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
  document.addEventListener("ai-insight:view-mode", render);

  news = await AIInsight.getNews();
  render();
});

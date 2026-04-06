document.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("home-app");
  let news = [];

  await AIInsight.initShell("home");
  AIInsight.startAutoRefresh();

  function uniqueById(items) {
    const seen = new Set();

    return (Array.isArray(items) ? items : []).filter((item) => {
      const key = String(item && item.id);
      if (!item || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  function buildSearchText(item) {
    return [
      AIInsight.localize(item.title, "zh"),
      AIInsight.localize(item.title, "en"),
      AIInsight.localize(item.deck, "zh"),
      AIInsight.localize(item.deck, "en"),
      AIInsight.localize(item.insight, "zh"),
      AIInsight.localize(item.insight, "en"),
      AIInsight.localize(item.watchpoint, "zh"),
      AIInsight.localize(item.watchpoint, "en"),
      item.sourceName,
      item.sourceType,
      (item.tags || []).join(" ")
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function matchesKeywords(item, keywords) {
    const haystack = buildSearchText(item);
    return (keywords || []).some((keyword) => haystack.includes(String(keyword || "").toLowerCase()));
  }

  function pickStories(primary, fallback, limit) {
    return uniqueById([...(primary || []), ...(fallback || [])]).slice(0, limit);
  }

  function getModeProfile(viewMode) {
    const shared = {
      boardroomKeywords: ["openai", "anthropic", "claude", "microsoft", "copilot", "nvidia", "rtx", "google", "gemini", "xai", "musk", "meta"],
      chinaKeywords: ["alibaba", "qwen", "tencent", "hunyuan", "baidu", "deepseek", "minimax", "阿里", "腾讯", "百度", "通义", "混元", "豆包"],
      researchKeywords: ["research", "paper", "journal", "arxiv", "benchmark", "study", "evaluation", "reasoning"]
    };

    if (viewMode === "pro") {
      return {
        ...shared,
        liveLimit: 6,
        microLimit: 5,
        briefLimit: 5,
        boardroomLimit: 4,
        chinaLimit: 4,
        researchLimit: 4,
        journalLimit: 4,
        showProviders: true,
        showJournals: true,
        showQuickResearchRoute: true,
        videoLimit: 3,
        digestLimit: 8
      };
    }

    if (viewMode === "light") {
      return {
        ...shared,
        liveLimit: 6,
        microLimit: 5,
        briefLimit: 4,
        boardroomLimit: 3,
        chinaLimit: 3,
        researchLimit: 2,
        journalLimit: 0,
        showProviders: false,
        showJournals: false,
        showQuickResearchRoute: false,
        videoLimit: 3,
        digestLimit: 7
      };
    }

    return {
      ...shared,
      liveLimit: 5,
      microLimit: 5,
      briefLimit: 4,
      boardroomLimit: 3,
      chinaLimit: 3,
      researchLimit: 2,
      journalLimit: 0,
      showProviders: false,
      showJournals: false,
      showQuickResearchRoute: false,
      videoLimit: 2,
      digestLimit: 6
    };
  }

  function getCopy(language, meta, counts, viewMode) {
    const isPro = viewMode === "pro";
    const isLight = viewMode === "light";

    return {
      zh: {
        eyebrow: isPro ? "Professional AI Desk" : isLight ? "Global AI Digest" : "AI Pulse",
        title: isPro
          ? "把主线新闻、公司动态、工具雷达和期刊入口压进一个更专业的 AI 工作台"
          : isLight
            ? "先给用户一个清楚、耐看的 AI 日报入口，而不是堆满所有信息"
            : "更快地看到 AI 行业今天最值得扫一遍的新闻、工具和变化",
        lead: isPro
          ? "专业版不再只是换肤，而是把新闻主线、区域观察、开发者工具和期刊入口分层摆出来，减少跳出和来回寻找的负担。"
          : isLight
            ? "亮色版会优先给出更清楚的视觉层级和较低的认知负担，适合持续阅读与跨区域扫盘。"
            : "Pulse 会优先服务想快速了解 AI 行业发生了什么的人，减少首屏决策成本，把注意力集中在最值得点开的内容上。",
        primary: "进入资讯流",
        secondary: "按主题搜索",
        featuredLabel: isPro ? "值班主线" : "主线头条",
        statusLead: meta.remoteConnected
          ? "首页当前会把远端 live 源、站内精选和工具雷达合并展示。"
          : "当前首页仍会优先使用站内高信号内容，远端接口连通后会自动继续扩容。",
        digestTitle: "一分钟扫完",
        digestNote: "先把今天最该知道的变化压成短句，再决定点开哪几条深读。",
        routesTitle: "先从这里开始",
        routesNote: isPro
          ? "把最常用的几条入口压成服务台，先帮用户做对第一步，再进入更密的专业工作台。"
          : "先帮用户选对入口，而不是一上来面对整页内容。主线、公司、工具和视频各走一条清楚路径。",
        servicePeekLabel: "当前先看",
        serviceOpenLabel: "进入这个入口",
        serviceLeadLabel: "直接读这条",
        nowTitle: isPro ? "主线监测" : "大新闻",
        nowNote: isPro
          ? "这里保留高信号主线，不让工具和研究消息打散第一层注意力。"
          : "先用少量主线卡片建立今天的行业轮廓，再决定要不要深挖。",
        smallTitle: "小新闻",
        smallNote: "把公司更新、区域变化和次级动态压成一层更轻的跟进流，适合快速补齐上下文。",
        boardroomTitle: "公司与平台动向",
        boardroomNote: "优先看会改变平台入口、企业采用和资源分配的消息。",
        chinaTitle: "中国与区域观察",
        chinaNote: "补足国内厂商和亚洲市场，不让整站只剩美国公司视角。",
        companyDeskTitle: "核心公司专栏",
        companyDeskNote: "把英伟达、微软、OpenAI、Claude、苹果、Meta 单独拉出来，适合持续跟踪芯片、产品、模型和平台入口。",
        toolsTitle: "工具与开源 Radar",
        toolsNote: "专门放高信号小新闻、热门工具、GitHub 项目和本地模型接口路线。",
        watchDeskTitle: "视频与解读入口",
        watchDeskNote: "只在更可能真有视频价值的话题上给搜索路线，弱信号时就别硬塞 YouTube 或 B 站。",
        briefsTitle: "深度简报",
        briefsNote: "把热点之外更值得慢读的判断放在第二层，适合从“知道发生了什么”进入“理解为什么重要”。",
        providersTitle: "摘要引擎与开源接口",
        providersNote: "除了付费模型，现在也给了开源 / 本地兼容接口路线，后面接 Ollama、vLLM 会更顺。",
        proDeskTitle: "专业版工作台",
        proDeskNote: "把主线、区域、研究和期刊入口压成一个更像新闻终端的布局。",
        researchTitle: "研究与期刊入口",
        researchNote: "只在专业版里保留这层，避免普通用户被过多专业入口稀释注意力。",
        scanCards: [
          {
            label: "主线快讯",
            value: `${counts.live}`,
            note: "先抓今天行业在推进什么。"
          },
          {
            label: "工具信号",
            value: `${counts.tools}`,
            note: "再看开发者和普通用户真正会点开的东西。"
          },
          {
            label: "中国观察",
            value: `${counts.china}`,
            note: "保证全球视角不是单极叙事。"
          },
          {
            label: "专业来源",
            value: `${counts.sources}`,
            note: "专业版再进入论文和期刊。"
          }
        ]
      },
      en: {
        eyebrow: isPro ? "Professional AI Desk" : isLight ? "Global AI Digest" : "AI Pulse",
        title: isPro
          ? "Turn headline news, company movement, tooling radar, and journals into a denser AI workbench"
          : isLight
            ? "Give readers a clearer, calmer AI daily front page instead of a wall of information"
            : "See the AI news, launches, and shifts worth scanning first today",
        lead: isPro
          ? "Pro mode is no longer just a visual skin. It separates lead news, regional watch, developer tools, and journal routes so readers spend less time hunting."
          : isLight
            ? "Light mode prioritizes cleaner hierarchy and lower cognitive load for readers who want to stay longer and scan across regions."
            : "Pulse is tuned for readers who want the fastest useful snapshot of what changed in AI without too many early decisions.",
        primary: "Open the feed",
        secondary: "Search themes",
        featuredLabel: isPro ? "Duty lead" : "Lead story",
        statusLead: meta.remoteConnected
          ? "The homepage is now blending remote live updates, in-house curation, and the tooling radar."
          : "The homepage still leans on in-house high-signal coverage first and expands naturally once the remote endpoint responds.",
        digestTitle: "One-minute brief",
        digestNote: "Compress the key shifts into short lines first, then let readers decide which items deserve a full click.",
        routesTitle: "Start here",
        routesNote: isPro
          ? "Turn the most-used actions into a service desk first, then let expert readers go deeper into the workbench."
          : "Help readers choose the right door first instead of facing the whole site at once. Big news, company desks, tools, and watch routes each get a clear lane.",
        servicePeekLabel: "Start with",
        serviceOpenLabel: "Open this lane",
        serviceLeadLabel: "Read this now",
        nowTitle: isPro ? "Lead monitor" : "Big stories",
        nowNote: isPro
          ? "The first layer keeps the core signal intact instead of letting tools and research fragment attention."
          : "Use a small set of lead cards to build today’s map before deciding whether to go deeper.",
        smallTitle: "Small stories",
        smallNote: "Compress company movement, regional shifts, and secondary developments into a lighter follow-up lane.",
        boardroomTitle: "Company and platform movement",
        boardroomNote: "Focus on stories that change platform control, enterprise adoption, and resource positioning.",
        chinaTitle: "China and regional watch",
        chinaNote: "Balance the product so it does not default to a U.S.-only worldview.",
        companyDeskTitle: "Priority company desks",
        companyDeskNote: "Pull NVIDIA, Microsoft, OpenAI, Claude, Apple, and Meta into a standing lane for chips, products, models, and platform control.",
        toolsTitle: "Launches & OSS Radar",
        toolsNote: "A dedicated lane for high-signal small news, hot tools, GitHub projects, and local-model interface routes.",
        watchDeskTitle: "Video and explainer routes",
        watchDeskNote: "Only show watch routes when the topic is likely to have real video value instead of forcing weak YouTube or Bilibili links.",
        briefsTitle: "Deep briefs",
        briefsNote: "The second layer is reserved for slower, more interpretive reading after the headlines.",
        providersTitle: "Summary engines and OSS routes",
        providersNote: "Beyond paid APIs, the site now exposes an OSS and local-compatible route so Ollama or vLLM can fit more naturally later.",
        proDeskTitle: "Professional workbench",
        proDeskNote: "A denser homepage that behaves more like a news terminal than a marketing splash page.",
        researchTitle: "Research and journals",
        researchNote: "This lane stays inside Pro so casual readers are not diluted by too many expert entry points.",
        scanCards: [
          {
            label: "Lead updates",
            value: `${counts.live}`,
            note: "Start with what the industry is actively moving on."
          },
          {
            label: "Tool signals",
            value: `${counts.tools}`,
            note: "Then scan what builders and users may actually try."
          },
          {
            label: "China watch",
            value: `${counts.china}`,
            note: "Keep the global story from becoming one-pole coverage."
          },
          {
            label: "Research sources",
            value: `${counts.sources}`,
            note: "Only then step into journals and formal research."
          }
        ]
      }
    }[language];
  }

  function createMonitorCard(title, note, items, language, href) {
    return `
      <article class="monitor-card panel page-fade">
        <div class="monitor-card-head">
          <div>
            <span class="meta-label">${AIInsight.escapeHtml(language === "zh" ? "观察位" : "Watch lane")}</span>
            <h3>${AIInsight.escapeHtml(title)}</h3>
            <p class="panel-text">${AIInsight.escapeHtml(note)}</p>
          </div>
          ${href ? `<a class="story-link" href="${AIInsight.escapeHtml(href)}">${AIInsight.escapeHtml(language === "zh" ? "打开" : "Open")}</a>` : ""}
        </div>
        <div class="compact-stack">
          ${
            items.length
              ? items.map((item) => AIInsight.createStoryCard(item, { language, compact: true })).join("")
              : AIInsight.createEmptyState(
                  language === "zh" ? "内容准备中" : "Coverage loading",
                  language === "zh" ? "这条观察位会在有更多匹配内容后自动补齐。" : "This lane fills in automatically as more matching stories arrive."
                )
          }
        </div>
      </article>
    `;
  }

  function createDigestLine(item, language) {
    const quickRead = AIInsight.getStoryQuickRead(item, language);
    const company = AIInsight.getStoryCompanyLabel(item, language) || item.sourceName || "AI Insight";
    const summary = quickRead.why || quickRead.oneLine || AIInsight.getStoryLeadPreview(item, language, true);

    return `
      <a class="digest-line page-fade" href="detail.html?id=${item.id}">
        <div class="digest-line-top">
          <span class="ghost-badge">${AIInsight.escapeHtml(company)}</span>
          <span class="${AIInsight.getBadgeClass(item.signal)}">${AIInsight.escapeHtml(AIInsight.getSignalLabel(item.signal, language))}</span>
          <span class="ghost-badge">${AIInsight.escapeHtml(AIInsight.formatDate(item.date, language))}</span>
        </div>
        <strong>${AIInsight.escapeHtml(AIInsight.localize(item.title, language))}</strong>
        <p>${AIInsight.escapeHtml(summary)}</p>
      </a>
    `;
  }

  function createWatchCard(item, language) {
    const quickRead = AIInsight.getStoryQuickRead(item, language);
    const featuredLinks = AIInsight.getStoryVideoLinks(item, language).slice(0, 2);

    if (!featuredLinks.length) {
      return "";
    }

    return `
      <article class="video-launch-card panel page-fade">
        <div class="story-meta">
          <span class="ghost-badge">${AIInsight.escapeHtml(item.sourceName || "AI Insight")}</span>
          <span class="ghost-badge">${AIInsight.escapeHtml(AIInsight.getCategoryLabel(item.category, language))}</span>
        </div>
        <h3>${AIInsight.escapeHtml(AIInsight.localize(item.title, language))}</h3>
        <p class="panel-text">${AIInsight.escapeHtml(AIInsight.getStoryLeadPreview(item, language, true) || quickRead.oneLine)}</p>
        <div class="video-link-list">
          ${featuredLinks
            .map(
              (link) => `
                <a class="video-link-pill" href="${AIInsight.escapeHtml(link.url)}"${AIInsight.getExternalLinkAttributes()}>
                  <span>${AIInsight.escapeHtml(link.platform)}</span>
                  <strong>${AIInsight.escapeHtml(link.title)}</strong>
                </a>
              `
            )
            .join("")}
        </div>
      </article>
    `;
  }

  function createCompanyDeskCard(desk, language) {
    const leadStory = desk.story;
    const leadQuickRead = AIInsight.getStoryQuickRead(leadStory, language);
    const secondaryStories = (desk.stories || []).slice(1, 2);
    const deskHref = desk.href || AIInsight.getCompanyDeskHref(desk.key);
    const searchHref = `search.html?q=${encodeURIComponent(AIInsight.localize(desk.query, language))}`;
    const archiveLabel = language === "zh"
      ? `近几个月 ${desk.totalStories || desk.stories.length} 条归档`
      : `${desk.totalStories || desk.stories.length} stories in archive`;

    return `
      <article class="company-desk-card panel page-fade">
        <div class="company-desk-head">
          <div>
            <span class="meta-label">${AIInsight.escapeHtml(language === "zh" ? "重点公司" : "Priority desk")}</span>
            <h3>${AIInsight.escapeHtml(AIInsight.localize(desk.label, language))}</h3>
            <p class="panel-text">${AIInsight.escapeHtml(AIInsight.localize(desk.focus, language))}</p>
          </div>
          <a class="story-link" href="${AIInsight.escapeHtml(deskHref)}">${AIInsight.escapeHtml(language === "zh" ? "打开专栏" : "Open desk")}</a>
        </div>

        <div class="company-desk-story">
          <div class="story-meta">
            <span class="ghost-badge">${AIInsight.escapeHtml(leadStory.sourceName || "AI Insight")}</span>
            <span class="ghost-badge">${AIInsight.escapeHtml(archiveLabel)}</span>
          </div>
          <strong>${AIInsight.escapeHtml(AIInsight.localize(leadStory.title, language))}</strong>
          <p>${AIInsight.escapeHtml(leadQuickRead.oneLine)}</p>
        </div>

        ${
          secondaryStories.length
            ? `
              <div class="company-mini-list">
                ${secondaryStories
                  .map(
                    (story) => `
                      <a class="company-mini-link" href="detail.html?id=${story.id}">
                        ${AIInsight.escapeHtml(AIInsight.localize(story.title, language))}
                      </a>
                    `
                  )
                  .join("")}
              </div>
            `
            : ""
        }

        <div class="story-footer">
          <div class="story-links">
            <a class="story-link" href="detail.html?id=${leadStory.id}">${AIInsight.escapeHtml(AIInsight.t("common.viewDetail", language))}</a>
            <a class="story-link" href="${AIInsight.escapeHtml(deskHref)}">${AIInsight.escapeHtml(language === "zh" ? "看专栏归档" : "Browse archive")}</a>
            <a class="story-link" href="${AIInsight.escapeHtml(searchHref)}">${AIInsight.escapeHtml(language === "zh" ? "搜索相关" : "Search mentions")}</a>
          </div>
        </div>
      </article>
    `;
  }

  function createServiceLaneCard(route, pageCopy, language) {
    const leadTitle = route.story
      ? AIInsight.localize(route.story.title, language)
      : route.peekTitle;
    const leadPreview = route.story
      ? (AIInsight.getStoryLeadPreview(route.story, language, true) || AIInsight.getStoryQuickRead(route.story, language).oneLine)
      : route.peekNote;

    return `
      <article class="service-lane-card panel page-fade">
        <div class="service-lane-top">
          <span class="meta-label">${AIInsight.escapeHtml(language === "zh" ? "服务入口" : "Service lane")}</span>
          <span class="ghost-badge">${AIInsight.escapeHtml(route.metric)}</span>
        </div>
        <h3>${AIInsight.escapeHtml(route.title)}</h3>
        <p class="panel-text">${AIInsight.escapeHtml(route.note)}</p>

        <div class="service-peek">
          <span class="mini-label">${AIInsight.escapeHtml(pageCopy.servicePeekLabel)}</span>
          <strong>${AIInsight.escapeHtml(leadTitle || route.title)}</strong>
          ${leadPreview ? `<p>${AIInsight.escapeHtml(leadPreview)}</p>` : ""}
        </div>

        <div class="story-footer">
          <div class="story-links">
            <a class="story-link" href="${AIInsight.escapeHtml(route.href)}">${AIInsight.escapeHtml(pageCopy.serviceOpenLabel)}</a>
            ${
              route.story
                ? `<a class="story-link" href="detail.html?id=${route.story.id}">${AIInsight.escapeHtml(pageCopy.serviceLeadLabel)}</a>`
                : ""
            }
          </div>
        </div>
      </article>
    `;
  }

  function render() {
    const language = AIInsight.getLanguage();
    const viewMode = AIInsight.getViewMode();
    const profile = getModeProfile(viewMode);
    const compactViewport = window.matchMedia("(max-width: 820px)").matches;
    const meta = AIInsight.getNewsMeta();

    if (!news.length) {
      document.title = "AI Insight";
      app.innerHTML = `
        <div class="page-shell">
        ${AIInsight.createRefreshStatusCard(meta, language, { compact: true })}
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

    const rawHeadlineStories = AIInsight.getHeadlineStories(news);
    const rawLiveStories = AIInsight.getLiveStories(news).filter((item) => !AIInsight.isMicroStory(item));
    const rawMicroStories = AIInsight.getMicroStories(news);
    const headlineStories = AIInsight.limitStoriesPerCompany(rawHeadlineStories, { maxPerCompany: 2, maxFallback: 2 });
    const allLiveStories = AIInsight.limitStoriesPerCompany(rawLiveStories, { maxPerCompany: 1, maxFallback: 2 });
    const allMicroStories = AIInsight.limitStoriesPerCompany(rawMicroStories, { maxPerCompany: 1, maxFallback: 2 });
    const editorialStories = headlineStories.filter((item) => !AIInsight.isLiveItem(item));
    const researchSources = AIInsight.getJournalSources();
    const liveStories = allLiveStories.slice(0, compactViewport ? Math.min(profile.liveLimit, 3) : profile.liveLimit);
    const microStories = allMicroStories.slice(0, compactViewport ? Math.min(profile.microLimit, 3) : profile.microLimit);
    const briefStories = AIInsight.limitStoriesPerCompany(
      (editorialStories.length ? editorialStories : headlineStories.filter((item) => !AIInsight.isMicroStory(item))),
      { maxPerCompany: 1, maxFallback: 2 }
    ).slice(0, compactViewport ? Math.min(profile.briefLimit, 2) : profile.briefLimit);
    const boardroomStories = AIInsight.limitStoriesPerCompany(pickStories(
      headlineStories.filter((item) => !AIInsight.isMicroStory(item) && matchesKeywords(item, profile.boardroomKeywords)),
      headlineStories.filter((item) => !AIInsight.isMicroStory(item)),
      profile.boardroomLimit
    ), { maxPerCompany: 1, maxFallback: 2 });
    const chinaStories = AIInsight.limitStoriesPerCompany(pickStories(
      headlineStories.filter((item) => !AIInsight.isMicroStory(item) && (item.region === "china" || matchesKeywords(item, profile.chinaKeywords))),
      headlineStories.filter((item) => !AIInsight.isMicroStory(item) && item.region !== "global"),
      profile.chinaLimit
    ), { maxPerCompany: 1, maxFallback: 2 });
    const researchStories = AIInsight.limitStoriesPerCompany(pickStories(
      headlineStories.filter((item) => !AIInsight.isMicroStory(item) && (item.category === "research" || matchesKeywords(item, profile.researchKeywords))),
      editorialStories,
      profile.researchLimit
    ), { maxPerCompany: 1, maxFallback: 2 });
    const featured = uniqueById([...boardroomStories, ...allLiveStories, ...briefStories, ...headlineStories])[0] || news[0];
    const liveIds = new Set(liveStories.map((item) => String(item.id)));
    const featuredId = String(featured.id);
    const smallStories = AIInsight.limitStoriesPerCompany(uniqueById([
      ...boardroomStories,
      ...chinaStories,
      ...headlineStories.filter((item) => !AIInsight.isMicroStory(item))
    ]), { maxPerCompany: 1, maxFallback: 2 })
      .filter((item) => String(item.id) !== featuredId && !liveIds.has(String(item.id)))
      .slice(0, compactViewport ? 5 : 8);
    const digestStories = uniqueById([
      featured,
      ...liveStories,
      ...smallStories,
      ...briefStories,
      ...microStories
    ]).slice(0, compactViewport ? Math.min(profile.digestLimit, 5) : profile.digestLimit);
    const watchStories = AIInsight.limitStoriesPerCompany(
      uniqueById([...allLiveStories, ...allMicroStories, ...headlineStories]).filter((item) => AIInsight.getStoryVideoLinks(item, language).length),
      { maxPerCompany: 1, maxFallback: 1 }
    ).slice(0, compactViewport ? Math.min(profile.videoLimit, 2) : profile.videoLimit);
    const companyDesks = AIInsight.getCompanyDeskStories(news).slice(0, compactViewport ? 4 : 6);
    const latestDate = AIInsight.formatDateTime(meta.refreshedAt || news[0].date, language);
    const counts = {
      live: allLiveStories.length,
      tools: allMicroStories.length,
      china: headlineStories.filter((item) => item.region === "china" || matchesKeywords(item, profile.chinaKeywords)).length,
      sources: researchSources.length,
      total: news.length
    };
    const pageCopy = getCopy(language, meta, counts, viewMode);
    const featuredSummary = AIInsight.getStoryCardSummary(featured, language);
    const serviceLanes = [
      {
        title: language === "zh" ? "实时新闻" : "Live news",
        note: language === "zh" ? "先扫一遍高时效新闻，再决定要不要深入。" : "Scan the highest-tempo coverage before going deeper.",
        href: "list.html?format=live",
        metric: language === "zh" ? `${counts.live} 条主线` : `${counts.live} lead items`,
        story: liveStories[0] || featured
      },
      {
        title: language === "zh" ? "公司专栏" : "Company desks",
        note: language === "zh" ? "把英伟达、微软、OpenAI 这类大公司拆成长期档案，不和每日流混在一起。" : "Separate major companies such as NVIDIA, Microsoft, and OpenAI into standing archives instead of mixing them into the daily stream.",
        href: "desks.html",
        metric: language === "zh" ? `${companyDesks.length} 个重点公司` : `${companyDesks.length} tracked companies`,
        story: companyDesks[0] ? companyDesks[0].story : null,
        peekTitle: companyDesks[0] ? AIInsight.localize(companyDesks[0].label, language) : (language === "zh" ? "重点公司档案" : "Priority company archive"),
        peekNote: companyDesks[0] ? AIInsight.localize(companyDesks[0].focus, language) : ""
      },
      {
        title: language === "zh" ? "工具与开源" : "Tools & OSS",
        note: language === "zh" ? "先看最近值得试的新工具、接口和 GitHub 动向，再决定要不要深读。" : "Start with the newest tools, interfaces, and GitHub movement before committing to deeper reading.",
        href: "list.html?format=tools",
        metric: language === "zh" ? `${counts.tools} 条工具信号` : `${counts.tools} tool signals`,
        story: microStories[0] || allMicroStories[0]
      },
      {
        title: language === "zh" ? "视频与解读" : "Watch routes",
        note: language === "zh" ? "直接跳到原始视频、英文分析和中文解读入口。" : "Jump to original videos, English analysis, and Chinese explainers.",
        href: "watch.html",
        metric: language === "zh" ? `${watchStories.length} 条观看路线` : `${watchStories.length} watch routes`,
        story: watchStories[0] || null,
        peekTitle: watchStories[0] ? AIInsight.localize(watchStories[0].title, language) : (language === "zh" ? "原视频与解读入口" : "Video and explainer routes"),
        peekNote: watchStories[0] ? AIInsight.getStoryLeadPreview(watchStories[0], language, true) : ""
      }
    ];

    if (profile.showQuickResearchRoute && (researchStories[0] || researchSources[0])) {
      serviceLanes.push({
        title: language === "zh" ? "期刊与来源" : "Journals & sources",
        note: language === "zh" ? "在专业模式里直接进入期刊、会议和预印本入口。" : "Jump straight into journals, conferences, and preprints in Pro mode.",
        href: "sources.html",
        metric: language === "zh" ? `${researchSources.length} 个专业来源` : `${researchSources.length} research sources`,
        story: researchStories[0] || null,
        peekTitle: researchStories[0]
          ? AIInsight.localize(researchStories[0].title, language)
          : AIInsight.localize(researchSources[0].title, language),
        peekNote: researchStories[0]
          ? AIInsight.getStoryLeadPreview(researchStories[0], language, true)
          : AIInsight.localize(researchSources[0].summary, language)
      });
    }

    document.title = language === "zh" ? "AI Insight | 全球 AI 实时资讯情报台" : "AI Insight | Global AI live intelligence desk";

    app.innerHTML = `
      <div class="page-shell">
        <section class="hero home-hero page-fade">
          <div class="hero-grid">
            <div>
              <span class="eyebrow">${AIInsight.escapeHtml(pageCopy.eyebrow)}</span>
              <h1>${AIInsight.escapeHtml(pageCopy.title)}</h1>
              <p class="lead">${AIInsight.escapeHtml(pageCopy.lead)}</p>
              <div class="hero-actions">
                <a class="button button-primary" href="list.html">${AIInsight.escapeHtml(pageCopy.primary)}</a>
                <a class="button button-secondary" href="search.html">${AIInsight.escapeHtml(pageCopy.secondary)}</a>
              </div>
              <div class="hero-note-row">
                <span class="ghost-badge">${AIInsight.escapeHtml(language === "zh" ? "最近刷新" : "Last refresh")}: ${AIInsight.escapeHtml(latestDate)}</span>
                <span class="ghost-badge">${AIInsight.escapeHtml(language === "zh" ? "全站内容" : "All coverage")}: ${AIInsight.escapeHtml(String(counts.total))}</span>
                <span class="ghost-badge">${AIInsight.escapeHtml(language === "zh" ? "当前模式" : "Current mode")}: ${AIInsight.escapeHtml(viewMode === "pro" ? "Pro" : viewMode === "light" ? "Light" : "Pulse")}</span>
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
                <p class="lead">${AIInsight.escapeHtml(AIInsight.getStoryLeadPreview(featured, language))}</p>
                <div class="story-source">
                  <span>${AIInsight.escapeHtml(AIInsight.t("common.source", language))}</span>
                  <strong>${AIInsight.escapeHtml(featured.sourceName || "AI Insight")}</strong>
                  <span>·</span>
                  <span>${AIInsight.escapeHtml(AIInsight.formatDate(featured.date, language))}</span>
                </div>
              </div>

              <div class="featured-stack">
                ${AIInsight.createMiniInsightCard(
                  AIInsight.t(featuredSummary.labelKey, language),
                  AIInsight.isLiveItem(featured) ? AIInsight.t("common.sourceBacked", language) : AIInsight.t("common.summarySeed", language),
                  featuredSummary.text
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

        ${AIInsight.createRefreshStatusCard(meta, language, { lead: pageCopy.statusLead, compact: true })}

        <section class="section">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(pageCopy.digestTitle)}</h2>
              <p class="section-note">${AIInsight.escapeHtml(pageCopy.digestNote)}</p>
            </div>
          </div>
          <div class="digest-board panel">
            ${digestStories.map((item) => createDigestLine(item, language)).join("")}
          </div>
        </section>

        <section class="section">
          <div class="scan-rail">
            ${pageCopy.scanCards
              .filter((item, index) => profile.showJournals || index < 3)
              .map(
                (card) => `
                  <article class="scan-card page-fade">
                    <span class="stat-label">${AIInsight.escapeHtml(card.label)}</span>
                    <strong class="scan-value">${AIInsight.escapeHtml(card.value)}</strong>
                    <p class="scan-note">${AIInsight.escapeHtml(card.note)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(pageCopy.routesTitle)}</h2>
              <p class="section-note">${AIInsight.escapeHtml(pageCopy.routesNote)}</p>
            </div>
          </div>
          <div class="promise-grid home-service-grid">
            ${serviceLanes
              .map((route) => createServiceLaneCard(route, pageCopy, language))
              .join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(pageCopy.companyDeskTitle)}</h2>
              <p class="section-note">${AIInsight.escapeHtml(pageCopy.companyDeskNote)}</p>
            </div>
          </div>
          <div class="company-desk-grid">
            ${companyDesks.length
              ? companyDesks.map((desk) => createCompanyDeskCard(desk, language)).join("")
              : AIInsight.createEmptyState(pageCopy.companyDeskTitle, pageCopy.companyDeskNote)
            }
          </div>
        </section>

        ${
          viewMode === "pro"
            ? `
              <section class="section">
                <div class="section-head">
                  <div>
                    <h2>${AIInsight.escapeHtml(pageCopy.proDeskTitle)}</h2>
                    <p class="section-note">${AIInsight.escapeHtml(pageCopy.proDeskNote)}</p>
                  </div>
                </div>
                <div class="pro-home-grid">
                  <article class="pro-home-column panel page-fade">
                    <div class="monitor-card-head">
                      <div>
                        <span class="meta-label">${AIInsight.escapeHtml(language === "zh" ? "主线" : "Lead")}</span>
                        <h3>${AIInsight.escapeHtml(pageCopy.nowTitle)}</h3>
                        <p class="panel-text">${AIInsight.escapeHtml(pageCopy.nowNote)}</p>
                      </div>
                    </div>
                    <div class="compact-stack">
                      ${liveStories.map((item) => AIInsight.createStoryCard(item, { language, compact: true })).join("")}
                    </div>
                  </article>

                  <article class="pro-home-column panel page-fade">
                    <div class="monitor-card-head">
                      <div>
                        <span class="meta-label">${AIInsight.escapeHtml(language === "zh" ? "平台与区域" : "Platform & region")}</span>
                        <h3>${AIInsight.escapeHtml(pageCopy.boardroomTitle)}</h3>
                        <p class="panel-text">${AIInsight.escapeHtml(pageCopy.boardroomNote)}</p>
                      </div>
                    </div>
                    <div class="compact-stack">
                      ${boardroomStories.map((item) => AIInsight.createStoryCard(item, { language, compact: true })).join("")}
                    </div>
                    <div class="pro-divider"></div>
                    <div class="monitor-card-head">
                      <div>
                        <h3>${AIInsight.escapeHtml(pageCopy.chinaTitle)}</h3>
                        <p class="panel-text">${AIInsight.escapeHtml(pageCopy.chinaNote)}</p>
                      </div>
                    </div>
                    <div class="compact-stack">
                      ${chinaStories.map((item) => AIInsight.createStoryCard(item, { language, compact: true })).join("")}
                    </div>
                  </article>

                  <article class="pro-home-column panel page-fade">
                    <div class="monitor-card-head">
                      <div>
                        <span class="meta-label">${AIInsight.escapeHtml(language === "zh" ? "研究台" : "Research desk")}</span>
                        <h3>${AIInsight.escapeHtml(pageCopy.researchTitle)}</h3>
                        <p class="panel-text">${AIInsight.escapeHtml(pageCopy.researchNote)}</p>
                      </div>
                      <a class="story-link" href="sources.html">${AIInsight.escapeHtml(AIInsight.t("nav.sources", language))}</a>
                    </div>
                    <div class="compact-stack">
                      ${researchStories.map((item) => AIInsight.createStoryCard(item, { language, compact: true })).join("")}
                    </div>
                    <div class="mini-journal-grid">
                      ${researchSources.slice(0, profile.journalLimit).map((item) => AIInsight.createJournalCard(item, language)).join("")}
                    </div>
                  </article>
                </div>
              </section>
            `
            : `
              <section class="section">
                <div class="section-head">
                  <div>
                    <h2>${AIInsight.escapeHtml(pageCopy.nowTitle)}</h2>
                    <p class="section-note">${AIInsight.escapeHtml(pageCopy.nowNote)}</p>
                  </div>
                </div>
                <div class="story-grid feed-grid">
                  ${liveStories.map((item) => AIInsight.createStoryCard(item, { language })).join("")}
                </div>
              </section>

              <section class="section">
                <div class="section-head">
                  <div>
                    <h2>${AIInsight.escapeHtml(pageCopy.smallTitle)}</h2>
                    <p class="section-note">${AIInsight.escapeHtml(pageCopy.smallNote)}</p>
                  </div>
                </div>
                <div class="story-grid feed-grid">
                  ${smallStories.map((item) => AIInsight.createStoryCard(item, { language, compact: true })).join("")}
                </div>
              </section>
            `
        }

        <section class="section">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(pageCopy.toolsTitle)}</h2>
              <p class="section-note">${AIInsight.escapeHtml(pageCopy.toolsNote)}</p>
            </div>
          </div>
          <div class="signal-grid">
            ${microStories.length ? microStories.map((item) => AIInsight.createSignalCard(item, { language })).join("") : AIInsight.createEmptyState(pageCopy.toolsTitle, pageCopy.toolsNote)}
          </div>
        </section>

        <section class="section" id="watch-desk">
          <div class="section-head">
            <div>
              <h2>${AIInsight.escapeHtml(pageCopy.watchDeskTitle)}</h2>
              <p class="section-note">${AIInsight.escapeHtml(pageCopy.watchDeskNote)}</p>
            </div>
          </div>
          <div class="video-launch-grid">
            ${watchStories.map((item) => createWatchCard(item, language)).join("")}
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
            ${briefStories.map((item) => AIInsight.createStoryCard(item, { language, compact: true })).join("")}
          </div>
        </section>

        ${
          profile.showProviders
            ? `
              <section class="section">
                <div class="section-head">
                  <div>
                    <h2>${AIInsight.escapeHtml(pageCopy.providersTitle)}</h2>
                    <p class="section-note">${AIInsight.escapeHtml(pageCopy.providersNote)}</p>
                  </div>
                </div>
                <div class="provider-grid">
                  ${AIInsight.createProviderCards(language)}
                </div>
              </section>
            `
            : `
              <section class="section">
                <article class="insight-card page-fade">
                  <span class="meta-label">${AIInsight.escapeHtml(language === "zh" ? "摘要路线" : "Summary route")}</span>
                  <h3>${AIInsight.escapeHtml(pageCopy.providersTitle)}</h3>
                  <p>${AIInsight.escapeHtml(pageCopy.providersNote)}</p>
                  <div class="story-links">
                    <a class="story-link" href="detail.html?id=${featured.id}">${AIInsight.escapeHtml(language === "zh" ? "去详情页试摘要" : "Try a summary in detail view")}</a>
                  </div>
                </article>
              </section>
            `
        }
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
  document.addEventListener("ai-insight:view-mode", render);
  window.addEventListener("resize", render);

  news = await AIInsight.getNews();
  render();
});

document.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("account-app");
  let news = [];
  let pendingAction = "";
  let flash = {
    type: "",
    message: ""
  };

  await AIInsight.initShell("account");

  function getCopy(language) {
    return {
      zh: {
        eyebrow: "Account & Sync",
        title: "把你的 AI 资讯偏好变成可同步的个人工作台",
        lead: "这里不做复杂后台，只把最有价值的三层状态云端化：收藏、Radar 主题、以及每日 Briefing 设置。这样这个站会开始真正记住你。",
        stats: [
          {
            label: "已收藏文章",
            helper: "跨设备同步后，Briefing 会更稳定。"
          },
          {
            label: "已收藏来源",
            helper: "把期刊和专业入口一起带走。"
          },
          {
            label: "Radar 主题",
            helper: "持续追踪你真正关心的方向。"
          },
          {
            label: "每日 Briefing",
            helper: "把阅读节奏固定下来。"
          }
        ],
        remoteOffTitle: "当前不是可同步模式",
        remoteOffBody: "你现在可能是直接打开本地文件，或还没有通过带后端的地址访问站点。请通过本地服务器或线上部署访问，这样账号和云端同步才会启用。",
        loginTitle: "登录已有账号",
        loginNote: "登录后会自动把当前设备上的收藏和偏好并入云端。",
        registerTitle: "创建轻量账号",
        registerNote: "这是一个产品级原型账号层，先解决同步，再慢慢加重功能。",
        nameLabel: "显示名称",
        emailLabel: "邮箱",
        passwordLabel: "密码",
        passwordHint: "至少 8 位",
        loginAction: "登录",
        registerAction: "创建账号",
        signedInTitle: "同步已经开启",
        signedInBody: "账号层会持续同步收藏文章、收藏来源、Radar 主题、语言、视图模式、摘要引擎和每日 Briefing 设置。",
        syncNow: "立即同步",
        signOut: "退出登录",
        syncedAt: "最近同步",
        notSyncedYet: "还没有同步记录",
        syncStatusTitle: "同步状态",
        syncIdle: "已就绪",
        syncQueued: "检测到本地改动，稍后会自动同步",
        syncing: "正在把你的状态写入云端",
        syncError: "同步暂时失败",
        syncSuccess: "云端同步已完成。",
        guestStatus: "当前还没有登录，站点会继续使用本地个性化。",
        briefingTitle: "每日 Briefing 设置",
        briefingBody: "先把站内每日简报的节奏存起来，后面再自然接邮件、通知或团队订阅。",
        briefingEnable: "启用每日 Briefing",
        briefingTime: "推送时间",
        briefingTimezone: "时区",
        briefingSave: "保存计划",
        scopeTitle: "会同步什么",
        scopeItems: [
          "收藏文章与专业来源",
          "Radar 追踪主题",
          "语言与界面模式",
          "AI 摘要引擎偏好",
          "每日 Briefing 时间设置"
        ],
        currentPrefs: "当前默认偏好",
        currentLanguage: "语言",
        currentMode: "阅读模式",
        currentSummary: "摘要引擎",
        openBriefing: "打开 My Briefing",
        openRadar: "打开 Radar",
        saveSuccess: "设置已保存并准备同步。",
        loginSuccess: "登录成功，云端状态已经接管当前设备。",
        registerSuccess: "账号创建成功，当前偏好已写入云端。",
        logoutSuccess: "已退出登录，本地偏好仍会保留。"
      },
      en: {
        eyebrow: "Account & Sync",
        title: "Turn your AI news preferences into a portable personal desk",
        lead: "This page stays intentionally light. It only syncs the state that really matters: saves, Radar themes, and daily briefing settings, so the product can start remembering you across devices.",
        stats: [
          {
            label: "Saved stories",
            helper: "Cloud sync makes your briefing more stable."
          },
          {
            label: "Saved sources",
            helper: "Carry research desks with you."
          },
          {
            label: "Radar themes",
            helper: "Keep following the directions you care about."
          },
          {
            label: "Daily briefing",
            helper: "Turn reading into a repeatable habit."
          }
        ],
        remoteOffTitle: "Cloud sync is not available on this origin",
        remoteOffBody: "You are likely opening static files directly or serving the site without the backend routes. Open the site through the local server or a deployed origin so account sync can turn on.",
        loginTitle: "Sign in",
        loginNote: "Signing in merges the current device state into your cloud profile.",
        registerTitle: "Create an account",
        registerNote: "This is a lightweight product account layer focused on sync first, not admin overhead.",
        nameLabel: "Display name",
        emailLabel: "Email",
        passwordLabel: "Password",
        passwordHint: "At least 8 characters",
        loginAction: "Sign in",
        registerAction: "Create account",
        signedInTitle: "Cloud sync is active",
        signedInBody: "The account layer now syncs saved stories, saved sources, Radar themes, language, view mode, summary engine, and daily briefing settings.",
        syncNow: "Sync now",
        signOut: "Sign out",
        syncedAt: "Last sync",
        notSyncedYet: "No sync yet",
        syncStatusTitle: "Sync status",
        syncIdle: "Ready",
        syncQueued: "Local changes detected and queued for sync",
        syncing: "Writing your state to the cloud now",
        syncError: "Sync is temporarily failing",
        syncSuccess: "Cloud sync completed.",
        guestStatus: "You are not signed in yet, so the site is still running on local personalization.",
        briefingTitle: "Daily briefing settings",
        briefingBody: "Persist the timing first, then layer email, notifications, or team delivery on top later.",
        briefingEnable: "Enable daily briefing",
        briefingTime: "Delivery time",
        briefingTimezone: "Time zone",
        briefingSave: "Save schedule",
        scopeTitle: "What syncs",
        scopeItems: [
          "Saved stories and professional sources",
          "Radar tracking topics",
          "Language and UI mode",
          "AI summary engine preference",
          "Daily briefing timing"
        ],
        currentPrefs: "Current defaults",
        currentLanguage: "Language",
        currentMode: "Reading mode",
        currentSummary: "Summary engine",
        openBriefing: "Open My Briefing",
        openRadar: "Open Radar",
        saveSuccess: "Settings saved and queued for sync.",
        loginSuccess: "Signed in and cloud state is now active on this device.",
        registerSuccess: "Account created and current preferences were written to the cloud.",
        logoutSuccess: "Signed out. Local preferences remain on this device."
      }
    }[language];
  }

  function getSyncStatusText(copy, language, account) {
    if (!account.remoteEnabled) {
      return copy.remoteOffBody;
    }

    if (account.syncStatus === "error") {
      return `${copy.syncError}${account.error ? ` | ${account.error}` : ""}`;
    }

    if (!account.authenticated) {
      return copy.guestStatus;
    }

    if (account.syncStatus === "syncing") {
      return copy.syncing;
    }

    if (account.syncStatus === "queued") {
      return copy.syncQueued;
    }

    const syncedAt = account.lastSyncedAt
      ? AIInsight.formatDateTime(account.lastSyncedAt, language)
      : copy.notSyncedYet;

    return `${copy.syncIdle} | ${copy.syncedAt}: ${syncedAt}`;
  }

  function getErrorMessage(copy, error) {
    const code = String(error && error.message ? error.message : "");

    if (code === "invalid_credentials") {
      return AIInsight.getLanguage() === "en" ? "Email or password is incorrect." : "邮箱或密码不正确。";
    }

    if (code === "invalid_email") {
      return AIInsight.getLanguage() === "en" ? "Please enter a valid email address." : "请输入有效的邮箱地址。";
    }

    if (code === "password_too_short") {
      return AIInsight.getLanguage() === "en" ? "Password must be at least 8 characters." : "密码至少需要 8 位。";
    }

    if (code === "email_already_exists") {
      return AIInsight.getLanguage() === "en" ? "This email is already registered." : "这个邮箱已经注册过了。";
    }

    if (code === "unauthorized") {
      return AIInsight.getLanguage() === "en" ? "Your session expired. Please sign in again." : "登录状态已过期，请重新登录。";
    }

    return code || (AIInsight.getLanguage() === "en" ? "Something went wrong." : "操作暂时失败，请稍后再试。");
  }

  function getViewModeLabel(language) {
    const mode = AIInsight.getViewMode();
    const labels = {
      pulse: language === "en" ? "Pulse" : "炫酷版",
      light: language === "en" ? "Light" : "亮色版",
      pro: language === "en" ? "Pro" : "专业版"
    };

    return labels[mode] || mode;
  }

  function renderFlash() {
    if (!flash.message) {
      return "";
    }

    return `
      <section class="panel account-flash page-fade ${flash.type === "error" ? "is-error" : "is-success"}">
        <p>${AIInsight.escapeHtml(flash.message)}</p>
      </section>
    `;
  }

  function render() {
    const language = AIInsight.getLanguage();
    const copy = getCopy(language);
    const account = AIInsight.getAccountState();
    const briefingSettings = AIInsight.getBriefingSettings();
    const summaryPreference = AIInsight.getSummaryPreference();
    const providerMeta = AIInsight.getProviderMeta(summaryPreference.provider);
    const savedStories = AIInsight.getSavedStories(news).length;
    const savedSources = AIInsight.getSavedSources().length;
    const trackedTopics = AIInsight.getTrackedTopics().length;
    const isBusy =
      pendingAction === "login" ||
      pendingAction === "register" ||
      pendingAction === "sync" ||
      pendingAction === "briefing" ||
      pendingAction === "logout";
    const syncText = getSyncStatusText(copy, language, account);
    const stats = [
      savedStories,
      savedSources,
      trackedTopics,
      briefingSettings.enabled ? (language === "en" ? "On" : "已开启") : (language === "en" ? "Off" : "未开启")
    ];
    const timeValue = `${String(briefingSettings.hour).padStart(2, "0")}:${String(briefingSettings.minute).padStart(2, "0")}`;

    document.title = language === "en" ? "AI Insight | Account" : "AI Insight | 账号";

    app.innerHTML = `
      <div class="page-shell">
        <section class="hero page-fade">
          <span class="eyebrow">${AIInsight.escapeHtml(copy.eyebrow)}</span>
          <h1>${AIInsight.escapeHtml(copy.title)}</h1>
          <p class="lead">${AIInsight.escapeHtml(copy.lead)}</p>
        </section>

        ${renderFlash()}

        <section class="section">
          <div class="stats-grid">
            ${copy.stats
              .map(
                (item, index) => `
                  <article class="stat-card page-fade">
                    <span class="stat-label">${AIInsight.escapeHtml(item.label)}</span>
                    <div class="stat-value">${AIInsight.escapeHtml(String(stats[index]))}</div>
                    <p class="stat-copy">${AIInsight.escapeHtml(item.helper)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>

        ${
          !account.remoteEnabled
            ? `
              <section class="panel account-offline page-fade">
                <h2>${AIInsight.escapeHtml(copy.remoteOffTitle)}</h2>
                <p class="panel-text">${AIInsight.escapeHtml(copy.remoteOffBody)}</p>
              </section>
            `
            : ""
        }

        ${
          !account.authenticated
            ? `
              <section class="auth-grid section">
                <article class="panel auth-card page-fade">
                  <span class="meta-label">Sync</span>
                  <h2>${AIInsight.escapeHtml(copy.loginTitle)}</h2>
                  <p class="panel-text">${AIInsight.escapeHtml(copy.loginNote)}</p>
                  <form class="auth-form" data-auth-form="login">
                    <label class="form-field">
                      <span>${AIInsight.escapeHtml(copy.emailLabel)}</span>
                      <input class="search-input" type="email" name="email" required autocomplete="email">
                    </label>
                    <label class="form-field">
                      <span>${AIInsight.escapeHtml(copy.passwordLabel)}</span>
                      <input class="search-input" type="password" name="password" required autocomplete="current-password">
                    </label>
                    <button class="button button-primary" type="submit" ${pendingAction === "login" ? "disabled" : ""}>
                      ${AIInsight.escapeHtml(pendingAction === "login" ? `${copy.loginAction}...` : copy.loginAction)}
                    </button>
                  </form>
                </article>

                <article class="panel auth-card page-fade">
                  <span class="meta-label">Account</span>
                  <h2>${AIInsight.escapeHtml(copy.registerTitle)}</h2>
                  <p class="panel-text">${AIInsight.escapeHtml(copy.registerNote)}</p>
                  <form class="auth-form" data-auth-form="register">
                    <label class="form-field">
                      <span>${AIInsight.escapeHtml(copy.nameLabel)}</span>
                      <input class="search-input" type="text" name="displayName" autocomplete="name">
                    </label>
                    <label class="form-field">
                      <span>${AIInsight.escapeHtml(copy.emailLabel)}</span>
                      <input class="search-input" type="email" name="email" required autocomplete="email">
                    </label>
                    <label class="form-field">
                      <span>${AIInsight.escapeHtml(copy.passwordLabel)}</span>
                      <input class="search-input" type="password" name="password" required minlength="8" autocomplete="new-password">
                      <small class="field-note">${AIInsight.escapeHtml(copy.passwordHint)}</small>
                    </label>
                    <button class="button button-primary" type="submit" ${pendingAction === "register" ? "disabled" : ""}>
                      ${AIInsight.escapeHtml(pendingAction === "register" ? `${copy.registerAction}...` : copy.registerAction)}
                    </button>
                  </form>
                </article>
              </section>
            `
            : `
              <section class="account-grid section">
                <article class="panel account-status-card page-fade">
                  <span class="meta-label">${AIInsight.escapeHtml(copy.syncStatusTitle)}</span>
                  <h2>${AIInsight.escapeHtml(copy.signedInTitle)}</h2>
                  <p class="panel-text">${AIInsight.escapeHtml(copy.signedInBody)}</p>
                  <div class="account-user-block">
                    <div>
                      <strong>${AIInsight.escapeHtml(account.user && account.user.displayName ? account.user.displayName : account.user && account.user.email ? account.user.email : "AI Insight")}</strong>
                      <p>${AIInsight.escapeHtml(account.user && account.user.email ? account.user.email : "")}</p>
                    </div>
                    <span class="ghost-badge">${AIInsight.escapeHtml(account.syncStatus || "ready")}</span>
                  </div>
                  <p class="panel-text">${AIInsight.escapeHtml(syncText)}</p>
                  <div class="topic-panel-actions">
                    <button class="button button-primary" type="button" data-account-sync ${isBusy ? "disabled" : ""}>${AIInsight.escapeHtml(copy.syncNow)}</button>
                    <button class="button button-secondary" type="button" data-account-logout ${pendingAction === "logout" ? "disabled" : ""}>${AIInsight.escapeHtml(copy.signOut)}</button>
                  </div>
                </article>

                <article class="panel briefing-settings-card page-fade">
                  <span class="meta-label">Briefing</span>
                  <h2>${AIInsight.escapeHtml(copy.briefingTitle)}</h2>
                  <p class="panel-text">${AIInsight.escapeHtml(copy.briefingBody)}</p>
                  <form class="auth-form" data-briefing-form="true">
                    <label class="checkbox-line">
                      <input type="checkbox" name="enabled" ${briefingSettings.enabled ? "checked" : ""}>
                      <span>${AIInsight.escapeHtml(copy.briefingEnable)}</span>
                    </label>
                    <div class="field-grid">
                      <label class="form-field">
                        <span>${AIInsight.escapeHtml(copy.briefingTime)}</span>
                        <input class="search-input" type="time" name="time" value="${AIInsight.escapeHtml(timeValue)}">
                      </label>
                      <label class="form-field">
                        <span>${AIInsight.escapeHtml(copy.briefingTimezone)}</span>
                        <input class="search-input" type="text" name="timezone" value="${AIInsight.escapeHtml(briefingSettings.timezone)}">
                      </label>
                    </div>
                    <button class="button button-primary" type="submit" ${pendingAction === "briefing" ? "disabled" : ""}>
                      ${AIInsight.escapeHtml(pendingAction === "briefing" ? `${copy.briefingSave}...` : copy.briefingSave)}
                    </button>
                  </form>
                </article>

                <article class="panel account-scope-card page-fade">
                  <span class="meta-label">Desk</span>
                  <h2>${AIInsight.escapeHtml(copy.scopeTitle)}</h2>
                  <ul class="detail-list">
                    ${copy.scopeItems.map((item) => `<li>${AIInsight.escapeHtml(item)}</li>`).join("")}
                  </ul>
                  <div class="account-pref-strip">
                    <span class="ghost-badge">${AIInsight.escapeHtml(`${copy.currentLanguage}: ${language === "en" ? "English" : "中文"}`)}</span>
                    <span class="ghost-badge">${AIInsight.escapeHtml(`${copy.currentMode}: ${getViewModeLabel(language)}`)}</span>
                    <span class="ghost-badge">${AIInsight.escapeHtml(`${copy.currentSummary}: ${AIInsight.localize(providerMeta.label, language)}`)}</span>
                  </div>
                  <div class="topic-panel-actions">
                    <a class="button button-secondary" href="briefing.html">${AIInsight.escapeHtml(copy.openBriefing)}</a>
                    <a class="button button-secondary" href="radar.html">${AIInsight.escapeHtml(copy.openRadar)}</a>
                  </div>
                </article>
              </section>
            `
        }
      </div>
    `;

    app.querySelectorAll("[data-auth-form]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!AIInsight.getAccountState().remoteEnabled) {
          flash = {
            type: "error",
            message: copy.remoteOffBody
          };
          render();
          return;
        }

        const formData = new FormData(form);
        const mode = form.dataset.authForm;
        pendingAction = mode;
        flash = { type: "", message: "" };
        render();

        try {
          if (mode === "register") {
            await AIInsight.registerAccount({
              displayName: formData.get("displayName"),
              email: formData.get("email"),
              password: formData.get("password")
            });
            flash = {
              type: "success",
              message: copy.registerSuccess
            };
          } else {
            await AIInsight.loginAccount({
              email: formData.get("email"),
              password: formData.get("password")
            });
            flash = {
              type: "success",
              message: copy.loginSuccess
            };
          }
        } catch (error) {
          flash = {
            type: "error",
            message: getErrorMessage(copy, error)
          };
        } finally {
          pendingAction = "";
          render();
        }
      });
    });

    const syncButton = app.querySelector("[data-account-sync]");
    if (syncButton) {
      syncButton.addEventListener("click", async () => {
        pendingAction = "sync";
        flash = { type: "", message: "" };
        render();

        try {
          await AIInsight.syncAccountState({ reason: "manual" });
          flash = {
            type: "success",
            message: copy.syncSuccess
          };
        } catch (error) {
          flash = {
            type: "error",
            message: getErrorMessage(copy, error)
          };
        } finally {
          pendingAction = "";
          render();
        }
      });
    }

    const logoutButton = app.querySelector("[data-account-logout]");
    if (logoutButton) {
      logoutButton.addEventListener("click", async () => {
        pendingAction = "logout";
        render();

        try {
          await AIInsight.logoutAccount();
          flash = {
            type: "success",
            message: copy.logoutSuccess
          };
        } finally {
          pendingAction = "";
          render();
        }
      });
    }

    const briefingForm = app.querySelector("[data-briefing-form]");
    if (briefingForm) {
      briefingForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(briefingForm);
        const timeValue = String(formData.get("time") || "08:00");
        const [hourRaw, minuteRaw] = timeValue.split(":");

        pendingAction = "briefing";
        flash = { type: "", message: "" };
        render();

        try {
          AIInsight.updateBriefingSettings({
            enabled: formData.get("enabled") === "on",
            hour: Number(hourRaw) || 8,
            minute: Number(minuteRaw) || 0,
            timezone: formData.get("timezone")
          });
          await AIInsight.syncAccountState({ reason: "briefing" });
          flash = {
            type: "success",
            message: copy.saveSuccess
          };
        } catch (error) {
          flash = {
            type: "error",
            message: getErrorMessage(copy, error)
          };
        } finally {
          pendingAction = "";
          render();
        }
      });
    }
  }

  document.addEventListener("ai-insight:language", render);
  document.addEventListener("ai-insight:view-mode", render);
  document.addEventListener("ai-insight:summary-preference", render);
  document.addEventListener("ai-insight:saved-stories", render);
  document.addEventListener("ai-insight:saved-sources", render);
  document.addEventListener("ai-insight:tracked-topics", render);
  document.addEventListener("ai-insight:briefing-settings", render);
  document.addEventListener("ai-insight:account-state", render);

  render();

  try {
    news = await AIInsight.getNews();
  } catch (error) {
    news = [];
  }

  render();
});

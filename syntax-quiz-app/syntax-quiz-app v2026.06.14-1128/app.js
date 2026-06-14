(function () {
  "use strict";

  const CONFIG = {
    itemSeconds: 15,
    maxSessionSeconds: 20 * 60,
    maxSyntax: 100,
    minManualStop: 30,
    timedMilestones: [30, 50],
    achievementMilestones: [10, 20, 30, 45, 50, 60, 75, 80, 100],
    storageKey: "syntax-relay-sessions"
  };

  const APP_VERSION = "v2026.06.14-1128";

  const ACHIEVEMENT_MESSAGES = {
    10: "Eh, sudah 10. Pemanasan selesai, otaknya mulai nyala pelan-pelan 🔥",
    20: "20 sintaks? Oke... ini mulai kelihatan bukan sekadar nebak-nebak 🤔",
    30: "30 tercapai. Pengawas mulai melirik timer, dan itu masuk akal ⏱️",
    45: "45? Tunggu dulu, ini sudah terlalu rapi untuk disebut kebetulan 😳",
    50: "50 sintaks. Separuh jalan menuju batas 100, dan itu mulai terasa serius ✅",
    60: "60. Diam-diam jauh juga, ya. Kepala masih belum berasap? 🧠",
    75: "75. Ini sudah masuk wilayah maraton kecil, bukan sprint lagi 🏁",
    80: "80? Sebentar... tadi siapa yang bilang cuma coba-coba? 😮",
    100: "100 sintaks. Ruangan boleh pura-pura biasa saja, tapi itu lumayan gila 🎉"
  };

  const bank = window.SYNTAX_BANK || [];
  const $ = (id) => document.getElementById(id);

  const el = {
    localClock: $("localClock"),
    bankCount: $("bankCount"),
    storageState: $("storageState"),
    setupBankCount: $("setupBankCount"),
    setupView: $("setupView"),
    quizView: $("quizView"),
    resultsView: $("resultsView"),
    setupForm: $("setupForm"),
    participantName: $("participantName"),
    supervisorName: $("supervisorName"),
    orderMode: $("orderMode"),
    languageMode: $("languageMode"),
    difficultyMode: $("difficultyMode"),
    appVersion: $("appVersion"),
    sessionPeople: $("sessionPeople"),
    pauseButton: $("pauseButton"),
    resumeButton: $("resumeButton"),
    stopButton: $("stopButton"),
    syntaxRing: $("syntaxRing"),
    syntaxTimer: $("syntaxTimer"),
    currentNumber: $("currentNumber"),
    answeredCount: $("answeredCount"),
    sessionRemaining: $("sessionRemaining"),
    currentTimestamp: $("currentTimestamp"),
    quizStatus: $("quizStatus"),
    answerForm: $("answerForm"),
    languageBadge: $("languageBadge"),
    syntaxKeyword: $("syntaxKeyword"),
    answerInput: $("answerInput"),
    submitAnswer: $("submitAnswer"),
    resultSessionMeta: $("resultSessionMeta"),
    finishReason: $("finishReason"),
    finalAnswered: $("finalAnswered"),
    validCount: $("validCount"),
    invalidCount: $("invalidCount"),
    finalDuration: $("finalDuration"),
    timeAt30: $("timeAt30"),
    timeAt50: $("timeAt50"),
    answerRows: $("answerRows"),
    achievementStack: $("achievementStack"),
    copyPayload: $("copyPayload"),
    downloadCsv: $("downloadCsv"),
    downloadSpreadsheet: $("downloadSpreadsheet"),
    downloadJson: $("downloadJson"),
    newSession: $("newSession")
  };

  let state = null;
  let ticker = null;
  let clockTicker = null;

  function init() {
    if (bank.length !== 1000) {
      setStorageState(`Bank keyword tidak valid: ${bank.length}`, "danger");
      return;
    }

    el.bankCount.textContent = `${bank.length} keyword`;
    el.setupBankCount.textContent = String(bank.length);
    el.appVersion.textContent = APP_VERSION;
    el.answerForm.noValidate = true;
    renderLocalClock();
    clockTicker = window.setInterval(renderLocalClock, 1000);

    el.setupForm.addEventListener("submit", startSession);
    el.answerForm.addEventListener("submit", submitAnswer);
    el.answerInput.addEventListener("keydown", submitWithEnter);
    el.pauseButton.addEventListener("click", pauseSession);
    el.resumeButton.addEventListener("click", resumeSession);
    el.stopButton.addEventListener("click", stopSessionManually);
    el.answerRows.addEventListener("click", updateValidation);
    el.copyPayload.addEventListener("click", copyPayload);
    el.downloadCsv.addEventListener("click", () => downloadFile("csv"));
    el.downloadSpreadsheet.addEventListener("click", () => downloadFile("xls"));
    el.downloadJson.addEventListener("click", () => downloadFile("json"));
    el.newSession.addEventListener("click", resetToSetup);
  }

  function startSession(event) {
    event.preventDefault();

    const participant = el.participantName.value.trim();
    const supervisor = el.supervisorName.value.trim();

    if (!participant || !supervisor) {
      el.setupForm.reportValidity();
      return;
    }

    const languageMode = el.languageMode.value;
    const difficultyMode = el.difficultyMode.value;
    const order = buildSessionOrder(el.orderMode.value, languageMode, difficultyMode);

    state = {
      id: createSessionId(),
      participant,
      supervisor,
      orderMode: el.orderMode.value,
      languageMode,
      difficultyMode,
      order,
      pointer: 0,
      records: [],
      status: "running",
      createdAt: new Date().toISOString(),
      finishedAt: null,
      finishReason: null,
      milestoneTimes: {},
      achievementsShown: [],
      activeElapsed: 0,
      lastStartedAt: Date.now(),
      currentStartedAt: 0,
      currentStartedWallAt: new Date().toISOString()
    };

    el.sessionPeople.textContent = `${participant} diuji oleh ${supervisor}`;
    showView("quiz");
    renderQuestion();
    renderRuntime();
    startTicker();
    el.answerInput.focus();
  }

  function submitWithEnter(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      el.answerForm.requestSubmit();
    }
  }

  function submitAnswer(event) {
    event.preventDefault();
    if (!state || state.status !== "running") {
      return;
    }

    const answer = el.answerInput.value.trim();
    if (!answer) {
      el.answerInput.classList.remove("shake");
      void el.answerInput.offsetWidth;
      el.answerInput.classList.add("shake");
      el.answerInput.focus();
      return;
    }

    recordCurrentItem({
      answer,
      type: "answer",
      validation: "pending",
      secondsUsed: Math.min(CONFIG.itemSeconds, currentItemElapsed())
    });

    const totalSubmitted = submittedCount();
    captureProgressMilestone(totalSubmitted);
    state.pointer += 1;
    el.answerInput.value = "";

    if (totalSubmitted >= CONFIG.maxSyntax || state.pointer >= state.order.length) {
      endSession("Maksimal 100 keyword tercapai");
      return;
    }

    if (activeElapsed() >= CONFIG.maxSessionSeconds) {
      endSession("Batas 20 menit tercapai");
      return;
    }

    state.currentStartedAt = activeElapsed();
    state.currentStartedWallAt = new Date().toISOString();
    renderQuestion();
    renderRuntime();
  }

  function pauseSession() {
    if (!state || state.status !== "running") {
      return;
    }

    state.activeElapsed = activeElapsed();
    state.lastStartedAt = null;
    state.status = "paused";
    stopTicker();
    renderRuntime();
  }

  function resumeSession() {
    if (!state || state.status !== "paused") {
      return;
    }

    state.status = "running";
    state.lastStartedAt = Date.now();
    startTicker();
    renderRuntime();
    el.answerInput.focus();
  }

  function stopSessionManually() {
    if (!state || submittedCount() < CONFIG.minManualStop) {
      return;
    }

    endSession("Dihentikan manual setelah 30 keyword atau lebih");
  }

  function tick() {
    if (!state || state.status !== "running") {
      return;
    }

    if (activeElapsed() >= CONFIG.maxSessionSeconds) {
      endSession("Batas 20 menit tercapai");
      return;
    }

    if (currentItemElapsed() >= CONFIG.itemSeconds) {
      recordCurrentItem({
        answer: el.answerInput.value.trim(),
        type: "timeout",
        validation: "rejected",
        secondsUsed: CONFIG.itemSeconds
      });
      endSession("Waktu 15 detik pada sintaks terakhir habis");
      return;
    }

    renderRuntime();
  }

  function recordCurrentItem({ answer, type, validation, secondsUsed }) {
    const item = currentItem();
    const complexity = getKeywordComplexity(item);
    state.records.push({
      no: state.records.length + 1,
      type,
      language: item.language,
      keyword: item.keyword,
      difficulty: complexity.label,
      complexityScore: complexity.score,
      answer,
      secondsUsed: roundOne(secondsUsed),
      validation,
      shownAt: state.currentStartedWallAt,
      recordedAt: new Date().toISOString()
    });
  }

  function captureProgressMilestone(count) {
    if (!state || count <= 0) {
      return;
    }

    if (CONFIG.timedMilestones.includes(count) && !state.milestoneTimes[count]) {
      state.milestoneTimes[count] = roundOne(activeElapsed());
    }

    if (CONFIG.achievementMilestones.includes(count) && !state.achievementsShown.includes(count)) {
      state.achievementsShown.push(count);
      showAchievement(count);
    }
  }

  function showAchievement(count) {
    if (!el.achievementStack) {
      return;
    }

    const message = ACHIEVEMENT_MESSAGES[count] || `${count} sintaks tercapai. Oke, itu tercatat.`;
    const milestoneTime = state.milestoneTimes[count];
    const timeText = typeof milestoneTime === "number" ? `<p class="achievement-time">Waktu total: ${formatClock(milestoneTime)}</p>` : "";
    const toast = document.createElement("div");

    toast.className = "achievement-toast";
    toast.innerHTML = `
      <div class="achievement-icon" aria-hidden="true">🏆</div>
      <div>
        <p class="achievement-title">Achievement unlocked: ${count} sintaks</p>
        <p class="achievement-message">${escapeHtml(message)}</p>
        ${timeText}
      </div>
    `;

    el.achievementStack.prepend(toast);
    window.setTimeout(() => toast.remove(), 5600);
  }

  function endSession(reason) {
    if (!state || state.status === "ended") {
      return;
    }

    state.activeElapsed = activeElapsed();
    state.lastStartedAt = null;
    state.status = "ended";
    state.finishedAt = new Date().toISOString();
    state.finishReason = reason;
    stopTicker();
    persistSession();
    renderResults();
    showView("results");
  }

  function renderQuestion() {
    const item = currentItem();
    el.languageBadge.textContent = item.language;
    el.syntaxKeyword.textContent = item.keyword;
    el.currentNumber.textContent = `${Math.min(state.pointer + 1, CONFIG.maxSyntax)}/${CONFIG.maxSyntax}`;
    el.currentTimestamp.textContent = formatDateTime(state.currentStartedWallAt);
  }

  function renderRuntime() {
    if (!state) {
      return;
    }

    const remainingItem = Math.max(0, CONFIG.itemSeconds - currentItemElapsed());
    const sessionRemaining = Math.max(0, CONFIG.maxSessionSeconds - activeElapsed());
    const progress = Math.max(0, Math.min(100, (remainingItem / CONFIG.itemSeconds) * 100));
    const canStop = submittedCount() >= CONFIG.minManualStop;

    el.syntaxTimer.textContent = remainingItem.toFixed(1);
    el.syntaxRing.style.setProperty("--progress", `${progress}%`);
    el.syntaxRing.classList.toggle("is-low", remainingItem <= 3);
    el.answeredCount.textContent = `${submittedCount()}/${CONFIG.maxSyntax}`;
    el.sessionRemaining.textContent = formatClock(sessionRemaining);
    el.quizStatus.textContent = state.status === "paused" ? "Pause" : "Berjalan";
    el.stopButton.disabled = !canStop;
    el.pauseButton.hidden = state.status !== "running";
    el.resumeButton.hidden = state.status !== "paused";
    el.answerInput.disabled = state.status !== "running";
    el.submitAnswer.disabled = state.status !== "running";
    el.quizView.classList.toggle("is-paused", state.status === "paused");
  }

  function renderResults() {
    const payload = buildPayload();
    el.resultSessionMeta.textContent = `${payload.participant} diuji oleh ${payload.supervisor}`;
    el.finishReason.textContent = payload.finishReason || "-";
    el.finalAnswered.textContent = `${payload.submittedAnswers}/${CONFIG.maxSyntax}`;
    el.finalDuration.textContent = formatClock(payload.activeSeconds);
    el.timeAt30.textContent = payload.milestoneTimes["30"] ? payload.milestoneTimes["30"].clock : "-";
    el.timeAt50.textContent = payload.milestoneTimes["50"] ? payload.milestoneTimes["50"].clock : "-";
    renderValidationCounts();

    el.answerRows.innerHTML = payload.records.map((record, index) => {
      const disabled = record.type === "timeout" ? "disabled" : "";
      const statusText = record.type === "timeout" ? "Gagal waktu" : "Terkirim";
      const acceptedPressed = record.validation === "accepted" ? "true" : "false";
      const rejectedPressed = record.validation === "rejected" ? "true" : "false";
      return `
        <tr>
          <td>${record.no}</td>
          <td>${escapeHtml(record.language)}</td>
          <td><code>${escapeHtml(record.keyword)}</code><br><small class="${record.type === "timeout" ? "danger-text" : "ok-text"}">${statusText}</small></td>
          <td class="answer-cell">${escapeHtml(record.answer || "-")}</td>
          <td>${record.secondsUsed.toFixed(1)} dtk</td>
          <td>${escapeHtml(formatDateTime(record.recordedAt))}</td>
          <td>
            <div class="validation-checks" aria-label="Validasi jawaban ${record.no}">
              <button class="validation-button is-valid" type="button" data-index="${index}" data-value="accepted" aria-label="Tandai valid" aria-pressed="${acceptedPressed}" ${disabled}>✅</button>
              <button class="validation-button is-invalid" type="button" data-index="${index}" data-value="rejected" aria-label="Tandai salah" aria-pressed="${rejectedPressed}" ${disabled}>❌</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderValidationCounts() {
    if (!state) {
      return;
    }
    const valid = state.records.filter((record) => record.validation === "accepted").length;
    const invalid = state.records.filter((record) => record.validation === "rejected").length;
    el.validCount.textContent = String(valid);
    el.invalidCount.textContent = String(invalid);
  }

  function updateValidation(event) {
    const button = event.target.closest(".validation-button");

    if (!button || !state) {
      return;
    }

    const index = Number(button.dataset.index);
    if (!Number.isInteger(index) || !state.records[index]) {
      return;
    }

    state.records[index].validation = button.dataset.value;
    persistSession();
    renderValidationCounts();
    renderResults();
  }

  function copyPayload() {
    const text = JSON.stringify(buildPayload(), null, 2);
    copyText(text)
      .then(() => setStorageState("Data disalin", "ok"))
      .catch(() => setStorageState("Gagal menyalin data", "danger"));
  }

  function downloadFile(type) {
    const payload = buildPayload();
    const nameBase = safeFileName(`${payload.participant}-${payload.sessionId}`);
    const content = type === "csv"
      ? toCsv(payload)
      : type === "xls"
        ? toSpreadsheetXml(payload)
        : JSON.stringify(payload, null, 2);
    const mime = type === "csv"
      ? "text/csv;charset=utf-8"
      : type === "xls"
        ? "application/vnd.ms-excel;charset=utf-8"
        : "application/json;charset=utf-8";
    const blob = new Blob([content], { type: mime });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `${nameBase}.${type}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function buildPayload() {
    const activeSeconds = roundOne(state ? state.activeElapsed : 0);
    return {
      app: "Syntax Relay",
      sessionId: state.id,
      participant: state.participant,
      supervisor: state.supervisor,
      orderMode: state.orderMode,
      languageMode: state.languageMode,
      difficultyMode: state.difficultyMode,
      appVersion: APP_VERSION,
      createdAt: state.createdAt,
      finishedAt: state.finishedAt,
      finishReason: state.finishReason,
      activeSeconds,
      localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "local",
      milestoneTimes: buildMilestoneTimes(),
      achievementsShown: [...state.achievementsShown],
      submittedAnswers: submittedCount(),
      totalRecords: state.records.length,
      validAnswers: state.records.filter((record) => record.validation === "accepted").length,
      invalidAnswers: state.records.filter((record) => record.validation === "rejected").length,
      pendingAnswers: state.records.filter((record) => record.validation === "pending").length,
      config: {
        syntaxPool: bank.length,
        maxSyntax: CONFIG.maxSyntax,
        secondsPerSyntax: CONFIG.itemSeconds,
        maxSessionSeconds: CONFIG.maxSessionSeconds,
        minManualStop: CONFIG.minManualStop,
        timedMilestones: CONFIG.timedMilestones,
        achievementMilestones: CONFIG.achievementMilestones
      },
      records: state.records.map((record) => ({ ...record }))
    };
  }

  function buildMilestoneTimes() {
    return CONFIG.timedMilestones.reduce((milestones, milestone) => {
      const seconds = state.milestoneTimes[milestone];
      milestones[milestone] = typeof seconds === "number"
        ? { seconds, clock: formatClock(seconds) }
        : null;
      return milestones;
    }, {});
  }

  function persistSession() {
    try {
      const sessions = readSessions().filter((session) => session.sessionId !== state.id);
      sessions.unshift(buildPayload());
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(sessions.slice(0, 50)));
      setStorageState("Tersimpan lokal", "ok");
    } catch (error) {
      setStorageState("Penyimpanan lokal gagal", "danger");
    }
  }

  function readSessions() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function resetToSetup() {
    state = null;
    stopTicker();
    el.answerInput.value = "";
    el.achievementStack.replaceChildren();
    el.setupForm.reset();
    showView("setup");
    setStorageState("Siap", "neutral");
    el.participantName.focus();
  }

  function showView(name) {
    el.setupView.classList.toggle("is-active", name === "setup");
    el.quizView.classList.toggle("is-active", name === "quiz");
    el.resultsView.classList.toggle("is-active", name === "results");
  }

  function startTicker() {
    stopTicker();
    ticker = window.setInterval(tick, 100);
  }

  function stopTicker() {
    if (ticker) {
      window.clearInterval(ticker);
      ticker = null;
    }
  }

  function activeElapsed() {
    if (!state) {
      return 0;
    }

    if (state.status !== "running" || !state.lastStartedAt) {
      return state.activeElapsed;
    }

    return state.activeElapsed + ((Date.now() - state.lastStartedAt) / 1000);
  }

  function currentItemElapsed() {
    return Math.max(0, activeElapsed() - state.currentStartedAt);
  }

  function currentItem() {
    return bank[state.order[state.pointer]];
  }

  function submittedCount() {
    return state ? state.records.filter((record) => record.type === "answer").length : 0;
  }

  function buildSessionOrder(mode, languageFilter, difficultyMode) {
    const filteredBank = languageFilter === "all"
      ? bank.map((item, index) => ({ item, index }))
      : bank.map((item, index) => ({ item, index })).filter(({ item }) => item.language === languageFilter);

    const grouped = filteredBank.reduce((groups, { item, index }) => {
      if (!groups[item.language]) {
        groups[item.language] = [];
      }
      groups[item.language].push(index);
      return groups;
    }, {});

    Object.values(grouped).forEach((indices) => {
      rankByDifficulty(indices, difficultyMode);
      if (mode === "random" && difficultyMode === "default") {
        shuffle(indices);
      }
    });

    if (languageFilter !== "all") {
      const order = grouped[languageFilter].slice(0, CONFIG.maxSyntax);
      if (mode === "random") {
        shuffle(order);
      }
      return order;
    }

    const quotas = calculateLanguageQuotas(grouped);
    const languageSequence = buildLanguageSequence(quotas);
    const order = languageSequence.map((language) => grouped[language].shift()).filter(Number.isInteger);

    if (mode === "random") {
      shuffle(order);
    }

    return order.slice(0, CONFIG.maxSyntax);
  }

  function calculateLanguageQuotas(grouped) {
    const entries = Object.entries(grouped).map(([language, indices]) => {
      const exact = (indices.length / bank.length) * CONFIG.maxSyntax;
      return {
        language,
        count: Math.floor(exact),
        fraction: exact - Math.floor(exact)
      };
    });

    let used = entries.reduce((sum, entry) => sum + entry.count, 0);
    entries
      .sort((a, b) => b.fraction - a.fraction)
      .forEach((entry) => {
        if (used < CONFIG.maxSyntax) {
          entry.count += 1;
          used += 1;
        }
      });

    return entries.reduce((quotas, entry) => {
      quotas[entry.language] = entry.count;
      return quotas;
    }, {});
  }

  function buildLanguageSequence(quotas) {
    const remaining = { ...quotas };
    const sequence = [];

    while (sequence.length < CONFIG.maxSyntax) {
      const next = Object.entries(remaining)
        .filter(([, count]) => count > 0)
        .sort((a, b) => {
          const ratioA = a[1] / quotas[a[0]];
          const ratioB = b[1] / quotas[b[0]];
          return ratioB - ratioA;
        })[0];

      if (!next) {
        break;
      }

      const [language] = next;
      sequence.push(language);
      remaining[language] -= 1;
    }

    return sequence;
  }

  function rankByDifficulty(indices, difficultyMode) {
    if (difficultyMode === "default") {
      return indices;
    }

    indices.sort((left, right) => {
      const leftScore = getKeywordComplexity(bank[left]).score;
      const rightScore = getKeywordComplexity(bank[right]).score;

      if (difficultyMode === "easy") {
        return leftScore - rightScore;
      }

      if (difficultyMode === "hard") {
        return rightScore - leftScore;
      }

      const leftDistance = Math.abs(leftScore - 2);
      const rightDistance = Math.abs(rightScore - 2);
      return leftDistance - rightDistance || leftScore - rightScore;
    });

    return indices;
  }

  function getKeywordComplexity(item) {
    const keyword = item.keyword;
    const easyKeywords = new Set([
      "print", "input", "if", "else", "for", "while", "break", "continue", "return", "class", "int", "float",
      "str", "bool", "list", "dict", "len", "range", "True", "False", "None", "let", "const", "var",
      "function", "console", "log", "alert", "html", "head", "body", "title", "div", "span", "p", "a",
      "img", "form", "input", "button", "label", "printf", "scanf", "main", "char", "double", "void",
      "cout", "cin", "string", "public", "static", "String", "System", "println", "echo"
    ]);
    const hardKeywords = new Set([
      "async", "await", "lambda", "nonlocal", "classmethod", "staticmethod", "memoryview", "frozenset",
      "permutations", "combinations", "defaultdict", "namedtuple", "Proxy", "Reflect", "AbortController",
      "requestAnimationFrame", "URLSearchParams", "removeEventListener", "aria", "describedby", "headers",
      "iframe", "canvas", "restrict", "volatile", "realloc", "memmove", "reinterpret_cast", "constexpr",
      "dynamic_cast", "static_cast", "unique_ptr", "shared_ptr", "synchronized", "transient", "volatile",
      "FunctionalInterface", "RuntimeException", "namespace", "trait", "yield", "preg_replace",
      "password_hash"
    ]);

    if (hardKeywords.has(keyword)) {
      return { score: 3, label: "Sulit" };
    }

    if (easyKeywords.has(keyword)) {
      return { score: 1, label: "Mudah" };
    }

    const sourceIndex = bank.findIndex((entry) => entry.id === item.id);
    const sameLanguage = bank.filter((entry) => entry.language === item.language);
    const languageIndex = sameLanguage.findIndex((entry) => entry.id === item.id);
    const ratio = languageIndex / Math.max(1, sameLanguage.length - 1);

    if (ratio < 0.38) {
      return { score: 1, label: "Mudah" };
    }

    if (ratio > 0.72 || sourceIndex > 850) {
      return { score: 3, label: "Sulit" };
    }

    return { score: 2, label: "Sedang" };
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
  }

  function formatClock(seconds) {
    const safeSeconds = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const rest = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }

  function formatDateTime(value) {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "short",
      timeStyle: "medium"
    }).format(date);
  }

  function renderLocalClock() {
    el.localClock.textContent = `Jam lokal: ${formatDateTime(new Date())}`;
  }

  function roundOne(value) {
    return Math.round(value * 10) / 10;
  }

  function createSessionId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function setStorageState(message, tone) {
    el.storageState.textContent = message;
    el.storageState.classList.toggle("danger-text", tone === "danger");
    el.storageState.classList.toggle("ok-text", tone === "ok");
    el.storageState.classList.toggle("warn-text", tone === "warn");
  }

  function safeFileName(value) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "syntax-relay";
  }

  function toCsv(payload) {
    const header = [
      "session_id", "app_version", "participant", "supervisor", "language_mode", "difficulty_mode", "local_timezone", "finish_reason", "active_seconds",
      "valid_answers", "invalid_answers", "pending_answers", "time_at_30_seconds", "time_at_50_seconds", "no", "type", "language",
      "keyword", "difficulty", "complexity_score", "answer", "seconds_used", "validation", "shown_at", "recorded_at"
    ];

    const rows = payload.records.map((record) => [
      payload.sessionId,
      payload.appVersion,
      payload.participant,
      payload.supervisor,
      payload.languageMode,
      payload.difficultyMode,
      payload.localTimezone,
      payload.finishReason,
      payload.activeSeconds,
      payload.validAnswers,
      payload.invalidAnswers,
      payload.pendingAnswers,
      payload.milestoneTimes["30"] ? payload.milestoneTimes["30"].seconds : "",
      payload.milestoneTimes["50"] ? payload.milestoneTimes["50"].seconds : "",
      record.no,
      record.type,
      record.language,
      record.keyword,
      record.difficulty,
      record.complexityScore,
      record.answer,
      record.secondsUsed,
      record.validation,
      record.shownAt,
      record.recordedAt
    ]);

    return [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");
  }

  function toSpreadsheetXml(payload) {
    const rows = [
      ["Aplikasi", payload.app],
      ["Versi patch", payload.appVersion],
      ["Session ID", payload.sessionId],
      ["Peserta", payload.participant],
      ["Pengawas", payload.supervisor],
      ["Mode bahasa", formatLanguageMode(payload.languageMode)],
      ["Tingkat kesulitan", formatDifficultyMode(payload.difficultyMode)],
      ["Urutan", payload.orderMode],
      ["Zona waktu", payload.localTimezone],
      ["Alasan selesai", payload.finishReason],
      ["Jawaban terkirim", payload.submittedAnswers],
      ["Valid", payload.validAnswers],
      ["Tidak valid", payload.invalidAnswers],
      ["Belum divalidasi", payload.pendingAnswers],
      ["Durasi aktif", formatClock(payload.activeSeconds)],
      ["Waktu 30 keyword", payload.milestoneTimes["30"] ? payload.milestoneTimes["30"].clock : ""],
      ["Waktu 50 keyword", payload.milestoneTimes["50"] ? payload.milestoneTimes["50"].clock : ""],
      [],
      ["No", "Bahasa", "Keyword", "Kesulitan", "Skor kompleksitas", "Jawaban peserta", "Waktu detik", "Validasi", "Timestamp tampil", "Timestamp jawab"]
    ];

    payload.records.forEach((record) => {
      rows.push([
        record.no,
        record.language,
        record.keyword,
        record.difficulty,
        record.complexityScore,
        record.answer,
        record.secondsUsed,
        formatValidation(record.validation),
        record.shownAt,
        record.recordedAt
      ]);
    });

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Hasil Tes">
    <Table>
      ${rows.map(spreadsheetRow).join("\n      ")}
    </Table>
  </Worksheet>
</Workbook>`;
  }

  function spreadsheetRow(row) {
    return `<Row>${row.map((value) => `<Cell><Data ss:Type="${typeof value === "number" ? "Number" : "String"}">${escapeXml(value ?? "")}</Data></Cell>`).join("")}</Row>`;
  }

  function formatLanguageMode(value) {
    return value === "all" ? "Acak semua bahasa" : `Khusus ${value}`;
  }

  function formatDifficultyMode(value) {
    const labels = {
      default: "Default",
      easy: "Mudah",
      medium: "Sedang",
      hard: "Sulit"
    };
    return labels[value] || "Default";
  }

  function formatValidation(value) {
    if (value === "accepted") return "Valid";
    if (value === "rejected") return "Tidak valid";
    return "Belum divalidasi";
  }

  function csvEscape(value) {
    return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    textarea.remove();

    if (!copied) {
      throw new Error("copy failed");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();

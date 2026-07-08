/* ============================================
   VOICE DIARY v3 — app logic
   Data model (localStorage):
   diaries: [{ id, name, createdAt, font, pages: [{ id, headline, date, text }] }]
   ============================================ */

(() => {
  'use strict';

  const STORAGE_KEY = 'voiceDiary_v2_diaries';
  const SETTINGS_KEY = 'voiceDiary_v2_settings';
  const FONT_MAP = { serif: "'Fraunces', serif", hand: "'Caveat', cursive", clean: "'Inter', sans-serif", mono: "'Space Grotesk', monospace" };
  const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);

  const el = {
    loadingScreen: $('loadingScreen'), loadBarFill: $('loadBarFill'), loadPct: $('loadPct'),
    app: $('app'),

    homeScreen: $('homeScreen'), weekStrip: $('weekStrip'), todayFull: $('todayFull'),
    createNewBtn: $('createNewBtn'), homeHint: $('homeHint'), historyBtn: $('historyBtn'),
    settingsBtn: $('settingsBtn'),
    recentReflectionsLabel: $('recentReflectionsLabel'),
    diaryGrid: $('diaryGrid'),

    quickSearchTopBtn: $('quickSearchTopBtn'), notifBtn: $('notifBtn'), profileBtn: $('profileBtn'),
    notifSheetBackdrop: $('notifSheetBackdrop'), notifSheet: $('notifSheet'), notifList: $('notifList'),

    createLockTypeOptions: $('createLockTypeOptions'), createLockFields: $('createLockFields'),
    createLockSecretInput: $('createLockSecretInput'), createLockQuestionSelect: $('createLockQuestionSelect'),
    createLockAnswerInput: $('createLockAnswerInput'),

    diaryLockScreen: $('diaryLockScreen'), diaryLockTitle: $('diaryLockTitle'), diaryLockSub: $('diaryLockSub'),
    diaryLockDots: $('diaryLockDots'), diaryLockPatternInput: $('diaryLockPatternInput'),
    diaryLockError: $('diaryLockError'), diaryLockKeypad: $('diaryLockKeypad'),
    diaryLockForgotBtn: $('diaryLockForgotBtn'), diaryLockCancelBtn: $('diaryLockCancelBtn'),

    forgotLockSheetBackdrop: $('forgotLockSheetBackdrop'), forgotLockSheet: $('forgotLockSheet'),
    forgotLockQuestionText: $('forgotLockQuestionText'), forgotLockAnswerInput: $('forgotLockAnswerInput'),
    forgotLockSubmitBtn: $('forgotLockSubmitBtn'), forgotLockError: $('forgotLockError'),

    diaryLockManageList: $('diaryLockManageList'),
    diaryLockManageSheetBackdrop: $('diaryLockManageSheetBackdrop'), diaryLockManageSheet: $('diaryLockManageSheet'),
    diaryLockManageTitle: $('diaryLockManageTitle'), manageLockTypeOptions: $('manageLockTypeOptions'),
    manageLockFields: $('manageLockFields'), manageLockSecretInput: $('manageLockSecretInput'),
    manageLockQuestionSelect: $('manageLockQuestionSelect'), manageLockAnswerInput: $('manageLockAnswerInput'),
    manageLockSaveBtn: $('manageLockSaveBtn'),

    bottomNav: $('bottomNav'), bnavHomeBtn: $('bnavHomeBtn'), bnavHistoryBtn: $('bnavHistoryBtn'),
    bnavInsightsBtn: $('bnavInsightsBtn'), bnavInsightsLabel: $('bnavInsightsLabel'),

    profileScreen: $('profileScreen'), profileBackBtn: $('profileBackBtn'), profileEditBtn: $('profileEditBtn'),
    profileAvatar: $('profileAvatar'), profileName: $('profileName'), profileSince: $('profileSince'),
    profileBio: $('profileBio'),
    profileStatPages: $('profileStatPages'), profileStatWords: $('profileStatWords'),
    profileStatStreak: $('profileStatStreak'), profileStatDiaries: $('profileStatDiaries'),
    profileBadgesStrip: $('profileBadgesStrip'), profileGoSettingsBtn: $('profileGoSettingsBtn'),
    profileGoHistoryBtn: $('profileGoHistoryBtn'), profileEditNameBtn: $('profileEditNameBtn'),
    profileShareStatsBtn: $('profileShareStatsBtn'), avatarFileInput: $('avatarFileInput'),

    editProfileSheetBackdrop: $('editProfileSheetBackdrop'), editProfileSheet: $('editProfileSheet'),
    editProfileAvatarPreview: $('editProfileAvatarPreview'), editProfileChangePhotoBtn: $('editProfileChangePhotoBtn'),
    editProfileRemovePhotoBtn: $('editProfileRemovePhotoBtn'), editProfileNameInput: $('editProfileNameInput'),
    editProfileBioInput: $('editProfileBioInput'), editProfileSaveBtn: $('editProfileSaveBtn'),

    settingsProfileCard: $('settingsProfileCard'), settingsProfileAvatar: $('settingsProfileAvatar'),
    settingsProfileName: $('settingsProfileName'),
    hapticsToggle: $('hapticsToggle'), soundToggle: $('soundToggle'),
    clearAllDataBtn: $('clearAllDataBtn'), shareAppBtn: $('shareAppBtn'),

    insightsScreen: $('insightsScreen'), insightsDateLabel: $('insightsDateLabel'),
    insightsSeasonIcon: $('insightsSeasonIcon'), insightsWeatherText: $('insightsWeatherText'),
    insightsStreakText: $('insightsStreakText'), insightsChart: $('insightsChart'),
    insightsMoodStrip: $('insightsMoodStrip'), insightsTotalWords: $('insightsTotalWords'),
    insightsTotalHours: $('insightsTotalHours'), insightsPrimaryMoods: $('insightsPrimaryMoods'),
    reflectionsList: $('reflectionsList'),

    homeGreeting: $('homeGreeting'), streakPill: $('streakPill'), streakText: $('streakText'),
    memoryCard: $('memoryCard'), memoryHeadline: $('memoryHeadline'), memorySnippet: $('memorySnippet'), memoryDate: $('memoryDate'),
    quoteText: $('quoteText'), quoteCard: $('quoteCard'),
    statPages: $('statPages'), statWords: $('statWords'), statStreak: $('statStreak'),
    quickVoiceBtn: $('quickVoiceBtn'), quickMoodBtn: $('quickMoodBtn'), quickSearchBtn: $('quickSearchBtn'),
    weatherWidget: $('weatherWidget'), seasonIcon: $('seasonIcon'), weatherText: $('weatherText'),
    chartCard: $('chartCard'), miniChart: $('miniChart'), moodSummary: $('moodSummary'),
    heatmapCard: $('heatmapCard'), heatmapGrid: $('heatmapGrid'),
    badgesStrip: $('badgesStrip'), confettiLayer: $('confettiLayer'),

    createScreen: $('createScreen'), createBackBtn: $('createBackBtn'),
    diaryNameInput: $('diaryNameInput'), headlineInput: $('headlineInput'), firstEntryInput: $('firstEntryInput'),
    templateOptions: $('templateOptions'),
    createMicBtn: $('createMicBtn'), createMicStatus: $('createMicStatus'), confirmCreateBtn: $('confirmCreateBtn'),

    coverScreen: $('coverScreen'), coverBackBtn: $('coverBackBtn'), bookCover: $('bookCover'),
    bookCoverTitle: $('bookCoverTitle'), bookCoverMeta: $('bookCoverMeta'), openBookBtn: $('openBookBtn'),
    coverMenuBtn: $('coverMenuBtn'), bookCoverSignature: $('bookCoverSignature'),
    coverSheetBackdrop: $('coverSheetBackdrop'), coverSheet: $('coverSheet'),
    exportDiaryBtn: $('exportDiaryBtn'), allDiariesLinkBtn: $('allDiariesLinkBtn'), deleteFromCoverBtn: $('deleteFromCoverBtn'),
    signatureSheetBackdrop: $('signatureSheetBackdrop'), signatureSheet: $('signatureSheet'),
    signatureInput: $('signatureInput'), signatureSaveBtn: $('signatureSaveBtn'),
    coverThemeBtn: $('coverThemeBtn'), coverStickerBtn: $('coverStickerBtn'), coverStickerLayer: $('coverStickerLayer'),
    coverThemeSheetBackdrop: $('coverThemeSheetBackdrop'), coverThemeSheet: $('coverThemeSheet'), coverThemeOptions: $('coverThemeOptions'),
    coverStickerSheetBackdrop: $('coverStickerSheetBackdrop'), coverStickerSheet: $('coverStickerSheet'),
    coverStickerOptions: $('coverStickerOptions'), coverStickerClearBtn: $('coverStickerClearBtn'),

    bookScreen: $('bookScreen'), bookBackBtn: $('bookBackBtn'), pageIndicator: $('pageIndicator'),
    fontBtn: $('fontBtn'), fullscreenBtn: $('fullscreenBtn'), printBtn: $('printBtn'), rotateBtn: $('rotateBtn'),
    landscapeOverlay: $('landscapeOverlay'), landscapeOverlayStage: $('landscapeOverlayStage'), landscapeCloseBtn: $('landscapeCloseBtn'),
    pageStage: $('pageStage'), zonePrev: $('zonePrev'), zoneNext: $('zoneNext'),
    bookSpread: $('bookSpread'), pageSheetLeft: $('pageSheetLeft'), pageSheetRight: $('pageSheetRight'),
    pageMicFab: $('pageMicFab'), pageMoodFab: $('pageMoodFab'), addPageBtn: $('addPageBtn'),

    fullscreenReader: $('fullscreenReader'), fsScrim: $('fsScrim'), fsSheet: $('fsSheet'),
    fsToolbar: $('fsToolbar'), fsCloseBtn: $('fsCloseBtn'),
    fsThemeBtn: $('fsThemeBtn'), fsStickerBtn: $('fsStickerBtn'), fsFontBtn: $('fsFontBtn'), fsExpandBtn: $('fsExpandBtn'),
    fsVoiceNoteBtn: $('fsVoiceNoteBtn'), fsBookmarkBtn: $('fsBookmarkBtn'), fsPhotoBtn: $('fsPhotoBtn'), fsTagBtn: $('fsTagBtn'),
    fsTtsBtn: $('fsTtsBtn'), fsTagsRow: $('fsTagsRow'), photoFileInput: $('photoFileInput'),
    fsHeadline: $('fsHeadline'), fsDate: $('fsDate'), fsBody: $('fsBody'), fsMicFab: $('fsMicFab'),
    fsContent: $('fsContent'), fsStickerLayer: $('fsStickerLayer'), fsBodyZone: $('fsBodyZone'),
    recordingIndicator: $('recordingIndicator'), recordingTime: $('recordingTime'),

    fontSheetBackdrop: $('fontSheetBackdrop'), fontSheet: $('fontSheet'), fontOptions: $('fontOptions'),
    moodSheetBackdrop: $('moodSheetBackdrop'), moodSheet: $('moodSheet'), moodOptions: $('moodOptions'),

    themeSheetBackdrop: $('themeSheetBackdrop'), themeSheet: $('themeSheet'), themeOptions: $('themeOptions'),
    themeApplyAllBtn: $('themeApplyAllBtn'), themeSheetScopeLabel: $('themeSheetScopeLabel'),
    stickerSheetBackdrop: $('stickerSheetBackdrop'), stickerSheet: $('stickerSheet'), stickerOptions: $('stickerOptions'),

    tagSheetBackdrop: $('tagSheetBackdrop'), tagSheet: $('tagSheet'), tagOptions: $('tagOptions'),
    customTagInput: $('customTagInput'), customTagAddBtn: $('customTagAddBtn'),

    historyScreen: $('historyScreen'), historyBackBtn: $('historyBackBtn'), diaryList: $('diaryList'),
    searchInput: $('searchInput'), searchResults: $('searchResults'),
    bookmarksFilterChip: $('bookmarksFilterChip'), bookmarksList: $('bookmarksList'),

    settingsScreen: $('settingsScreen'), settingsBackBtn: $('settingsBackBtn'),
    appLockToggle: $('appLockToggle'), appLockRowSub: $('appLockRowSub'), changePinBtn: $('changePinBtn'),
    backupReminderBtn: $('backupReminderBtn'),
    rateAppBtn: $('rateAppBtn'), sendFeedbackBtn: $('sendFeedbackBtn'),
    darkModeToggle: $('darkModeToggle'),
    langOptions: $('langOptions'), diaryFontOptions: $('diaryFontOptions'),
    reminderToggle: $('reminderToggle'), reminderRowSub: $('reminderRowSub'), reminderTime: $('reminderTime'),
    exportAllBtn: $('exportAllBtn'), backupJsonBtn: $('backupJsonBtn'), restoreJsonBtn: $('restoreJsonBtn'),
    restoreFileInput: $('restoreFileInput'),

    lockScreen: $('lockScreen'), lockTitle: $('lockTitle'), lockSub: $('lockSub'), lockDots: $('lockDots'),
    lockError: $('lockError'), lockKeypad: $('lockKeypad'), lockBackspaceBtn: $('lockBackspaceBtn'),
    setPinSheetBackdrop: $('setPinSheetBackdrop'), setPinSheet: $('setPinSheet'), setPinTitle: $('setPinTitle'),
    setPinSub: $('setPinSub'), setPinInput: $('setPinInput'), setPinSaveBtn: $('setPinSaveBtn'),

    deleteConfirm: $('deleteConfirm'), cancelDeleteBtn: $('cancelDeleteBtn'), confirmDeleteBtn: $('confirmDeleteBtn'),
    toast: $('toast'),
    undoToast: $('undoToast'), undoToastText: $('undoToastText'), undoToastBtn: $('undoToastBtn'),
  };

  // ---------- state ----------
  let diaries = [];
  let settings = {};
  let activeDiaryId = null;
  let pairIndex = 0;          // which two-page spread is showing (0 = pages 0 & 1)
  let editingIndex = null;    // page index currently open in the fullscreen editor
  let activeEditable = null;  // { sheetEl } — last-focused page sheet, used as the mic/expand target
  let pendingDeleteId = null;
  let recognizer = null, recognitionActive = false, recognitionTarget = null;
  let undoTimer = null, undoPayload = null;
  let autosaveTimer = null;

  // ============ LOADING SEQUENCE ============

  function runLoadingSequence() {
    loadSettings();
    applyDarkMode();
    document.documentElement.setAttribute('data-accent', settings.accent || 'amber');
    let pct = 0;
    const iv = setInterval(() => {
      pct += Math.random() * 18 + 8;
      if (pct >= 100) {
        pct = 100;
        clearInterval(iv);
        el.loadBarFill.style.width = '100%';
        el.loadPct.textContent = '100%';
        setTimeout(() => {
          el.loadingScreen.classList.add('fade-out');
          setTimeout(() => {
            el.loadingScreen.hidden = true;
            el.app.hidden = false;
            if (settings.appLock && settings.pin) {
              showLockScreen();
            } else {
              initHome();
            }
          }, 600);
        }, 250);
        return;
      }
      el.loadBarFill.style.width = pct + '%';
      el.loadPct.textContent = Math.floor(pct) + '%';
    }, 180);
  }

  // ============ STORAGE ============

  function loadDiaries() {
    try { diaries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { diaries = []; }

    // no default diary is auto-created — the home screen shows the empty state
    // and the user creates their first diary themselves via "Create New Diary"

    // migrate diaries/pages saved before theme/signature/stickers existed
    diaries.forEach(d => {
      if (!d.theme) d.theme = 'parchment';
      if (!d.coverTheme) d.coverTheme = 'classic';
      if (!Array.isArray(d.coverStickers)) d.coverStickers = [];
      if (!d.signature) d.signature = 'made by Yash';
      if (d.lock === undefined) d.lock = null; // { type: 'pin'|'pattern', secret, question, answer }
      (d.coverStickers || []).forEach(st => {
        if (st.sizePct === undefined) st.sizePct = st.size ? (st.size / 260 * 100) : 22;
      });
      d.pages.forEach(p => {
        if (!Array.isArray(p.stickers)) p.stickers = [];
        if (!Array.isArray(p.voiceClips)) p.voiceClips = [];
        // old builds stored sticker size / voice clip width as raw pixels, which don't
        // scale between the small book view and the fullscreen view — convert once to
        // percentages of the page width so placement + size stay consistent everywhere.
        p.stickers.forEach(st => {
          if (st.sizePct === undefined) st.sizePct = st.size ? (st.size / 180 * 100) : 30;
        });
        p.voiceClips.forEach(clip => {
          if (clip.widthPct === undefined) clip.widthPct = clip.width ? (clip.width / 180 * 100) : 78;
        });
        if (!Array.isArray(p.photos)) p.photos = [];
        if (!Array.isArray(p.tags)) p.tags = [];
        if (p.bookmarked === undefined) p.bookmarked = false;
        p.photos.forEach(ph => { if (ph.sizePct === undefined) ph.sizePct = 45; });
      });
    });
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
  }

  function getDiary(id) { return diaries.find(d => d.id === id); }
  function currentDiary() { return getDiary(activeDiaryId); }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // ---------- settings storage ----------

  function loadSettings() {
    try { settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
    catch { settings = {}; }
    if (!settings.speechLang) settings.speechLang = (window.CONFIG && CONFIG.SPEECH_LANG) || 'en-IN';
    if (!settings.reminderTime) settings.reminderTime = '21:00';
    if (!settings.userName) settings.userName = (window.CONFIG && CONFIG.USER_NAME) || 'You';
    if (settings.userBio === undefined) settings.userBio = '';
    if (settings.userAvatar === undefined) settings.userAvatar = '';
    if (settings.hapticsOn === undefined) settings.hapticsOn = true;
    if (settings.soundOn === undefined) settings.soundOn = false;
    if (settings.appLock === undefined) settings.appLock = false;
    if (settings.pin === undefined) settings.pin = '';
  }

  // ---------- profile helpers (name / photo shown across Home, Profile, Insights, Settings) ----------

  function getUserName() {
    return (settings.userName && settings.userName.trim()) || 'You';
  }

  function getUserInitial() {
    return getUserName().charAt(0).toUpperCase();
  }

  // Paints the current name/avatar into every place they appear in the app:
  // home greeting, profile screen, settings profile card.
  function applyProfileEverywhere() {
    const name = getUserName();
    const initial = getUserInitial();
    const avatarSrc = settings.userAvatar;

    // Home greeting
    renderGreeting();

    // Profile screen avatar + name
    [el.profileAvatar, el.editProfileAvatarPreview, el.settingsProfileAvatar].forEach(node => {
      if (!node) return;
      if (avatarSrc) {
        node.style.backgroundImage = `url(${avatarSrc})`;
        node.style.backgroundSize = 'cover';
        node.style.backgroundPosition = 'center';
        node.textContent = '';
      } else {
        node.style.backgroundImage = '';
        node.textContent = initial;
      }
    });
    if (el.profileName) el.profileName.textContent = name;
    if (el.settingsProfileName) el.settingsProfileName.textContent = name;
    if (el.profileBio) {
      const bio = (settings.userBio || '').trim();
      el.profileBio.textContent = bio;
      el.profileBio.hidden = !bio;
    }
  }

  function persistSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  // ============ HOME SCREEN ============

  function initHome() {
    loadDiaries();
    renderWeekStrip();
    el.todayFull.textContent = formatDateLong(new Date());
    renderDiaryGrid();
    applyProfileEverywhere();
    renderStreak();
    renderMemory();
    renderQuote();
    renderStats();
    renderWeatherWidget();
    renderWeeklyChart();
    renderMoodSummary();
    renderBadges();
    showScreen('home');
    if (settings.reminderOn && 'Notification' in window && Notification.permission === 'granted') {
      scheduleReminder();
    }
  }

  // ---------- weather/date widget (season icon by month + time icon by hour) ----------
  function renderWeatherWidget() {
    const now = new Date();
    const month = now.getMonth();
    const hour = now.getHours();
    let icon = '☀️';
    if (hour < 6 || hour >= 20) icon = '🌙';
    else if (month >= 5 && month <= 8) icon = '🌧️'; // monsoon-ish months
    else if (month === 11 || month === 0 || month === 1) icon = '❄️';
    el.seasonIcon.textContent = icon;
    el.weatherText.textContent = formatDateLong(now);
  }

  // ---------- weekly writing mini chart ----------
  function renderWeeklyChart() {
    const counts = new Array(7).fill(0);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    diaries.forEach(d => d.pages.forEach(p => {
      const pd = new Date(p.date);
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        if (pd.toDateString() === day.toDateString()) counts[i]++;
      }
    }));
    if (!counts.some(c => c > 0)) { el.chartCard.hidden = true; return; }
    el.chartCard.hidden = false;
    const max = Math.max(...counts, 1);
    el.miniChart.innerHTML = counts.map((c, i) => {
      const isToday = i === today.getDay();
      const h = c === 0 ? 4 : Math.round((c / max) * 52) + 6;
      return `<div class="chart-bar-wrap"><div class="chart-bar${c > 0 ? ' active' : ''}" style="height:${h}px"></div><span class="chart-bar-label">${'SMTWTFS'[i]}${isToday ? '•' : ''}</span></div>`;
    }).join('');
  }

  // ---------- mood summary ----------
  function renderMoodSummary() {
    const counts = {};
    const today = new Date();
    const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
    diaries.forEach(d => d.pages.forEach(p => {
      if (p.mood && new Date(p.date) >= weekAgo) counts[p.mood] = (counts[p.mood] || 0) + 1;
    }));
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!entries.length) { el.moodSummary.hidden = true; return; }
    el.moodSummary.hidden = false;
    el.moodSummary.textContent = `This week you were mostly ${entries[0][0]}`;
  }

  // ---------- achievement badges ----------
  function renderBadges() {
    let totalPages = 0;
    diaries.forEach(d => totalPages += d.pages.length);
    const dateSet = getAllDatesWithEntries();
    const longest = computeLongestStreak(dateSet);

    const badges = [];
    if (totalPages >= 1) badges.push({ icon: '📝', label: 'First page' });
    if (totalPages >= 10) badges.push({ icon: '📚', label: '10 pages' });
    if (totalPages >= 50) badges.push({ icon: '🏆', label: '50 pages' });
    if (longest >= 7) badges.push({ icon: '🔥', label: '7 day streak' });
    if (longest >= 30) badges.push({ icon: '💎', label: '30 day streak' });
    if (diaries.length >= 3) badges.push({ icon: '🗂️', label: '3 diaries' });

    if (!badges.length) { el.badgesStrip.hidden = true; return; }
    el.badgesStrip.hidden = false;
    el.badgesStrip.innerHTML = badges.map(b => `<span class="badge-pill"><span class="badge-icon">${b.icon}</span>${b.label}</span>`).join('');
  }

  // ---------- empty state ----------
  // (handled inline inside renderDiaryGrid now — the empty-diary card)

  // ---------- confetti ----------
  function fireConfetti() {
    const colors = ['#c98a2e', '#c06a5e', '#f3ede1', '#b3762a'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      el.confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), 4000);
    }
  }

  function checkStreakMilestone() {
    const dateSet = getAllDatesWithEntries();
    const streak = computeCurrentStreak(dateSet);
    const milestones = [7, 30, 100];
    if (milestones.includes(streak)) {
      const key = 'voiceDiary_confetti_' + streak;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        fireConfetti();
        showToast(`🎉 ${streak} day streak!`);
      }
    }
  }

  // ---------- greeting ----------
  function renderGreeting() {
    const h = new Date().getHours();
    const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
    const name = getUserName();
    el.homeGreeting.textContent = `Good ${part}, ${name}`;
  }

  // ---------- streak ----------
  function getAllDatesWithEntries() {
    const set = new Set();
    diaries.forEach(d => d.pages.forEach(p => set.add(new Date(p.date).toDateString())));
    return set;
  }

  function computeCurrentStreak(dateSet) {
    let streak = 0;
    const cur = new Date();
    while (dateSet.has(cur.toDateString())) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  }

  function computeLongestStreak(dateSet) {
    if (!dateSet.size) return 0;
    const dates = Array.from(dateSet).map(s => new Date(s)).sort((a, b) => a - b);
    let longest = 1, run = 1;
    for (let i = 1; i < dates.length; i++) {
      const diffDays = Math.round((dates[i] - dates[i - 1]) / 86400000);
      run = diffDays === 1 ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    return longest;
  }

  function renderStreak() {
    const dateSet = getAllDatesWithEntries();
    const streak = computeCurrentStreak(dateSet);
    if (streak > 0) {
      el.streakPill.hidden = false;
      el.streakText.textContent = `${streak} day${streak === 1 ? '' : 's'} streak`;
    } else {
      el.streakPill.hidden = true;
    }
    checkStreakMilestone();
  }

  // ---------- mood heatmap (last 28 days) ----------
  function renderHeatmap() {
    const dayMood = new Map();
    diaries.forEach(d => d.pages.forEach(p => {
      const key = new Date(p.date).toDateString();
      dayMood.set(key, (dayMood.get(key) || 0) + 1);
    }));
    if (!dayMood.size) { if (el.heatmapCard) el.heatmapCard.hidden = true; return; }

    if (!el.heatmapCard || !el.heatmapGrid) return;
    el.heatmapCard.hidden = false;
    el.heatmapGrid.innerHTML = '';
    const today = new Date();
    const cells = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      cells.push(d);
    }
    cells.forEach(d => {
      const count = dayMood.get(d.toDateString()) || 0;
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell' + (count > 0 ? ' has-entry' : '') + (count > 1 ? ' strong' : '');
      cell.title = formatDateShort(d);
      if (el.heatmapGrid) el.heatmapGrid.appendChild(cell);
    });
  }

  // ---------- on this day ----------
  function renderMemory() {
    const today = new Date();
    let found = null;
    diaries.forEach(d => d.pages.forEach(p => {
      const pd = new Date(p.date);
      if (pd.getDate() === today.getDate() && pd.getMonth() === today.getMonth() && pd.getFullYear() < today.getFullYear()) {
        if (!found || pd > new Date(found.page.date)) found = { page: p, diaryName: d.name };
      }
    }));
    if (!found) { el.memoryCard.hidden = true; return; }
    el.memoryCard.hidden = false;
    el.memoryHeadline.textContent = found.page.headline || found.diaryName;
    el.memorySnippet.textContent = (found.page.text || '').slice(0, 90) + ((found.page.text || '').length > 90 ? '…' : '');
    el.memoryDate.textContent = formatDateShort(new Date(found.page.date));
  }

  // ---------- daily quote ----------
  const QUOTES = [
    'Every day is a page worth writing.',
    'Small moments make the longest stories.',
    'Speak your day before it fades.',
    'A line today is a memory forever.',
    'Write it down before the feeling leaves.',
    'Your voice, your story, your pace.',
    'The quiet moments deserve ink too.',
    'Today, in your own words.',
  ];
  function renderQuote() {
    const dayNum = Math.floor(Date.now() / 86400000);
    el.quoteText.textContent = QUOTES[dayNum % QUOTES.length];
  }

  // ---------- stats ----------
  function renderStats() {
    let totalPages = 0, totalWords = 0;
    diaries.forEach(d => d.pages.forEach(p => {
      totalPages++;
      totalWords += (p.text || '').trim().split(/\s+/).filter(Boolean).length;
    }));
    const dateSet = getAllDatesWithEntries();
    el.statPages.textContent = totalPages;
    el.statWords.textContent = totalWords;
    el.statStreak.textContent = computeLongestStreak(dateSet);
  }

  // ---------- diary grid (Recent Diary) ----------
  function renderDiaryGrid() {
    if (!el.diaryGrid) return;
    el.homeHint.textContent = diaries.length === 0 ? 'No diary yet' : diaries.length === 1 ? 'You have 1 diary' : `You have ${diaries.length} diaries`;

    el.diaryGrid.className = 'diary-grid';

    if (!diaries.length) {
      el.diaryGrid.innerHTML = `
        <div class="diary-grid-empty-card" id="diaryGridEmptyCard">
          <span class="empty-illustration">📖✨</span>
          <p>Your story starts with one page.<br>Tap to create your first diary.</p>
        </div>`;
      const emptyCard = $('diaryGridEmptyCard');
      if (emptyCard) emptyCard.addEventListener('click', openCreateScreen);
      return;
    }

    el.diaryGrid.innerHTML = diaries.map(d => {
      const stickerHtml = (Array.isArray(d.coverStickers) ? d.coverStickers : []).map(st => {
        const src = STICKER_LIBRARY[st.key] || '';
        if (!src) return '';
        const w = st.sizePct || 20;
        return `<img src="${src}" alt="" style="left:${st.x}%;top:${st.y}%;width:${w}%;aspect-ratio:1/1;">`;
      }).join('');

      return `
      <div class="diary-grid-card" data-id="${d.id}" data-cover-theme="${d.coverTheme || 'classic'}">
        ${d.lock ? `<span class="diary-grid-card-lock"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>` : ''}
        <div class="diary-grid-card-stickers">${stickerHtml}</div>
        <div class="diary-grid-card-inner">
          <span class="diary-grid-card-mark">◐</span>
          <span class="diary-grid-card-title">${escapeHtml(d.name)}</span>
          <span class="diary-grid-card-rule"></span>
          <span class="diary-grid-card-meta">${d.pages.length} ${d.pages.length === 1 ? 'page' : 'pages'}</span>
        </div>
        <span class="diary-grid-card-signature">${escapeHtml(d.signature || 'made by Yash')}</span>
      </div>
    `;
    }).join('');

    el.diaryGrid.querySelectorAll('.diary-grid-card').forEach(card => {
      card.addEventListener('click', () => openDiaryRespectingLock(card.dataset.id));
    });
  }

  function renderWeekStrip() {
    const dayMood = new Map(); // dateString -> mood emoji (last one wins)
    diaries.forEach(d => d.pages.forEach(p => {
      const key = new Date(p.date).toDateString();
      if (p.mood) dayMood.set(key, p.mood);
      else if (!dayMood.has(key)) dayMood.set(key, '');
    }));

    el.weekStrip.innerHTML = '';
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const isToday = d.toDateString() === today.toDateString();
      const hasEntry = dayMood.has(d.toDateString());
      const mood = dayMood.get(d.toDateString());

      const wrap = document.createElement('div');
      wrap.className = 'day-dot-wrap';
      const dotContent = mood ? `<span class="day-dot-mood ${isToday ? 'today' : ''}">${mood}</span>` : `<span class="day-dot ${hasEntry ? 'filled' : ''} ${isToday ? 'today' : ''}"></span>`;
      wrap.innerHTML = `<span class="day-label">${'SMTWTFS'[i]}</span>${dotContent}`;
      el.weekStrip.appendChild(wrap);
    }
  }

  // ============ SCREEN SWITCHING ============

  const SCREEN_HASHES = { home: '#1', create: '#2', cover: '#3', book: '#4', history: '#5', settings: '#6', profile: '#7', insights: '#8' };
  let currentScreenName = 'home';
  let isPopping = false;
  let isFirstShow = true;

  function showScreen(name, opts) {
    opts = opts || {};
    el.homeScreen.hidden = name !== 'home';
    el.createScreen.hidden = name !== 'create';
    el.coverScreen.hidden = name !== 'cover';
    el.bookScreen.hidden = name !== 'book';
    el.historyScreen.hidden = name !== 'history';
    el.settingsScreen.hidden = name !== 'settings';
    el.profileScreen.hidden = name !== 'profile';
    el.insightsScreen.hidden = name !== 'insights';
    currentScreenName = name;

    // bottom nav only makes sense on the three main tabs
    const navScreens = ['home', 'history', 'insights'];
    el.bottomNav.hidden = !navScreens.includes(name);
    if (navScreens.includes(name)) {
      el.bnavHomeBtn.classList.toggle('active', name === 'home');
      el.bnavHistoryBtn.classList.toggle('active', name === 'history');
      el.bnavInsightsBtn.classList.toggle('active', name === 'insights');
    }

    const hash = SCREEN_HASHES[name] || '#1';
    if (!isPopping) {
      if (location.hash !== hash) {
        if (opts.replace || isFirstShow) history.replaceState({ screen: name }, '', hash);
        else history.pushState({ screen: name }, '', hash);
      }
    }
    isPopping = false;
    isFirstShow = false;
  }

  window.addEventListener('popstate', (e) => {
    isPopping = true;
    const name = (e.state && e.state.screen) || 'home';
    if (name === 'home') initHome();
    else if (name === 'settings') openSettingsScreen();
    else if (name === 'create') openCreateScreen();
    else if (name === 'history') openHistoryScreen();
    else if (name === 'cover') openDiaryRespectingLock(activeDiaryId);
    else if (name === 'book') {
      if (diaries.some(d => d.id === activeDiaryId)) openDiaryRespectingLock(activeDiaryId, () => openBookScreen());
      else initHome();
    }
    else if (name === 'profile') openProfileScreen();
    else if (name === 'insights') openInsightsScreen();
    else initHome();
  });

  // ============ CREATE DIARY ============

  // ============ DIARY TEMPLATES ============

  const DIARY_TEMPLATES = {
    plain: { label: 'Plain', headlinePlaceholder: "What was special today?", coverTheme: 'classic', prompt: '' },
    gratitude: { label: 'Gratitude', headlinePlaceholder: 'Three things I\'m grateful for...', coverTheme: 'sunset', prompt: 'Today I\'m grateful for...' },
    travel: { label: 'Travel', headlinePlaceholder: 'Where did you go today?', coverTheme: 'ocean', prompt: 'Today\'s journey took me to...' },
    dream: { label: 'Dream', headlinePlaceholder: 'What did you dream about?', coverTheme: 'lavender', prompt: 'Last night I dreamt...' },
  };
  let selectedTemplate = 'plain';

  function selectTemplate(key) {
    selectedTemplate = key;
    if (el.templateOptions) {
      el.templateOptions.querySelectorAll('.template-chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.template === key);
      });
    }
    const tpl = DIARY_TEMPLATES[key] || DIARY_TEMPLATES.plain;
    if (el.headlineInput) el.headlineInput.placeholder = tpl.headlinePlaceholder;
    if (el.firstEntryInput && !el.firstEntryInput.value.trim()) {
      el.firstEntryInput.placeholder = tpl.prompt || 'Write, or tap the mic and speak...';
    }
  }

  let createLockType = 'none';

  function selectCreateLockType(type) {
    createLockType = type;
    if (el.createLockTypeOptions) {
      el.createLockTypeOptions.querySelectorAll('.lock-type-chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.locktype === type);
      });
    }
    if (el.createLockFields) el.createLockFields.hidden = type === 'none';
    if (el.createLockSecretInput) {
      el.createLockSecretInput.placeholder = type === 'pattern' ? 'Enter a password' : '4-digit PIN';
      el.createLockSecretInput.maxLength = type === 'pattern' ? 40 : 4;
      el.createLockSecretInput.inputMode = type === 'pattern' ? 'text' : 'numeric';
    }
  }

  function openCreateScreen() {
    el.diaryNameInput.value = '';
    el.headlineInput.value = '';
    el.firstEntryInput.value = '';
    if (el.createLockSecretInput) el.createLockSecretInput.value = '';
    if (el.createLockAnswerInput) el.createLockAnswerInput.value = '';
    selectTemplate('plain');
    selectCreateLockType('none');
    showScreen('create');
    setTimeout(() => el.diaryNameInput.focus(), 300);
  }

  function confirmCreate() {
    const name = el.diaryNameInput.value.trim();
    const headline = el.headlineInput.value.trim();
    const text = el.firstEntryInput.value.trim();

    if (!name) { showToast('Enter a diary name'); el.diaryNameInput.focus(); return; }
    if (!headline) { showToast("Enter today's headline"); el.headlineInput.focus(); return; }

    let lock = null;
    if (createLockType !== 'none') {
      const secret = (el.createLockSecretInput.value || '').trim();
      const answer = (el.createLockAnswerInput.value || '').trim();
      if (createLockType === 'pin' && !/^\d{4}$/.test(secret)) { showToast('Enter exactly 4 digits for PIN'); el.createLockSecretInput.focus(); return; }
      if (createLockType === 'pattern' && secret.length < 4) { showToast('Enter a password (at least 4 characters)'); el.createLockSecretInput.focus(); return; }
      if (!answer) { showToast('Enter an answer for your security question'); el.createLockAnswerInput.focus(); return; }
      lock = { type: createLockType, secret, question: el.createLockQuestionSelect.value, answer: answer.toLowerCase() };
    }

    const tpl = DIARY_TEMPLATES[selectedTemplate] || DIARY_TEMPLATES.plain;
    const diary = {
      id: uid(),
      name,
      createdAt: new Date().toISOString(),
      font: 'serif',
      coverTheme: tpl.coverTheme,
      coverStickers: [],
      template: selectedTemplate,
      lock,
      pages: [{ id: uid(), headline, date: new Date().toISOString(), text: text || '', stickers: [], voiceClips: [], photos: [], tags: [], bookmarked: false }],
    };
    diaries.unshift(diary);
    persist();

    activeDiaryId = diary.id;
    // replace the empty "create" form in history with the cover screen, so
    // pressing back after creating a diary goes to home, not back into the form
    openCoverScreen(diary.id, { replace: true });
  }

  // ============ COVER SCREEN ============

  function openCoverScreen(diaryId, opts) {
    activeDiaryId = diaryId;
    const diary = getDiary(diaryId);
    if (!diary) return;

    el.bookCoverTitle.textContent = diary.name;
    el.bookCoverMeta.textContent = `${diary.pages.length} ${diary.pages.length === 1 ? 'page' : 'pages'} · ${formatDateShort(new Date(diary.createdAt))}`;
    el.bookCoverSignature.textContent = diary.signature || 'made by Yash';
    el.bookCover.dataset.coverTheme = diary.coverTheme || 'classic';
    renderCoverStickers(diary);
    showScreen('cover', opts);
  }

  // ============ COVER SIGNATURE (customisable "made by ...") ============

  function openSignatureSheet() {
    const diary = currentDiary();
    if (!diary) return;
    el.signatureInput.value = diary.signature || 'made by Yash';
    el.signatureSheetBackdrop.hidden = false;
    el.signatureSheet.hidden = false;
    requestAnimationFrame(() => {
      el.signatureSheetBackdrop.classList.add('show');
      el.signatureSheet.classList.add('show');
    });
    setTimeout(() => el.signatureInput.focus(), 300);
  }

  function closeSignatureSheet() {
    el.signatureSheetBackdrop.classList.remove('show');
    el.signatureSheet.classList.remove('show');
    setTimeout(() => { el.signatureSheetBackdrop.hidden = true; el.signatureSheet.hidden = true; }, 350);
  }

  function saveSignature() {
    const diary = currentDiary();
    if (!diary) return;
    const val = el.signatureInput.value.trim() || 'made by Yash';
    diary.signature = val;
    persist();
    el.bookCoverSignature.textContent = val;
    closeSignatureSheet();
    showToast('Signature updated');
  }

  // ============ COVER THEME (color/pattern for the book cover itself) ============

  const COVER_THEME_KEYS = ['classic', 'rosewood', 'midnight', 'forest', 'ocean', 'lavender', 'blush', 'sand', 'sunset', 'mint', 'marble', 'floral'];

  function openCoverThemeSheet() {
    const diary = currentDiary();
    if (!diary) return;
    const active = diary.coverTheme || 'classic';
    el.coverThemeOptions.querySelectorAll('.cover-theme-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.coverTheme === active);
    });
    el.coverThemeSheetBackdrop.hidden = false;
    el.coverThemeSheet.hidden = false;
    requestAnimationFrame(() => {
      el.coverThemeSheetBackdrop.classList.add('show');
      el.coverThemeSheet.classList.add('show');
    });
  }

  function closeCoverThemeSheet() {
    el.coverThemeSheetBackdrop.classList.remove('show');
    el.coverThemeSheet.classList.remove('show');
    setTimeout(() => { el.coverThemeSheetBackdrop.hidden = true; el.coverThemeSheet.hidden = true; }, 350);
  }

  function selectCoverTheme(themeKey) {
    const diary = currentDiary();
    if (!diary) return;
    diary.coverTheme = themeKey;
    persist();
    el.bookCover.dataset.coverTheme = themeKey;
    el.coverThemeOptions.querySelectorAll('.cover-theme-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.coverTheme === themeKey);
    });
  }

  // ============ COVER STICKERS (drag + resize, placed on the book cover) ============

  function openCoverStickerSheet() {
    el.coverStickerSheetBackdrop.hidden = false;
    el.coverStickerSheet.hidden = false;
    requestAnimationFrame(() => {
      el.coverStickerSheetBackdrop.classList.add('show');
      el.coverStickerSheet.classList.add('show');
    });
  }
  function closeCoverStickerSheet() {
    el.coverStickerSheetBackdrop.classList.remove('show');
    el.coverStickerSheet.classList.remove('show');
    setTimeout(() => { el.coverStickerSheetBackdrop.hidden = true; el.coverStickerSheet.hidden = true; }, 350);
  }

  function addStickerToCover(stickerKey) {
    const diary = currentDiary();
    if (!diary) return;
    if (!Array.isArray(diary.coverStickers)) diary.coverStickers = [];
    diary.coverStickers.push({
      id: uid(), key: stickerKey,
      x: 30 + Math.random() * 20, y: 20 + Math.random() * 20,
      sizePct: 20,
    });
    persist();
    closeCoverStickerSheet();
    renderCoverStickers(diary);
    showToast('Sticker added — drag to move it');
  }

  function renderCoverStickers(diary) {
    const container = el.coverStickerLayer;
    if (!container) return;
    container.querySelectorAll('.placed-sticker').forEach(n => n.remove());
    if (!diary || !Array.isArray(diary.coverStickers) || !diary.coverStickers.length) {
      syncContainerPointerEvents(container);
      return;
    }
    diary.coverStickers.forEach(st => {
      const node = document.createElement('div');
      node.className = 'placed-sticker';
      node.style.left = st.x + '%';
      node.style.top = st.y + '%';
      node.style.width = st.sizePct + '%';
      node.style.aspectRatio = '1 / 1';
      node.dataset.stickerId = st.id;

      const img = document.createElement('img');
      img.src = STICKER_LIBRARY[st.key] || '';
      img.alt = st.key;
      img.draggable = false;
      node.appendChild(img);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'sticker-remove-btn';
      removeBtn.textContent = '×';
      removeBtn.style.display = 'none';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        diary.coverStickers = diary.coverStickers.filter(s => s.id !== st.id);
        persist();
        node.remove();
        syncContainerPointerEvents(container);
      });
      node.appendChild(removeBtn);

      const handle = document.createElement('div');
      handle.className = 'sticker-resize-handle';
      handle.style.display = 'none';
      node.appendChild(handle);

      wireStickerDragResize(node, { stickers: diary.coverStickers }, st, container, removeBtn, handle);
      container.appendChild(node);
    });
    syncContainerPointerEvents(container);
  }

  function clearCoverStickers() {
    const diary = currentDiary();
    if (!diary) return;
    diary.coverStickers = [];
    persist();
    renderCoverStickers(diary);
    closeCoverStickerSheet();
    showToast('Cover stickers cleared');
  }

  // ============ BOOK READING SCREEN — two-page spread ============

  function openBookScreen() {
    editingIndex = null;
    activeEditable = null;
    renderSpread(0, null);
    showScreen('book');
  }

  function renderSpread(pIndex, direction) {
    const diary = currentDiary();
    if (!diary) return;
    pairIndex = pIndex;
    applyFont(diary.font);

    const doFill = () => {
      const li = pIndex * 2, ri = pIndex * 2 + 1;
      syncPageFonts();
      fillPageSheet(el.pageSheetLeft, diary.pages[li], li);
      fillPageSheet(el.pageSheetRight, diary.pages[ri], ri);
      const total = diary.pages.length;
      el.pageIndicator.textContent = diary.pages[ri]
        ? `Page ${li + 1}–${ri + 1} of ${total}`
        : `Page ${li + 1} of ${total}`;
      applyActiveThemes();
      const leftLayer = el.pageSheetLeft.querySelector('[data-field="stickerLayer"]');
      const rightLayer = el.pageSheetRight.querySelector('[data-field="stickerLayer"]');
      renderStickersForSheet(leftLayer, diary.pages[li], li);
      renderStickersForSheet(rightLayer, diary.pages[ri], ri);
      renderVoiceClipsForSheet(leftLayer, diary.pages[li], li);
      renderVoiceClipsForSheet(rightLayer, diary.pages[ri], ri);
      renderPhotosForSheet(leftLayer, diary.pages[li], li);
      renderPhotosForSheet(rightLayer, diary.pages[ri], ri);
    };

    if (direction) {
      el.bookSpread.classList.add(direction === 'next' ? 'flip-next-out' : 'flip-prev-out');
      setTimeout(() => {
        doFill();
        el.bookSpread.classList.remove('flip-next-out', 'flip-prev-out');
        el.bookSpread.classList.add('flip-in');
        setTimeout(() => el.bookSpread.classList.remove('flip-in'), 520);
      }, 260);
    } else {
      doFill();
    }

    el.zonePrev.style.display = pIndex === 0 ? 'none' : 'block';
    el.zoneNext.style.display = 'block';
  }

  function fillPageSheet(sheetEl, page, idx) {
    const headlineEl = sheetEl.querySelector('[data-field="headline"]');
    const dateEl = sheetEl.querySelector('[data-field="date"]');
    const linesEl = sheetEl.querySelector('[data-field="lines"]');
    const numEl = sheetEl.querySelector('[data-field="num"]');
    const existingHint = sheetEl.querySelector('.blank-hint');

    if (!page) {
      sheetEl.classList.add('page-blank');
      sheetEl.dataset.pageIndex = '';
      headlineEl.contentEditable = 'false';
      linesEl.contentEditable = 'false';
      headlineEl.textContent = '';
      linesEl.textContent = '';
      dateEl.textContent = '';
      numEl.textContent = '';
      if (!existingHint) {
        const hint = document.createElement('span');
        hint.className = 'blank-hint';
        hint.textContent = '+ Tap to add a page';
        sheetEl.appendChild(hint);
      }
      sheetEl.onclick = addPageAndGo;
      return;
    }

    sheetEl.classList.remove('page-blank');
    if (existingHint) existingHint.remove();
    sheetEl.onclick = null;
    sheetEl.dataset.pageIndex = String(idx);
    headlineEl.contentEditable = 'true';
    linesEl.contentEditable = 'true';
    headlineEl.textContent = page.headline || '';
    dateEl.textContent = formatDateLong(new Date(page.date)) + (page.mood ? '  ' + page.mood : '');
    fillMiniLinesCapped(linesEl, page.text || '');
    numEl.textContent = String(idx + 1);
  }

  function saveSheetEdits(sheetEl) {
    const idxStr = sheetEl.dataset.pageIndex;
    if (idxStr === '' || idxStr === undefined) return;
    const diary = currentDiary();
    if (!diary) return;
    const page = diary.pages[Number(idxStr)];
    if (!page) return;
    const headlineEl = sheetEl.querySelector('[data-field="headline"]');
    const linesEl = sheetEl.querySelector('[data-field="lines"]');
    page.headline = headlineEl.textContent.trim();
    page.text = linesEl.textContent;
    persist();
  }

  const MINI_PAGE_MAX_LINES = 12;
  let lineLimitToastShown = false;

  // ============ UNIFIED TEXT-WRAP MATCHING (Mini View <-> Full/Expand View) ============
  // Mini View and the Fullscreen/Expand View render the SAME page.text in two
  // differently-sized boxes. If each box just used its own fixed font-size,
  // the number of words that fit on one line would differ between the two
  // (e.g. 4-5 words in Mini vs 8-10 in Full), so the same text would wrap
  // into a different number of lines and any sticker/photo positioned
  // relative to the text would appear to "jump" or resize between views.
  //
  // Fix: every time a box is shown, measure its actual content width in CSS
  // pixels and set its font-size so that (contentWidth / fontSize) — the
  // "characters per line" ratio — is IDENTICAL across both boxes. Since both
  // boxes already share the same font-family and line-height multiplier,
  // matching that ratio guarantees identical word-wrap and an identical line
  // count for the same text, no matter how big either box is drawn.
  const WRAP_REF_CHARS_PER_LINE = 30; // baseline "characters per line" the app is tuned around
  const FS_BODY_LINE_HEIGHT_MULT = 1.9; // must match --fs-body-line-height in css/style.css

  function applyMatchedWrapFont(targetEl) {
    if (!targetEl) return;
    const cs = window.getComputedStyle(targetEl);
    const paddingX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const contentWidth = targetEl.clientWidth - paddingX;
    if (contentWidth <= 0) return;
    const fontSize = contentWidth / (WRAP_REF_CHARS_PER_LINE * 0.52);
    const clamped = Math.max(9, Math.min(fontSize, 26));
    targetEl.style.fontSize = clamped.toFixed(2) + 'px';
    // if this is the Full/Expand View's body, keep its sticker/photo
    // coordinate zone (fsBodyZone) pinned to exactly 12 lines of THIS
    // font-size, so it always matches the visible text box height —
    // otherwise placed photos/stickers would drift relative to the text
    // whenever the dynamic font-size differs from the old fixed CSS size.
    if (targetEl === el.fsBody && el.fsBodyZone) {
      el.fsBodyZone.style.height = (clamped * FS_BODY_LINE_HEIGHT_MULT * MINI_PAGE_MAX_LINES) + 'px';
    }
    return clamped;
  }

  function syncPageFonts() {
    [
      el.pageSheetLeft && el.pageSheetLeft.querySelector('[data-field="lines"]'),
      el.pageSheetRight && el.pageSheetRight.querySelector('[data-field="lines"]'),
      el.fsBody
    ].forEach(applyMatchedWrapFont);
  }

  // Fills linesEl with page.text, but visually capped to ~12 lines for the
  // Mini Book View. The underlying page.text is NEVER touched here — this
  // only decides what gets displayed. If the saved text is somehow longer
  // than 12 lines (both views now share the same 12-line cap with auto
  // overflow, so this is just a safety net), we trim the *display* copy and
  // append an ellipsis, so nothing overflows the page or gets cut mid-word.
  function fillMiniLinesCapped(linesEl, fullText) {
    applyMatchedWrapFont(linesEl);
    linesEl.textContent = fullText || '';
    if (!fullText) return;
    const style = window.getComputedStyle(linesEl);
    const lineHeight = parseFloat(style.lineHeight) || (parseFloat(style.fontSize) * 1.9);
    const maxHeight = lineHeight * MINI_PAGE_MAX_LINES;
    if (linesEl.scrollHeight <= maxHeight + 1) return; // fits, nothing to do

    const ELLIPSIS = '…';
    let lo = 0, hi = fullText.length, best = 0;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      linesEl.textContent = fullText.slice(0, mid).trimEnd() + ELLIPSIS;
      if (linesEl.scrollHeight <= maxHeight + 1) { best = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    linesEl.textContent = fullText.slice(0, best).trimEnd() + ELLIPSIS;
  }

  // ============ 12-LINE CAP WITH AUTO OVERFLOW TO NEXT PAGE ============
  // Shared by BOTH Mini View and Full/Expand View so behavior is identical
  // everywhere: once the box is full at 12 lines, further typing is NOT
  // blocked — it is carried over onto the next page (a new page is created
  // if needed), and the caret follows the overflowed text there.
  function measureMaxHeight(linesEl) {
    const style = window.getComputedStyle(linesEl);
    const lineHeight = parseFloat(style.lineHeight) || (parseFloat(style.fontSize) * 1.9);
    return lineHeight * MINI_PAGE_MAX_LINES;
  }

  // Finds the longest prefix of `text` that still fits within the 12-line
  // box, without cutting a word in half. Returns { fitting, overflow }.
  function splitTextAtLineLimit(linesEl, text) {
    const maxHeight = measureMaxHeight(linesEl);
    const original = linesEl.textContent;
    linesEl.textContent = text;
    if (linesEl.scrollHeight <= maxHeight + 1) {
      linesEl.textContent = original;
      return { fitting: text, overflow: '' };
    }
    let lo = 0, hi = text.length, best = 0;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      linesEl.textContent = text.slice(0, mid);
      if (linesEl.scrollHeight <= maxHeight + 1) { best = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    let cut = best;
    if (cut < text.length && text[cut] && !/\s/.test(text[cut])) {
      const lastSpace = text.lastIndexOf(' ', cut);
      if (lastSpace > 0) cut = lastSpace;
    }
    linesEl.textContent = original;
    return { fitting: text.slice(0, cut).replace(/\s+$/, ''), overflow: text.slice(cut).replace(/^\s+/, '') };
  }

  // Ensures a page exists right after pageIdx, creating a blank one if
  // needed, and returns its index.
  function ensureNextPageExists(pageIdx) {
    const diary = currentDiary();
    if (!diary) return -1;
    const nextIdx = pageIdx + 1;
    if (!diary.pages[nextIdx]) {
      diary.pages.splice(nextIdx, 0, { id: uid(), headline: '', date: new Date().toISOString(), text: '', stickers: [], voiceClips: [], photos: [], tags: [], bookmarked: false });
    }
    return nextIdx;
  }

  // Core overflow handler: call after text changes in a 12-line box. If the
  // box now holds more than 12 lines' worth of text, spill the tail onto the
  // next page (prepended, so nothing already there is lost) and let the
  // caller move the user's caret to the overflowed page.
  function enforceLineLimitWithOverflow(linesEl, pageIdx, opts) {
    opts = opts || {};
    if (!linesEl || pageIdx === null || pageIdx === undefined || pageIdx < 0) return false;
    const maxHeight = measureMaxHeight(linesEl);
    if (linesEl.scrollHeight <= maxHeight + 1) {
      linesEl.classList.remove('line-limit-exceeded');
      return false;
    }
    const diary = currentDiary();
    if (!diary || !diary.pages[pageIdx]) return false;

    const fullText = linesEl.textContent;
    const { fitting, overflow } = splitTextAtLineLimit(linesEl, fullText);
    if (!overflow) return false; // safety: nothing to spill

    linesEl.textContent = fitting;
    diary.pages[pageIdx].text = fitting;

    const nextIdx = ensureNextPageExists(pageIdx);
    const nextPage = diary.pages[nextIdx];
    nextPage.text = overflow + (nextPage.text ? ' ' + nextPage.text : '');
    persist();

    if (!lineLimitToastShown) {
      lineLimitToastShown = true;
      showToast('Page full — continuing on the next page');
      setTimeout(() => { lineLimitToastShown = false; }, 2500);
    }

    if (typeof opts.onOverflow === 'function') opts.onOverflow(nextIdx, overflow);
    return true;
  }

  // Enforces the shared 12-line cap live while typing in Mini Book View;
  // once full, overflow text is carried onto the next page automatically.
  function enforceMiniLineLimit(linesEl) {
    if (!linesEl) return false;
    const sheetEl = linesEl.closest('.page-sheet');
    const idxStr = sheetEl && sheetEl.dataset.pageIndex;
    const pageIdx = (idxStr !== undefined && idxStr !== '') ? Number(idxStr) : NaN;
    if (isNaN(pageIdx)) return false;
    return enforceLineLimitWithOverflow(linesEl, pageIdx, {
      onOverflow: (nextIdx) => {
        clearTimeout(autosaveTimer);
        renderSpread(Math.floor(nextIdx / 2), 'next');
        setTimeout(() => {
          const nextSheetEl = (nextIdx % 2 === 0) ? el.pageSheetLeft : el.pageSheetRight;
          const nextLinesEl = nextSheetEl && nextSheetEl.querySelector('[data-field="lines"]');
          if (nextLinesEl) {
            nextLinesEl.focus();
            const range = document.createRange();
            range.selectNodeContents(nextLinesEl);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }, 350);
      }
    });
  }

  // Same overflow behavior, wired for the Full/Expand View's fsBody box.
  function enforceFsLineLimit(linesEl) {
    if (!linesEl || editingIndex === null) return false;
    return enforceLineLimitWithOverflow(linesEl, editingIndex, {
      onOverflow: (nextIdx) => {
        clearTimeout(autosaveTimer);
        editingIndex = nextIdx;
        const diary = currentDiary();
        const nextPage = diary && diary.pages[nextIdx];
        el.fsHeadline.textContent = (nextPage && nextPage.headline) || '';
        el.fsDate.textContent = nextPage ? formatDateLong(new Date(nextPage.date)) : '';
        applyMatchedWrapFont(el.fsBody);
        el.fsBody.textContent = (nextPage && nextPage.text) || '';
        renderStickersForSheet(el.fsStickerLayer, nextPage, nextIdx, { fullscreen: true });
        renderVoiceClipsForSheet(el.fsStickerLayer, nextPage, nextIdx, { fullscreen: true });
        renderPhotosForSheet(el.fsStickerLayer, nextPage, nextIdx);
        renderFsBookmark(nextPage);
        renderFsTags(nextPage);
        el.fsBody.focus();
        const range = document.createRange();
        range.selectNodeContents(el.fsBody);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  }

  function scheduleAutosave(fn) {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(fn, 800);
  }

  function goToPair(direction) {
    const diary = currentDiary();
    if (!diary) return;

    if (direction === 'prev') {
      if (pairIndex === 0) return;
      renderSpread(pairIndex - 1, 'prev');
    } else {
      const nextPair = pairIndex + 1;
      const li = nextPair * 2;
      if (li >= diary.pages.length) {
        addPageAndGo();
      } else {
        renderSpread(nextPair, 'next');
      }
    }
  }

  function addPageAndGo() {
    const diary = currentDiary();
    if (!diary) return;
    diary.pages.push({ id: uid(), headline: '', date: new Date().toISOString(), text: '', stickers: [], voiceClips: [], photos: [], tags: [], bookmarked: false });
    persist();
    const newIdx = diary.pages.length - 1;
    renderSpread(Math.floor(newIdx / 2), 'next');
    setTimeout(() => {
      const sheetEl = (newIdx % 2 === 0) ? el.pageSheetLeft : el.pageSheetRight;
      const h = sheetEl.querySelector('[data-field="headline"]');
      if (h) h.focus();
    }, 350);
  }

  function getFocusedPageIndex() {
    let idx = (activeEditable && activeEditable.sheetEl) ? Number(activeEditable.sheetEl.dataset.pageIndex) : NaN;
    if (isNaN(idx)) idx = pairIndex * 2;
    return idx;
  }

  // ============ FONT PICKER ============

  function applyFont(fontKey) {
    const fam = FONT_MAP[fontKey] || FONT_MAP.serif;
    [el.pageSheetLeft, el.pageSheetRight].forEach(sheet => {
      const h = sheet.querySelector('[data-field="headline"]');
      const l = sheet.querySelector('[data-field="lines"]');
      if (h) h.style.fontFamily = fam;
      if (l) l.style.fontFamily = fam;
    });
    el.fsHeadline.style.fontFamily = fam;
    el.fsBody.style.fontFamily = fam;
  }

  function openFontSheet() {
    const diary = currentDiary();
    document.querySelectorAll('.font-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.font === diary.font);
    });
    el.fontSheetBackdrop.hidden = false;
    el.fontSheet.hidden = false;
    requestAnimationFrame(() => {
      el.fontSheetBackdrop.classList.add('show');
      el.fontSheet.classList.add('show');
    });
  }

  function closeFontSheet() {
    el.fontSheetBackdrop.classList.remove('show');
    el.fontSheet.classList.remove('show');
    setTimeout(() => { el.fontSheetBackdrop.hidden = true; el.fontSheet.hidden = true; }, 350);
  }

  function selectFont(fontKey) {
    const diary = currentDiary();
    diary.font = fontKey;
    persist();
    applyFont(fontKey);
    closeFontSheet();
  }

  // ============ PAGE THEMES (per-page background: night, sunset, forest, ...) ============

  const THEME_KEYS = ['parchment', 'night', 'sunset', 'forest', 'lavender', 'ocean', 'blush', 'sand'];

  function themeSheetTargetPage() {
    // when opened from the fullscreen reader, the theme applies to that page;
    // otherwise it applies to whichever spread page is currently focused.
    if (!el.fullscreenReader.hidden && editingIndex !== null) return editingIndex;
    return getFocusedPageIndex();
  }

  function openThemeSheet() {
    const diary = currentDiary();
    if (!diary) return;
    const idx = themeSheetTargetPage();
    const page = diary.pages[idx];
    const activeTheme = (page && page.theme) || diary.theme || 'parchment';

    el.themeOptions.querySelectorAll('.theme-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === activeTheme);
    });
    el.themeSheetScopeLabel.textContent = page ? 'Applies to this page' : 'Applies to this diary';
    el.themeSheetBackdrop.hidden = false;
    el.themeSheet.hidden = false;
    requestAnimationFrame(() => {
      el.themeSheetBackdrop.classList.add('show');
      el.themeSheet.classList.add('show');
    });
  }

  function closeThemeSheet() {
    el.themeSheetBackdrop.classList.remove('show');
    el.themeSheet.classList.remove('show');
    setTimeout(() => { el.themeSheetBackdrop.hidden = true; el.themeSheet.hidden = true; }, 350);
  }

  function selectTheme(themeKey) {
    const diary = currentDiary();
    if (!diary) return;
    const idx = themeSheetTargetPage();
    const page = diary.pages[idx];
    if (page) page.theme = themeKey;
    else diary.theme = themeKey;
    persist();
    applyActiveThemes();
    el.themeOptions.querySelectorAll('.theme-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === themeKey);
    });
  }

  function applyThemeToWholeDiary() {
    const diary = currentDiary();
    if (!diary) return;
    const idx = themeSheetTargetPage();
    const page = diary.pages[idx];
    const themeKey = (page && page.theme) || diary.theme || 'parchment';
    diary.theme = themeKey;
    diary.pages.forEach(p => { delete p.theme; });
    persist();
    applyActiveThemes();
    closeThemeSheet();
    showToast('Theme set for the whole diary');
  }

  // apply the correct theme to whichever page sheets / fullscreen sheet are visible right now
  function applyActiveThemes() {
    const diary = currentDiary();
    if (!diary) return;
    const li = pairIndex * 2, ri = pairIndex * 2 + 1;
    const leftPage = diary.pages[li], rightPage = diary.pages[ri];
    el.pageSheetLeft.dataset.theme = (leftPage && leftPage.theme) || diary.theme || 'parchment';
    el.pageSheetRight.dataset.theme = (rightPage && rightPage.theme) || diary.theme || 'parchment';
    if (editingIndex !== null) {
      const page = diary.pages[editingIndex];
      el.fsSheet.dataset.theme = (page && page.theme) || diary.theme || 'parchment';
    }
  }

  // ============ STICKERS (drag + resize, placed directly on a page) ============

  const STICKER_LIBRARY = {
    'butterfly-rose': 'assets/stickers/butterfly-rose.svg',
    'butterfly-teal': 'assets/stickers/butterfly-teal.svg',
    'bird': 'assets/stickers/bird.svg',
    'flower-daisy': 'assets/stickers/flower-daisy.svg',
    'flower-rose': 'assets/stickers/flower-rose.svg',
    'leaf': 'assets/stickers/leaf.svg',
    'heart': 'assets/stickers/heart.svg',
    'star': 'assets/stickers/star.svg',
    'moon': 'assets/stickers/moon.svg',
    'sun': 'assets/stickers/sun.svg',
  };

  function openStickerSheet() {
    el.stickerSheetBackdrop.hidden = false;
    el.stickerSheet.hidden = false;
    requestAnimationFrame(() => {
      el.stickerSheetBackdrop.classList.add('show');
      el.stickerSheet.classList.add('show');
    });
  }
  function closeStickerSheet() {
    el.stickerSheetBackdrop.classList.remove('show');
    el.stickerSheet.classList.remove('show');
    setTimeout(() => { el.stickerSheetBackdrop.hidden = true; el.stickerSheet.hidden = true; }, 350);
  }

  function addStickerToCurrentPage(stickerKey) {
    const diary = currentDiary();
    if (!diary) return;
    const idx = themeSheetTargetPage();
    const page = diary.pages[idx];
    if (!page) { showToast('Add a page first.'); return; }
    if (!Array.isArray(page.stickers)) page.stickers = [];
    page.stickers.push({
      id: uid(), key: stickerKey,
      x: 38 + Math.random() * 10, y: 14 + Math.random() * 10, // percent-based position
      sizePct: 32,
    });
    persist();
    closeStickerSheet();

    if (!el.fullscreenReader.hidden && editingIndex === idx) {
      renderStickersForSheet(el.fsStickerLayer, page, idx, { fullscreen: true });
    } else {
      renderSpread(pairIndex, null);
    }
    showToast('Sticker added — drag to move it');
  }

  // renders every sticker belonging to `page` inside `layerEl` — a small absolutely-positioned
  // overlay that sits on top of a page (either the fullscreen sticker layer, or the matching
  // layer inside a book-spread page sheet). Coordinates are stored as percentages so they hold
  // up across the different sizes the same page is shown at.
  function renderStickersForSheet(layerEl, page, pageIdx, opts) {
    const container = layerEl;
    if (!container) return;

    container.querySelectorAll('.placed-sticker:not(.placed-photo)').forEach(n => n.remove());
    if (!page || !Array.isArray(page.stickers) || !page.stickers.length) {
      syncContainerPointerEvents(container);
      return;
    }

    page.stickers.forEach(st => {
      const node = document.createElement('div');
      node.className = 'placed-sticker';
      node.style.left = st.x + '%';
      node.style.top = st.y + '%';
      node.style.width = st.sizePct + '%';
      node.style.aspectRatio = '1 / 1';
      node.dataset.stickerId = st.id;

      const img = document.createElement('img');
      img.src = STICKER_LIBRARY[st.key] || '';
      img.alt = st.key;
      img.draggable = false;
      node.appendChild(img);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'sticker-remove-btn';
      removeBtn.textContent = '×';
      removeBtn.style.display = 'none';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeSticker(page, st.id, container);
      });
      node.appendChild(removeBtn);

      const handle = document.createElement('div');
      handle.className = 'sticker-resize-handle';
      handle.style.display = 'none';
      node.appendChild(handle);

      wireStickerDragResize(node, page, st, container, removeBtn, handle);
      container.appendChild(node);
    });
    syncContainerPointerEvents(container);
  }

  function removeSticker(page, stickerId, container) {
    page.stickers = page.stickers.filter(s => s.id !== stickerId);
    persist();
    const node = container.querySelector(`[data-sticker-id="${stickerId}"]`);
    if (node) node.remove();
    syncContainerPointerEvents(container);
  }

  function syncContainerPointerEvents(container) {
    // the overlay itself must always stay click-through so taps reach the text
    // underneath; only the individual placed items (which set their own
    // pointer-events: auto in CSS) should actually be interactive.
    if (container) container.style.pointerEvents = 'none';
  }

  function deselectAllStickers(container) {
    container.querySelectorAll('.placed-sticker').forEach(n => {
      n.classList.remove('selected');
      const rb = n.querySelector('.sticker-remove-btn');
      const rh = n.querySelector('.sticker-resize-handle');
      if (rb) rb.style.display = 'none';
      if (rh) rh.style.display = 'none';
    });
  }

  function wireStickerDragResize(node, page, stickerData, container, removeBtn, handle) {
    let dragging = false, resizing = false;
    let startX = 0, startY = 0, startLeftPct = 0, startTopPct = 0, startSize = 0;

    function selectThis() {
      deselectAllStickers(container);
      node.classList.add('selected');
      removeBtn.style.display = 'grid';
      handle.style.display = 'block';
    }

    node.addEventListener('click', (e) => {
      e.stopPropagation();
      selectThis();
    });

    node.addEventListener('pointerdown', (e) => {
      if (e.target === handle) return;
      e.stopPropagation();
      selectThis();
      dragging = true;
      node.classList.add('dragging');
      startX = e.clientX; startY = e.clientY;
      startLeftPct = stickerData.x; startTopPct = stickerData.y;
      node.setPointerCapture && node.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      selectThis();
      resizing = true;
      startX = e.clientX; startY = e.clientY;
      startSize = stickerData.sizePct;
      handle.setPointerCapture && handle.setPointerCapture(e.pointerId);
    });

    function onMove(e) {
      if (!dragging && !resizing) return;
      const rect = container.getBoundingClientRect();
      if (dragging) {
        const dxPct = ((e.clientX - startX) / rect.width) * 100;
        const dyPct = ((e.clientY - startY) / rect.height) * 100;
        stickerData.x = Math.max(0, Math.min(92, startLeftPct + dxPct));
        stickerData.y = Math.max(0, Math.min(92, startTopPct + dyPct));
        node.style.left = stickerData.x + '%';
        node.style.top = stickerData.y + '%';
      } else if (resizing) {
        // resize by dragging the handle; convert the pixel drag distance into a
        // percentage of the container width so the stored size is resolution-independent
        const deltaPx = (e.clientX - startX + e.clientY - startY) / 2;
        const deltaPct = (deltaPx / rect.width) * 100;
        stickerData.sizePct = Math.max(10, Math.min(70, startSize + deltaPct));
        node.style.width = stickerData.sizePct + '%';
      }
    }
    function onUp() {
      if (dragging || resizing) persist();
      dragging = false; resizing = false;
      node.classList.remove('dragging');
    }

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerup', onUp);
    node.addEventListener('pointercancel', onUp);
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  }

  // ============ VOICE CLIP WIDGETS (real recorded audio, draggable/resizable, WhatsApp-style bubble) ============

  const WAVE_BAR_COUNT = 22;

  function renderVoiceClipsForSheet(layerEl, page, pageIdx, opts) {
    opts = opts || {};
    const container = layerEl;
    if (!container) return;

    container.querySelectorAll('.placed-voice-clip').forEach(n => n.remove());
    if (!page || !Array.isArray(page.voiceClips) || !page.voiceClips.length) {
      syncContainerPointerEvents(container);
      return;
    }

    page.voiceClips.forEach(clip => {
      const node = document.createElement('div');
      node.className = 'placed-voice-clip';
      node.style.left = clip.x + '%';
      node.style.top = clip.y + '%';
      node.style.width = (clip.widthPct || 78) + '%';
      node.dataset.clipId = clip.id;

      const playBtn = document.createElement('button');
      playBtn.className = 'voice-clip-play';
      const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      const pauseIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
      playBtn.innerHTML = playIcon;
      node.appendChild(playBtn);

      const body = document.createElement('div');
      body.className = 'voice-clip-body';

      const wave = document.createElement('span');
      wave.className = 'voice-clip-wave';
      const amps = (clip.waveform && clip.waveform.length) ? clip.waveform : null;
      const bars = [];
      for (let i = 0; i < WAVE_BAR_COUNT; i++) {
        const bar = document.createElement('span');
        const amp = amps ? amps[i] : (0.3 + Math.random() * 0.7);
        bar.style.height = Math.max(3, Math.round(amp * 18)) + 'px';
        bar.classList.add('wave-active');
        wave.appendChild(bar);
        bars.push(bar);
      }
      body.appendChild(wave);

      const durationEl = document.createElement('span');
      durationEl.className = 'voice-clip-duration';
      durationEl.textContent = clip.duration ? formatClipDuration(clip.duration) : (clip.dataUrl ? '0:00' : 'no audio');
      body.appendChild(durationEl);

      node.appendChild(body);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'voice-clip-remove';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audioEl) { audioEl.pause(); }
        page.voiceClips = page.voiceClips.filter(c => c.id !== clip.id);
        persist();
        node.remove();
        syncContainerPointerEvents(container);
      });
      node.appendChild(removeBtn);

      const handle = document.createElement('div');
      handle.className = 'voice-clip-resize-handle';
      node.appendChild(handle);

      let audioEl = clip.dataUrl ? new Audio(clip.dataUrl) : null;
      let rafId = null;

      function stopProgressLoop() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        node.classList.remove('playing');
      }

      function tickProgress() {
        if (!audioEl || audioEl.paused) { stopProgressLoop(); return; }
        const pct = audioEl.duration ? (audioEl.currentTime / audioEl.duration) : 0;
        const filledCount = Math.round(pct * bars.length);
        bars.forEach((b, i) => b.classList.toggle('wave-played', i < filledCount));
        rafId = requestAnimationFrame(tickProgress);
      }

      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!audioEl) { showToast('This voice note has no recorded audio.'); return; }
        if (audioEl.paused) {
          document.querySelectorAll('.placed-voice-clip.playing').forEach(n => {
            if (n !== node) n.dispatchEvent(new Event('voiceclip-pause-others'));
          });
          audioEl.play().catch(() => showToast("Couldn't play the voice note."));
          playBtn.innerHTML = pauseIcon;
          node.classList.add('playing');
          rafId = requestAnimationFrame(tickProgress);
        } else {
          audioEl.pause();
          playBtn.innerHTML = playIcon;
          stopProgressLoop();
        }
      });
      node.addEventListener('voiceclip-pause-others', () => {
        if (audioEl && !audioEl.paused) { audioEl.pause(); playBtn.innerHTML = playIcon; stopProgressLoop(); }
      });
      if (audioEl) {
        audioEl.addEventListener('ended', () => {
          playBtn.innerHTML = playIcon;
          bars.forEach(b => b.classList.remove('wave-played'));
          stopProgressLoop();
        });
        audioEl.addEventListener('loadedmetadata', () => {
          if (isFinite(audioEl.duration) && !clip.duration) {
            clip.duration = audioEl.duration;
            durationEl.textContent = formatClipDuration(audioEl.duration);
            persist();
          }
        });
      }

      wireVoiceClipDragResize(node, page, clip, container, handle);
      container.appendChild(node);
    });
    syncContainerPointerEvents(container);
  }

  function formatClipDuration(seconds) {
    const s = Math.max(0, Math.round(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }

  function wireVoiceClipDragResize(node, page, clipData, container, handle) {
    let dragging = false, resizing = false;
    let startX = 0, startY = 0, startLeftPct = 0, startTopPct = 0, startWidth = 0;

    node.addEventListener('pointerdown', (e) => {
      if (e.target === handle || e.target.closest('.voice-clip-play') || e.target.closest('.voice-clip-remove')) return;
      e.stopPropagation();
      dragging = true;
      node.classList.add('dragging');
      startX = e.clientX; startY = e.clientY;
      startLeftPct = clipData.x; startTopPct = clipData.y;
      node.setPointerCapture && node.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startWidth = clipData.widthPct || 78;
      handle.setPointerCapture && handle.setPointerCapture(e.pointerId);
    });

    function onMove(e) {
      if (!dragging && !resizing) return;
      const rect = container.getBoundingClientRect();
      if (dragging) {
        const dxPct = ((e.clientX - startX) / rect.width) * 100;
        const dyPct = ((e.clientY - startY) / rect.height) * 100;
        clipData.x = Math.max(0, Math.min(85, startLeftPct + dxPct));
        clipData.y = Math.max(0, Math.min(90, startTopPct + dyPct));
        node.style.left = clipData.x + '%';
        node.style.top = clipData.y + '%';
      } else if (resizing) {
        const deltaPct = ((e.clientX - startX) / rect.width) * 100;
        clipData.widthPct = Math.max(45, Math.min(96, startWidth + deltaPct));
        node.style.width = clipData.widthPct + '%';
      }
    }
    function onUp() {
      if (dragging || resizing) persist();
      dragging = false; resizing = false;
      node.classList.remove('dragging');
    }

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerup', onUp);
    node.addEventListener('pointercancel', onUp);
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  }

  function rerenderVoiceClips(target, page, idx) {
    if (target === 'fs') {
      renderVoiceClipsForSheet(el.fsStickerLayer, page, idx, { fullscreen: true });
    } else {
      const sheetEl = (activeEditable && activeEditable.sheetEl) || el.pageSheetLeft;
      const layerEl = sheetEl.querySelector('[data-field="stickerLayer"]');
      renderVoiceClipsForSheet(layerEl, page, idx, {});
    }
  }

  // ---- real audio recording (MediaRecorder) — press & hold the mic to record, like WhatsApp ----

  let mediaRecorder = null, recordedChunks = [], recordStream = null;
  let recordStartTime = 0, recordTimerInterval = null, recordTargetInfo = null;
  let audioCtxForAnalysis = null;

  function startVoiceNoteRecording(target) {
    if (mediaRecorder && mediaRecorder.state === 'recording') return;
    const diary = currentDiary();
    if (!diary) return;
    const idx = (target === 'fs') ? editingIndex : getFocusedPageIndex();
    const page = diary.pages[idx];
    if (!page) { showToast('Add a page first.'); return; }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Voice recording is not supported in this browser.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      recordStream = stream;
      recordedChunks = [];
      recordTargetInfo = { target, idx, page };
      const mimeType = ['audio/webm', 'audio/mp4', 'audio/ogg'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
      mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) recordedChunks.push(e.data); };
      mediaRecorder.onstop = handleRecordingStop;
      mediaRecorder.start();
      recordStartTime = Date.now();
      showRecordingIndicator(true);
      recordTimerInterval = setInterval(updateRecordingTime, 200);
      if (settings.hapticsOn !== false && navigator.vibrate) navigator.vibrate(15);
    }).catch(err => {
      console.error(err);
      showToast(err && err.name === 'NotAllowedError' ? "Couldn't access the mic." : "Couldn't start recording.");
    });
  }

  function stopVoiceNoteRecording(cancel) {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
    if (cancel) recordedChunks = [];
    mediaRecorder._cancelled = !!cancel;
    mediaRecorder.stop();
    clearInterval(recordTimerInterval);
    showRecordingIndicator(false);
    if (recordStream) recordStream.getTracks().forEach(t => t.stop());
  }

  function updateRecordingTime() {
    const elapsed = (Date.now() - recordStartTime) / 1000;
    el.recordingTime.textContent = formatClipDuration(elapsed);
    if (elapsed >= 120) stopVoiceNoteRecording(false); // 2 min safety cap
  }

  function showRecordingIndicator(show) {
    if (!el.recordingIndicator) return;
    if (show) {
      el.recordingIndicator.hidden = false;
      el.recordingTime.textContent = '0:00';
      requestAnimationFrame(() => el.recordingIndicator.classList.add('show'));
    } else {
      el.recordingIndicator.classList.remove('show');
      setTimeout(() => { el.recordingIndicator.hidden = true; }, 250);
    }
    el.pageMicFab.classList.toggle('recording', show);
    el.fsMicFab.classList.toggle('recording', show);
    if (el.fsVoiceNoteBtn) el.fsVoiceNoteBtn.classList.toggle('recording', show);
  }

  function handleRecordingStop() {
    const wasCancelled = mediaRecorder && mediaRecorder._cancelled;
    const info = recordTargetInfo;
    const durationSec = (Date.now() - recordStartTime) / 1000;
    mediaRecorder = null;
    recordTargetInfo = null;

    if (wasCancelled || !info || durationSec < 0.4 || !recordedChunks.length) {
      recordedChunks = [];
      if (!wasCancelled && durationSec < 0.4) showToast('Recording too short.');
      return;
    }

    const blob = new Blob(recordedChunks, { type: recordedChunks[0].type || 'audio/webm' });
    recordedChunks = [];

    blobToDataUrl(blob).then(dataUrl => {
      analyzeWaveform(blob).then(waveform => {
        const diary = currentDiary();
        if (!diary) return;
        const page = diary.pages[info.idx];
        if (!page) return;
        if (!Array.isArray(page.voiceClips)) page.voiceClips = [];
        page.voiceClips.push({
          id: uid(), x: 8 + Math.random() * 10, y: 6 + Math.random() * 8, widthPct: 78,
          dataUrl, duration: durationSec, waveform,
        });
        persist();
        rerenderVoiceClips(info.target, page, info.idx);
        showToast('Voice note added — drag to place it');
      });
    }).catch(() => showToast("Couldn't save the recording."));
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // decode the recorded audio into a compact amplitude array so the bubble shows a real waveform
  function analyzeWaveform(blob) {
    return new Promise((resolve) => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) { resolve(null); return; }
      blob.arrayBuffer().then(buf => {
        if (!audioCtxForAnalysis) audioCtxForAnalysis = new AudioCtx();
        audioCtxForAnalysis.decodeAudioData(buf.slice(0), (audioBuffer) => {
          const raw = audioBuffer.getChannelData(0);
          const blockSize = Math.max(1, Math.floor(raw.length / WAVE_BAR_COUNT));
          const amps = [];
          for (let i = 0; i < WAVE_BAR_COUNT; i++) {
            let sum = 0;
            const start = i * blockSize;
            for (let j = 0; j < blockSize && (start + j) < raw.length; j++) sum += Math.abs(raw[start + j]);
            amps.push(sum / blockSize);
          }
          const max = Math.max(...amps, 0.01);
          resolve(amps.map(a => Math.max(0.15, Math.min(1, a / max))));
        }, () => resolve(null));
      }).catch(() => resolve(null));
    });
  }

  // press-and-hold the mic to record real audio (like WhatsApp); a quick tap still does
  // speech-to-text via wireHoldToRecord's companion toggleRecording click handler.
  function wireHoldToRecord(node, target) {
    if (!node) return;
    const HOLD_MS = 450;
    let timer = null, holding = false;
    const start = (e) => {
      holding = false;
      timer = setTimeout(() => {
        holding = true;
        startVoiceNoteRecording(target);
      }, HOLD_MS);
    };
    const cancelTimer = () => clearTimeout(timer);
    const release = () => {
      cancelTimer();
      if (holding) { stopVoiceNoteRecording(false); holding = false; }
    };
    const abort = () => {
      cancelTimer();
      if (holding) { stopVoiceNoteRecording(true); holding = false; }
    };
    node.addEventListener('pointerdown', start);
    node.addEventListener('pointerup', release);
    node.addEventListener('pointerleave', abort);
    node.addEventListener('pointercancel', abort);
    // suppress the click (which would otherwise also toggle speech-to-text) after a hold-record
    node.addEventListener('click', (e) => { if (holding) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  // ============ MOOD PICKER ============

  function openMoodSheet() {
    const diary = currentDiary();
    if (!diary) return;
    const idx = getFocusedPageIndex();
    if (!diary.pages[idx]) { showToast('Add a page first.'); return; }

    document.querySelectorAll('.mood-option').forEach(btn => {
      btn.classList.toggle('active', (btn.dataset.mood || '') === (diary.pages[idx].mood || ''));
    });
    el.moodSheetBackdrop.hidden = false;
    el.moodSheet.hidden = false;
    requestAnimationFrame(() => {
      el.moodSheetBackdrop.classList.add('show');
      el.moodSheet.classList.add('show');
    });
  }

  function closeMoodSheet() {
    el.moodSheetBackdrop.classList.remove('show');
    el.moodSheet.classList.remove('show');
    setTimeout(() => { el.moodSheetBackdrop.hidden = true; el.moodSheet.hidden = true; }, 350);
  }

  function selectMood(mood) {
    const diary = currentDiary();
    if (!diary) return;
    const idx = getFocusedPageIndex();
    const page = diary.pages[idx];
    if (!page) return;
    page.mood = mood;
    persist();
    renderSpread(pairIndex, null);
    closeMoodSheet();
  }

  // ============ FULLSCREEN, EDITABLE, SINGLE-PAGE VIEW ============

  function openFullscreen(forcedIdx) {
    const diary = currentDiary();
    if (!diary) return;
    let idx = (typeof forcedIdx === 'number') ? forcedIdx : getFocusedPageIndex();
    if (!diary.pages[idx]) idx = pairIndex * 2;
    if (!diary.pages[idx]) { showToast('Add a page first.'); return; }

    editingIndex = idx;
    const page = diary.pages[idx];
    applyFont(diary.font);
    el.fsHeadline.textContent = page.headline || '';
    el.fsDate.textContent = formatDateLong(new Date(page.date));
    applyMatchedWrapFont(el.fsBody);
    el.fsBody.textContent = page.text || '';
    el.fsSheet.dataset.theme = page.theme || diary.theme || 'parchment';
    renderStickersForSheet(el.fsStickerLayer, page, idx, { fullscreen: true });
    renderVoiceClipsForSheet(el.fsStickerLayer, page, idx, { fullscreen: true });
    renderPhotosForSheet(el.fsStickerLayer, page, idx);
    renderFsBookmark(page);
    renderFsTags(page);

    el.fullscreenReader.hidden = false;
    el.bottomNav.classList.add('nav-hidden');
    playSwooshSound();
    requestAnimationFrame(() => el.fullscreenReader.classList.add('show'));
    setTimeout(() => el.fsBody.focus(), 350);
  }

  function saveFsEdits() {
    if (editingIndex === null) return;
    const diary = currentDiary();
    if (!diary) return;
    const page = diary.pages[editingIndex];
    if (!page) return;
    page.headline = el.fsHeadline.textContent.trim();
    page.text = el.fsBody.textContent;
    persist();
  }

  function closeFullscreen() {
    saveFsEdits();
    stopSpeaking();
    el.fullscreenReader.classList.remove('show');
    el.fullscreenReader.classList.remove('fs-fullscreen');
    el.bottomNav.classList.remove('nav-hidden');
    setTimeout(() => { el.fullscreenReader.hidden = true; }, 320);
    editingIndex = null;
    renderSpread(pairIndex, null);
  }

  function toggleFullscreenExpand() {
    const isFull = el.fullscreenReader.classList.toggle('fs-fullscreen');
    el.fsExpandBtn.classList.toggle('active', isFull);
    // the sheet's width just changed, so the wrap-matched font must be
    // recomputed or word-wrap would drift out of sync with Mini View again
    requestAnimationFrame(() => applyMatchedWrapFont(el.fsBody));
  }

  // ============ BOOKMARK (favorite pages) ============

  function renderFsBookmark(page) {
    el.fsBookmarkBtn.classList.toggle('active', !!page.bookmarked);
  }

  function toggleBookmark() {
    if (editingIndex === null) return;
    const diary = currentDiary();
    if (!diary) return;
    const page = diary.pages[editingIndex];
    if (!page) return;
    page.bookmarked = !page.bookmarked;
    persist();
    renderFsBookmark(page);
    showToast(page.bookmarked ? 'Bookmarked' : 'Bookmark removed');
  }

  // ============ TAGS ============

  function themeSheetTargetPageForTags() {
    return (editingIndex !== null) ? editingIndex : getFocusedPageIndex();
  }

  function renderFsTags(page) {
    if (!el.fsTagsRow) return;
    const tags = Array.isArray(page.tags) ? page.tags : [];
    if (!tags.length) { el.fsTagsRow.innerHTML = ''; return; }
    el.fsTagsRow.innerHTML = tags.map(t => `
      <span class="page-tag-pill" data-tag="${escapeHtml(t)}">${escapeHtml(t)}<button data-remove-tag="${escapeHtml(t)}">×</button></span>
    `).join('');
    el.fsTagsRow.querySelectorAll('[data-remove-tag]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeTagFromCurrentPage(btn.dataset.removeTag);
      });
    });
  }

  function openTagSheet() {
    const idx = themeSheetTargetPageForTags();
    const diary = currentDiary();
    const page = diary && diary.pages[idx];
    if (!page) { showToast('Add a page first.'); return; }
    const tags = Array.isArray(page.tags) ? page.tags : [];
    el.tagOptions.querySelectorAll('.tag-chip').forEach(btn => {
      btn.classList.toggle('active', tags.includes(btn.dataset.tag));
    });
    el.customTagInput.value = '';
    el.tagSheetBackdrop.hidden = false;
    el.tagSheet.hidden = false;
    requestAnimationFrame(() => {
      el.tagSheetBackdrop.classList.add('show');
      el.tagSheet.classList.add('show');
    });
  }

  function closeTagSheet() {
    el.tagSheetBackdrop.classList.remove('show');
    el.tagSheet.classList.remove('show');
    setTimeout(() => { el.tagSheetBackdrop.hidden = true; el.tagSheet.hidden = true; }, 350);
  }

  function toggleTagOnCurrentPage(tag) {
    const idx = themeSheetTargetPageForTags();
    const diary = currentDiary();
    const page = diary && diary.pages[idx];
    if (!page) return;
    if (!Array.isArray(page.tags)) page.tags = [];
    const pos = page.tags.indexOf(tag);
    if (pos === -1) page.tags.push(tag);
    else page.tags.splice(pos, 1);
    persist();
    el.tagOptions.querySelectorAll('.tag-chip').forEach(btn => {
      if (btn.dataset.tag === tag) btn.classList.toggle('active', pos === -1);
    });
    if (!el.fullscreenReader.hidden) renderFsTags(page);
  }

  function addCustomTag() {
    const val = el.customTagInput.value.trim();
    if (!val) return;
    const idx = themeSheetTargetPageForTags();
    const diary = currentDiary();
    const page = diary && diary.pages[idx];
    if (!page) return;
    if (!Array.isArray(page.tags)) page.tags = [];
    if (!page.tags.includes(val)) page.tags.push(val);
    persist();
    el.customTagInput.value = '';
    if (!el.fullscreenReader.hidden) renderFsTags(page);
    showToast('Tag added');
  }

  function removeTagFromCurrentPage(tag) {
    if (editingIndex === null) return;
    const diary = currentDiary();
    const page = diary && diary.pages[editingIndex];
    if (!page || !Array.isArray(page.tags)) return;
    page.tags = page.tags.filter(t => t !== tag);
    persist();
    renderFsTags(page);
  }

  // ============ TEXT-TO-SPEECH (read the page aloud) ============

  let ttsUtterance = null;

  function toggleSpeaking() {
    if (!('speechSynthesis' in window)) { showToast('Read-aloud is not supported in this browser.'); return; }
    if (window.speechSynthesis.speaking) { stopSpeaking(); return; }
    if (editingIndex === null) return;
    const diary = currentDiary();
    const page = diary && diary.pages[editingIndex];
    if (!page || !(page.text || page.headline)) { showToast('Nothing to read on this page.'); return; }

    const content = [page.headline, page.text].filter(Boolean).join('. ');
    ttsUtterance = new SpeechSynthesisUtterance(content);
    ttsUtterance.lang = settings.speechLang || 'en-IN';
    ttsUtterance.rate = 0.95;
    ttsUtterance.onend = () => el.fsTtsBtn.classList.remove('speaking');
    ttsUtterance.onerror = () => el.fsTtsBtn.classList.remove('speaking');
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ttsUtterance);
    el.fsTtsBtn.classList.add('speaking');
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (el.fsTtsBtn) el.fsTtsBtn.classList.remove('speaking');
  }

  // ============ PHOTO ATTACH (drag/resize, reuses the sticker overlay system) ============

  function openPhotoPicker() {
    const idx = (editingIndex !== null) ? editingIndex : getFocusedPageIndex();
    const diary = currentDiary();
    if (!diary || !diary.pages[idx]) { showToast('Add a page first.'); return; }
    el.photoFileInput.value = '';
    el.photoFileInput.click();
  }

  function handlePhotoFileSelected(file) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { showToast('Image is too large — try one under 4MB'); return; }
    const idx = (editingIndex !== null) ? editingIndex : getFocusedPageIndex();
    const diary = currentDiary();
    const page = diary && diary.pages[idx];
    if (!page) { showToast('Add a page first.'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      if (!Array.isArray(page.photos)) page.photos = [];
      page.photos.push({
        id: uid(), dataUrl: reader.result,
        x: 15 + Math.random() * 15, y: 10 + Math.random() * 10, sizePct: 45,
      });
      persist();
      if (!el.fullscreenReader.hidden && editingIndex === idx) {
        renderPhotosForSheet(el.fsStickerLayer, page, idx);
      } else {
        renderSpread(pairIndex, null);
      }
      showToast('Photo added — drag to place it');
    };
    reader.readAsDataURL(file);
  }

  function renderPhotosForSheet(layerEl, page, pageIdx) {
    const container = layerEl;
    if (!container) return;
    container.querySelectorAll('.placed-photo').forEach(n => n.remove());
    if (!page || !Array.isArray(page.photos) || !page.photos.length) {
      syncContainerPointerEvents(container);
      return;
    }
    page.photos.forEach(ph => {
      const node = document.createElement('div');
      node.className = 'placed-sticker placed-photo';
      node.style.left = ph.x + '%';
      node.style.top = ph.y + '%';
      node.style.width = ph.sizePct + '%';
      node.style.aspectRatio = '1 / 1';
      node.dataset.photoId = ph.id;

      const img = document.createElement('img');
      img.src = ph.dataUrl;
      img.alt = 'Attached photo';
      img.draggable = false;
      node.appendChild(img);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'sticker-remove-btn';
      removeBtn.textContent = '×';
      removeBtn.style.display = 'none';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        page.photos = page.photos.filter(p => p.id !== ph.id);
        persist();
        node.remove();
        syncContainerPointerEvents(container);
      });
      node.appendChild(removeBtn);

      const handle = document.createElement('div');
      handle.className = 'sticker-resize-handle';
      handle.style.display = 'none';
      node.appendChild(handle);

      wireStickerDragResize(node, page, ph, container, removeBtn, handle);
      container.appendChild(node);
    });
    syncContainerPointerEvents(container);
  }

  // a soft two-tone "swoosh" played with the Web Audio API — no audio file needed
  function playSwooshSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.22);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.34);
      osc.onended = () => ctx.close().catch(() => {});
    } catch (err) { /* audio is a nice-to-have, never block on it */ }
  }

  // ============ PRINT / PDF ============

  function printCurrentPage() {
    const diary = currentDiary();
    if (!diary) return;
    const idx = getFocusedPageIndex();
    const page = diary.pages[idx];
    if (!page) { showToast('Add a page first.'); return; }

    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>${escapeHtml(page.headline || diary.name)}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 600px; margin: 60px auto; color: #2b2416; }
        h1 { font-size: 26px; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #8a7a58; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 30px; }
        .body { font-size: 17px; line-height: 1.8; white-space: pre-wrap; }
        .sig { margin-top: 60px; font-style: italic; color: #8a7a58; font-size: 14px; }
      </style></head><body>
        <h1>${escapeHtml(page.headline)}</h1>
        <div class="meta">${formatDateLong(new Date(page.date))} — ${escapeHtml(diary.name)}</div>
        <div class="body">${escapeHtml(page.text)}</div>
        <div class="sig">${escapeHtml(diary.signature || 'made by Yash')}</div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  // ============ VOICE INPUT (native browser speech recognition) ============

  function toggleRecording(target) {
    if (!SpeechRecognitionImpl) { showToast('Voice input is not supported in this browser.'); return; }

    if (recognitionActive) {
      recognizer.stop();
      return;
    }

    if (target === 'page') {
      const idx = getFocusedPageIndex();
      const diary = currentDiary();
      if (!diary || !diary.pages[idx]) { showToast('Add a page first.'); return; }
    }

    recognitionTarget = target;
    recognizer = new SpeechRecognitionImpl();
    recognizer.lang = settings.speechLang || (window.CONFIG && CONFIG.SPEECH_LANG) || 'en-IN';
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;
    recognizer.continuous = false;

    recognizer.onstart = () => { recognitionActive = true; setRecordingUI(target, true); };
    recognizer.onerror = (e) => {
      console.error(e);
      showToast(e.error === 'not-allowed' ? "Couldn't access the mic." : "Didn't catch that.");
    };
    recognizer.onend = () => { recognitionActive = false; setRecordingUI(target, false); };
    recognizer.onresult = (e) => {
      const text = e.results[0][0].transcript;
      insertTranscript(target, text);
    };

    try { recognizer.start(); }
    catch (err) { console.error(err); showToast("Couldn't start listening."); }
  }

  function setRecordingUI(target, active) {
    if (target === 'create') {
      el.createMicBtn.classList.toggle('recording', active);
      el.createMicStatus.hidden = !active;
    } else {
      el.pageMicFab.classList.toggle('recording', active);
    }
  }

  function insertTranscript(target, text) {
    if (!text || !text.trim()) { showToast("Didn't catch that."); return; }

    if (target === 'create') {
      el.firstEntryInput.value = (el.firstEntryInput.value + ' ' + text).trim();
    } else if (target === 'fs') {
      el.fsBody.textContent = (el.fsBody.textContent + ' ' + text).trim();
      saveFsEdits();
    } else {
      const idx = getFocusedPageIndex();
      const sheetEl = (activeEditable && activeEditable.sheetEl) || el.pageSheetLeft;
      const linesEl = sheetEl.querySelector('[data-field="lines"]');
      if (!linesEl || linesEl.contentEditable !== 'true') { showToast('Add a page first.'); return; }
      linesEl.textContent = (linesEl.textContent + ' ' + text).trim();
      saveSheetEdits(sheetEl);
    }
    showToast('Added');
  }

  // ============ SEARCH ============

  function runSearch(query) {
    const q = query.trim().toLowerCase();
    if (bookmarksFilterActive && q) {
      bookmarksFilterActive = false;
      el.bookmarksFilterChip.classList.remove('active');
      el.bookmarksList.hidden = true;
    }
    if (!q) {
      el.searchResults.hidden = true;
      el.diaryList.hidden = false;
      return;
    }
    el.diaryList.hidden = true;
    el.searchResults.hidden = false;

    const hits = [];
    diaries.forEach(d => {
      d.pages.forEach((p, idx) => {
        const inHeadline = (p.headline || '').toLowerCase().includes(q);
        const inText = (p.text || '').toLowerCase().includes(q);
        if (inHeadline || inText) hits.push({ diary: d, page: p, idx });
      });
    });

    if (!hits.length) {
      el.searchResults.innerHTML = '<p class="empty-note">No pages match that search.</p>';
      return;
    }

    el.searchResults.innerHTML = hits.map(h => `
      <div class="search-hit" data-diary-id="${h.diary.id}" data-page-idx="${h.idx}">
        <div class="search-hit-title">${escapeHtml(h.page.headline || '(no headline)')}${h.page.mood ? ' ' + h.page.mood : ''}</div>
        <div class="search-hit-diary">${escapeHtml(h.diary.name)} · ${formatDateShort(new Date(h.page.date))}</div>
        <div class="search-hit-snippet">${escapeHtml(snippetAround(h.page.text || '', q))}</div>
      </div>
    `).join('');

    el.searchResults.querySelectorAll('.search-hit').forEach(hitEl => {
      hitEl.addEventListener('click', () => {
        const diaryId = hitEl.dataset.diaryId;
        const pageIdx = Number(hitEl.dataset.pageIdx);
        openDiaryRespectingLock(diaryId, () => {
          activeDiaryId = diaryId;
          openBookScreen();
          renderSpread(Math.floor(pageIdx / 2), null);
        });
      });
    });
  }

  function snippetAround(text, q) {
    const lower = text.toLowerCase();
    const i = lower.indexOf(q);
    if (i === -1) return text.slice(0, 80);
    const start = Math.max(0, i - 30);
    const end = Math.min(text.length, i + q.length + 30);
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }

  // ============ EXPORT ============

  function exportDiaryAsText(diary) {
    let out = `${diary.name}\n${'='.repeat(diary.name.length)}\n\n`;
    diary.pages.forEach((p, i) => {
      out += `Page ${i + 1} — ${formatDateLong(new Date(p.date))}${p.mood ? '  ' + p.mood : ''}\n`;
      out += `${p.headline || ''}\n\n${p.text || ''}\n\n---\n\n`;
    });
    downloadTextFile(`${diary.name.replace(/[^a-z0-9]+/gi, '-')}.txt`, out);
    showToast('Exported');
  }

  function exportAllDiaries() {
    if (!diaries.length) { showToast('No diaries yet.'); return; }
    let out = '';
    diaries.forEach(d => {
      out += `${d.name}\n${'='.repeat(d.name.length)}\n\n`;
      d.pages.forEach((p, i) => {
        out += `Page ${i + 1} — ${formatDateLong(new Date(p.date))}${p.mood ? '  ' + p.mood : ''}\n`;
        out += `${p.headline || ''}\n\n${p.text || ''}\n\n---\n\n`;
      });
      out += '\n\n';
    });
    downloadTextFile('voice-diary-export.txt', out);
    showToast('All diaries exported');
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ============ HISTORY SCREEN ============

  function openHistoryScreen() {
    renderDiaryList();
    el.searchInput.value = '';
    el.searchResults.hidden = true;
    el.diaryList.hidden = false;
    if (el.bookmarksList) el.bookmarksList.hidden = true;
    if (el.bookmarksFilterChip) el.bookmarksFilterChip.classList.remove('active');
    showScreen('history');
  }

  let bookmarksFilterActive = false;

  function toggleBookmarksFilter() {
    bookmarksFilterActive = !bookmarksFilterActive;
    el.bookmarksFilterChip.classList.toggle('active', bookmarksFilterActive);
    if (bookmarksFilterActive) {
      el.searchInput.value = '';
      el.searchResults.hidden = true;
      el.diaryList.hidden = true;
      renderBookmarksList();
      el.bookmarksList.hidden = false;
    } else {
      el.bookmarksList.hidden = true;
      el.diaryList.hidden = false;
    }
  }

  function renderBookmarksList() {
    const hits = [];
    diaries.forEach(d => {
      d.pages.forEach((p, idx) => {
        if (p.bookmarked) hits.push({ diary: d, page: p, idx });
      });
    });
    if (!hits.length) {
      el.bookmarksList.innerHTML = '<p class="empty-note">No bookmarked pages yet. Tap the bookmark icon while writing a page to save it here.</p>';
      return;
    }
    el.bookmarksList.innerHTML = hits.map(h => `
      <div class="search-hit" data-diary-id="${h.diary.id}" data-page-idx="${h.idx}">
        <div class="search-hit-title">🔖 ${escapeHtml(h.page.headline || '(no headline)')}${h.page.mood ? ' ' + h.page.mood : ''}</div>
        <div class="search-hit-diary">${escapeHtml(h.diary.name)} · ${formatDateShort(new Date(h.page.date))}</div>
        <div class="search-hit-snippet">${escapeHtml((h.page.text || '').slice(0, 90))}</div>
      </div>
    `).join('');
    el.bookmarksList.querySelectorAll('.search-hit').forEach(hitEl => {
      hitEl.addEventListener('click', () => {
        const diaryId = hitEl.dataset.diaryId;
        const pageIdx = Number(hitEl.dataset.pageIdx);
        openDiaryRespectingLock(diaryId, () => {
          activeDiaryId = diaryId;
          openBookScreen();
          renderSpread(Math.floor(pageIdx / 2), null);
        });
      });
    });
  }

  function renderDiaryList() {
    if (!diaries.length) {
      el.diaryList.innerHTML = '<p class="empty-note">No diaries yet. Create one from the Home screen.</p>';
      return;
    }
    el.diaryList.innerHTML = diaries.map(d => `
      <div class="diary-card" data-id="${d.id}">
        <div class="diary-card-mark">◐</div>
        <div class="diary-card-body">
          <div class="diary-card-title">${escapeHtml(d.name)}${d.lock ? ' 🔒' : ''}</div>
          <div class="diary-card-meta">${d.pages.length} pages · created ${formatDateShort(new Date(d.createdAt))}</div>
        </div>
      </div>
    `).join('');

    // wire click + long-press per card
    el.diaryList.querySelectorAll('.diary-card').forEach(card => {
      const id = card.dataset.id;
      let pressTimer = null;

      card.addEventListener('click', () => {
        if (pendingDeleteId) return; // ignore click if a delete confirm is pending
        openDiaryRespectingLock(id);
      });

      const startPress = () => {
        pressTimer = setTimeout(() => askDelete(id, card), 600);
      };
      const cancelPress = () => clearTimeout(pressTimer);

      card.addEventListener('mousedown', startPress);
      card.addEventListener('touchstart', startPress, { passive: true });
      card.addEventListener('mouseup', cancelPress);
      card.addEventListener('mouseleave', cancelPress);
      card.addEventListener('touchend', cancelPress);
      card.addEventListener('touchmove', cancelPress);
    });
  }

  function askDelete(id, cardEl) {
    pendingDeleteId = id;
    cardEl.classList.add('deleting');
    el.deleteConfirm.hidden = false;
    requestAnimationFrame(() => el.deleteConfirm.classList.add('show'));
  }

  function cancelDelete() {
    hideDeleteConfirm();
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;
    const idx = diaries.findIndex(d => d.id === pendingDeleteId);
    if (idx === -1) return;
    const [removed] = diaries.splice(idx, 1);
    persist();
    hideDeleteConfirm();
    renderDiaryList();
    offerUndo('Diary deleted', () => {
      diaries.splice(idx, 0, removed);
      persist();
      renderDiaryList();
      renderDiaryGrid();
    });
  }

  function deleteFromCover(diaryId) {
    const idx = diaries.findIndex(d => d.id === diaryId);
    if (idx === -1) return;
    const [removed] = diaries.splice(idx, 1);
    persist();
    initHome();
    offerUndo('Diary deleted', () => {
      diaries.splice(idx, 0, removed);
      persist();
      renderDiaryGrid();
      renderWeekStrip();
    });
  }

  function offerUndo(message, undoFn) {
    clearTimeout(undoTimer);
    undoPayload = undoFn;
    el.undoToastText.textContent = message;
    el.undoToast.hidden = false;
    requestAnimationFrame(() => el.undoToast.classList.add('show'));
    undoTimer = setTimeout(() => hideUndoToast(), 5000);
  }

  function hideUndoToast() {
    el.undoToast.classList.remove('show');
    setTimeout(() => { el.undoToast.hidden = true; undoPayload = null; }, 300);
  }

  function performUndo() {
    if (undoPayload) undoPayload();
    clearTimeout(undoTimer);
    hideUndoToast();
    showToast('Restored');
  }

  function hideDeleteConfirm() {
    el.deleteConfirm.classList.remove('show');
    setTimeout(() => { el.deleteConfirm.hidden = true; }, 300);
    document.querySelectorAll('.diary-card.deleting').forEach(c => c.classList.remove('deleting'));
    pendingDeleteId = null;
  }

  // ============ DARK MODE ============

  function applyDarkMode() {
    document.documentElement.classList.toggle('dark', !!settings.darkMode);
    if (el.darkModeToggle) el.darkModeToggle.checked = !!settings.darkMode;
  }

  function toggleDarkMode() {
    settings.darkMode = el.darkModeToggle.checked;
    persistSettings();
    applyDarkMode();
  }

  // ============ EDIT PROFILE SHEET ============

  function openEditProfileSheet() {
    el.editProfileNameInput.value = getUserName() === 'You' ? '' : getUserName();
    el.editProfileBioInput.value = settings.userBio || '';
    applyProfileEverywhere();
    el.editProfileSheetBackdrop.hidden = false;
    el.editProfileSheet.hidden = false;
    requestAnimationFrame(() => {
      el.editProfileSheetBackdrop.classList.add('show');
      el.editProfileSheet.classList.add('show');
    });
    setTimeout(() => el.editProfileNameInput.focus(), 300);
  }

  function closeEditProfileSheet() {
    el.editProfileSheetBackdrop.classList.remove('show');
    el.editProfileSheet.classList.remove('show');
    setTimeout(() => {
      el.editProfileSheetBackdrop.hidden = true;
      el.editProfileSheet.hidden = true;
    }, 300);
  }

  function handleAvatarFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please choose an image file'); return; }
    if (file.size > 4 * 1024 * 1024) { showToast('Image is too large — try one under 4MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      settings.userAvatar = reader.result;
      persistSettings();
      applyProfileEverywhere();
      showToast('Photo updated');
    };
    reader.onerror = () => showToast('Could not read that image');
    reader.readAsDataURL(file);
  }

  function saveProfileEdits() {
    const newName = el.editProfileNameInput.value.trim();
    settings.userName = newName || 'You';
    settings.userBio = el.editProfileBioInput.value.trim();
    persistSettings();
    applyProfileEverywhere();
    closeEditProfileSheet();
    showToast('Profile updated');
  }

  function removeProfilePhoto() {
    settings.userAvatar = '';
    persistSettings();
    applyProfileEverywhere();
    showToast('Photo removed');
  }

  function shareProfileStats() {
    let totalPages = 0, totalWords = 0;
    diaries.forEach(d => d.pages.forEach(p => {
      totalPages++;
      totalWords += (p.text || '').trim().split(/\s+/).filter(Boolean).length;
    }));
    const streak = computeLongestStreak(getAllDatesWithEntries());
    const text = `${getUserName()}'s Voice Diary — ${totalPages} pages, ${totalWords.toLocaleString('en-IN')} words, ${streak} day best streak. 📖✨`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showToast('Stats copied to clipboard'));
    } else {
      showToast(text);
    }
  }

  function clearAllAppData() {
    const ok = window.confirm('This will permanently delete all diaries, entries, and settings from this device. This cannot be undone. Continue?');
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    showToast('All app data cleared');
    setTimeout(() => window.location.reload(), 600);
  }

  function shareApp() {
    const text = 'Voice Diary — speak, and it\'s written. Keep a diary by writing or just talking.';
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'Voice Diary', text, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text} ${url}`).then(() => showToast('Link copied to clipboard'));
    } else {
      showToast('Share this app with a friend!');
    }
  }

  // ============ SETTINGS SCREEN ============

  // ============ PROFILE SCREEN ============

  function openProfileScreen() {
    applyProfileEverywhere();

    let totalPages = 0, totalWords = 0;
    diaries.forEach(d => d.pages.forEach(p => {
      totalPages++;
      totalWords += (p.text || '').trim().split(/\s+/).filter(Boolean).length;
    }));
    const dateSet = getAllDatesWithEntries();
    el.profileStatPages.textContent = totalPages;
    el.profileStatWords.textContent = totalWords;
    el.profileStatStreak.textContent = computeLongestStreak(dateSet);
    el.profileStatDiaries.textContent = diaries.length;

    if (diaries.length) {
      const earliest = diaries.reduce((min, d) => new Date(d.createdAt) < new Date(min.createdAt) ? d : min, diaries[0]);
      el.profileSince.textContent = `Writing since ${formatDateShort(new Date(earliest.createdAt))}`;
    } else {
      el.profileSince.textContent = 'Writing since —';
    }

    // reuse the same badge logic as home
    const badges = [];
    if (totalPages >= 1) badges.push({ icon: '📝', label: 'First page' });
    if (totalPages >= 10) badges.push({ icon: '📚', label: '10 pages' });
    if (totalPages >= 50) badges.push({ icon: '🏆', label: '50 pages' });
    const longest = computeLongestStreak(dateSet);
    if (longest >= 7) badges.push({ icon: '🔥', label: '7 day streak' });
    if (longest >= 30) badges.push({ icon: '💎', label: '30 day streak' });
    if (diaries.length >= 3) badges.push({ icon: '🗂️', label: '3 diaries' });
    el.profileBadgesStrip.innerHTML = badges.length
      ? badges.map(b => `<span class="badge-pill"><span class="badge-icon">${b.icon}</span>${b.label}</span>`).join('')
      : '<span class="notif-empty" style="padding:6px 0">No badges yet — keep writing!</span>';

    showScreen('profile');
  }

  function openNotifSheet() {
    // lightweight, on-device "notifications" derived from real diary activity
    const items = [];
    const dateSet = getAllDatesWithEntries();
    const streak = computeCurrentStreak(dateSet);
    if (streak >= 1) items.push(`🔥 You're on a ${streak} day streak — keep it going!`);
    diaries.forEach(d => {
      const last = d.pages[d.pages.length - 1];
      if (last) items.push(`📖 Last entry in "${escapeHtml(d.name)}": ${escapeHtml((last.headline || 'untitled').slice(0, 40))}`);
    });
    if (!items.length) items.push('No notifications yet.');

    el.notifList.innerHTML = items.slice(0, 8).map(t => `<div class="notif-item">${t}</div>`).join('');

    el.notifSheetBackdrop.hidden = false;
    el.notifSheet.hidden = false;
    requestAnimationFrame(() => {
      el.notifSheetBackdrop.classList.add('show');
      el.notifSheet.classList.add('show');
    });
  }
  function closeNotifSheet() {
    el.notifSheetBackdrop.classList.remove('show');
    el.notifSheet.classList.remove('show');
    setTimeout(() => { el.notifSheetBackdrop.hidden = true; el.notifSheet.hidden = true; }, 350);
  }

  // ============ INSIGHTS SCREEN ============

  function openInsightsScreen() {
    el.insightsDateLabel.textContent = formatDateLong(new Date());

    const now = new Date();
    const month = now.getMonth(), hour = now.getHours();
    let icon = '☀️';
    if (hour < 6 || hour >= 20) icon = '🌙';
    else if (month >= 5 && month <= 8) icon = '🌧️';
    else if (month === 11 || month === 0 || month === 1) icon = '❄️';
    el.insightsSeasonIcon.textContent = icon;
    el.insightsWeatherText.textContent = formatDateShort(now);

    const dateSet = getAllDatesWithEntries();
    const streak = computeCurrentStreak(dateSet);
    el.insightsStreakText.textContent = `${streak} day${streak === 1 ? '' : 's'} streak`;

    // weekly chart (reuse same counts logic as home)
    const counts = new Array(7).fill(0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    diaries.forEach(d => d.pages.forEach(p => {
      const pd = new Date(p.date);
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        if (pd.toDateString() === day.toDateString()) counts[i]++;
      }
    }));
    const max = Math.max(...counts, 1);
    el.insightsChart.innerHTML = counts.map((c, i) => {
      const isToday = i === now.getDay();
      const h = c === 0 ? 4 : Math.round((c / max) * 52) + 6;
      return `<div class="chart-bar-wrap"><div class="chart-bar${c > 0 ? ' active' : ''}" style="height:${h}px"></div><span class="chart-bar-label">${'SMTWTFS'[i]}${isToday ? '•' : ''}</span></div>`;
    }).join('');

    // mood summary for last 7 days, one item per day (most recent mood that day)
    const dayMood = new Map();
    diaries.forEach(d => d.pages.forEach(p => {
      const key = new Date(p.date).toDateString();
      if (p.mood) dayMood.set(key, p.mood);
    }));
    const moodLabels = { '😊': 'Happy', '🥳': 'Happy', '😐': 'Reflective', '😢': 'Sad', '😡': 'Angry', '😴': 'Tired', '😰': 'Anxious' };
    const moodDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const mood = dayMood.get(d.toDateString());
      moodDays.push({ mood, label: mood ? (moodLabels[mood] || 'Noted') : '—' });
    }
    el.insightsMoodStrip.innerHTML = moodDays.map(m =>
      `<div class="mood-strip-item"><span class="mood-emoji">${m.mood || '·'}</span>${m.label}</div>`
    ).join('');

    // total words / total time (estimated at ~130 wpm speaking pace) / primary moods
    let totalWords = 0;
    const moodCounts = {};
    diaries.forEach(d => d.pages.forEach(p => {
      totalWords += (p.text || '').trim().split(/\s+/).filter(Boolean).length;
      if (p.mood) moodCounts[p.mood] = (moodCounts[p.mood] || 0) + 1;
    }));
    el.insightsTotalWords.textContent = totalWords.toLocaleString('en-IN');
    const totalMinutes = Math.round(totalWords / 130 * 60);
    const hrs = Math.floor(totalMinutes / 60), mins = totalMinutes % 60;
    el.insightsTotalHours.textContent = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(e => e[0]);
    el.insightsPrimaryMoods.textContent = topMoods.length ? topMoods.join(' ') : '—';

    // recent reflections list — latest few pages across all diaries
    const allPages = [];
    diaries.forEach(d => d.pages.forEach((p, idx) => allPages.push({ ...p, diaryName: d.name, diaryId: d.id, idx })));
    allPages.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = allPages.slice(0, 6);
    el.reflectionsList.innerHTML = recent.length
      ? recent.map(p => `
        <div class="reflection-card" data-diary-id="${p.diaryId}" data-page-idx="${p.idx}">
          <div class="reflection-card-headline">${escapeHtml(p.headline || 'Untitled')} ${p.mood || ''}</div>
          <div class="reflection-card-snippet">${escapeHtml((p.text || '').slice(0, 90))}${(p.text || '').length > 90 ? '…' : ''}</div>
          <div class="reflection-card-meta"><span>${escapeHtml(p.diaryName)}</span><span>${formatDateShort(new Date(p.date))}</span></div>
        </div>
      `).join('')
      : '<p class="empty-note">No reflections yet — start writing to see insights here.</p>';

    el.reflectionsList.querySelectorAll('.reflection-card').forEach(card => {
      card.addEventListener('click', () => {
        const diaryId = card.dataset.diaryId;
        const pageIdx = Number(card.dataset.pageIdx);
        openDiaryRespectingLock(diaryId, () => {
          activeDiaryId = diaryId;
          openBookScreen();
          renderSpread(Math.floor(pageIdx / 2), null);
        });
      });
    });

    showScreen('insights');
  }

  function openSettingsScreen() {
    applyProfileEverywhere();
    el.darkModeToggle.checked = !!settings.darkMode;

    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === settings.speechLang);
    });

    el.reminderToggle.checked = !!settings.reminderOn;
    el.reminderTime.hidden = !settings.reminderOn;
    el.reminderTime.value = settings.reminderTime || '21:00';
    el.reminderRowSub.textContent = settings.reminderOn
      ? `Daily at ${formatTime12(settings.reminderTime || '21:00')}`
      : 'Get a daily nudge';

    document.querySelectorAll('.accent-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.accent === (settings.accent || 'amber'));
    });
    el.diaryFontOptions.querySelectorAll('.lang-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.font === (settings.diaryFont || 'serif'));
    });
    if (el.appLockToggle) el.appLockToggle.checked = !!settings.appLock;
    if (el.changePinBtn) el.changePinBtn.hidden = !settings.appLock;
    if (el.appLockRowSub) el.appLockRowSub.textContent = settings.appLock ? 'PIN required to open the app' : 'Require a PIN to open the app';
    if (el.hapticsToggle) el.hapticsToggle.checked = !!settings.hapticsOn;
    if (el.soundToggle) el.soundToggle.checked = !!settings.soundOn;

    renderDiaryLockManageList();

    showScreen('settings');
  }

  function selectAccent(accent) {
    settings.accent = accent;
    persistSettings();
    document.documentElement.setAttribute('data-accent', accent);
    document.querySelectorAll('.accent-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.accent === accent);
    });
  }

  function selectDiaryFont(font) {
    settings.diaryFont = font;
    persistSettings();
    el.diaryFontOptions.querySelectorAll('.lang-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.font === font);
    });
  }

  function selectLang(lang) {
    settings.speechLang = lang;
    persistSettings();
    document.querySelectorAll('.lang-option').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
    showToast('Voice language updated');
  }

  // ============ APP LOCK / PIN ============

  // when changing an existing PIN, the sheet is first shown in "verify" mode
  // asking for the CURRENT pin, and only once that matches do we flip it into
  // the normal "enter new pin" mode.
  let setPinMode = 'new'; // 'new' | 'verify'

  function openSetPinSheet(isChange) {
    if (isChange && settings.appLock && settings.pin && /^\d{4}$/.test(settings.pin)) {
      setPinMode = 'verify';
      el.setPinTitle.textContent = 'Enter current PIN';
      el.setPinSub.textContent = 'Confirm your current PIN to continue';
    } else {
      setPinMode = 'new';
      el.setPinTitle.textContent = isChange ? 'Set a new PIN' : 'Set a 4-digit PIN';
      el.setPinSub.textContent = isChange ? 'Enter a new 4-digit PIN' : "You'll need this to open the app";
    }
    el.setPinInput.value = '';
    el.setPinSheetBackdrop.hidden = false;
    el.setPinSheet.hidden = false;
    requestAnimationFrame(() => {
      el.setPinSheetBackdrop.classList.add('show');
      el.setPinSheet.classList.add('show');
      el.setPinInput.focus();
    });
  }

  function closeSetPinSheet() {
    el.setPinSheetBackdrop.classList.remove('show');
    el.setPinSheet.classList.remove('show');
    setPinMode = 'new';
    setTimeout(() => { el.setPinSheetBackdrop.hidden = true; el.setPinSheet.hidden = true; }, 350);
  }

  function saveNewPin() {
    const pin = el.setPinInput.value.trim();
    if (!/^\d{4}$/.test(pin)) { showToast('Enter exactly 4 digits'); return; }

    if (setPinMode === 'verify') {
      if (pin !== settings.pin) {
        showToast('Incorrect current PIN');
        el.setPinInput.value = '';
        return;
      }
      // verified — now ask for the new PIN
      setPinMode = 'new';
      el.setPinTitle.textContent = 'Set a new PIN';
      el.setPinSub.textContent = 'Enter a new 4-digit PIN';
      el.setPinInput.value = '';
      el.setPinInput.focus();
      return;
    }

    settings.pin = pin;
    settings.appLock = true;
    persistSettings();
    if (el.appLockToggle) el.appLockToggle.checked = true;
    if (el.changePinBtn) el.changePinBtn.hidden = false;
    if (el.appLockRowSub) el.appLockRowSub.textContent = 'PIN required to open the app';
    closeSetPinSheet();
    showToast('PIN saved');
  }

  // ---- lock screen shown at launch when app lock is on ----

  let enteredPin = '';

  function showLockScreen() {
    enteredPin = '';
    el.lockError.hidden = true;
    renderLockDots();
    el.lockScreen.hidden = false;
  }

  function renderLockDots() {
    const dots = el.lockDots.querySelectorAll('.lock-dot');
    dots.forEach((d, i) => d.classList.toggle('filled', i < enteredPin.length));
  }

  function handleLockKey(key) {
    if (key === 'back') {
      enteredPin = enteredPin.slice(0, -1);
      renderLockDots();
      return;
    }
    if (enteredPin.length >= 4) return;
    enteredPin += key;
    renderLockDots();
    if (enteredPin.length === 4) {
      setTimeout(() => {
        if (enteredPin === settings.pin) {
          el.lockScreen.hidden = true;
          initHome();
        } else {
          el.lockError.hidden = false;
          el.lockDots.querySelectorAll('.lock-dot').forEach(d => d.classList.add('shake-error'));
          if (settings.hapticsOn && navigator.vibrate) navigator.vibrate([40, 40, 40]);
          setTimeout(() => {
            enteredPin = '';
            renderLockDots();
            el.lockDots.querySelectorAll('.lock-dot').forEach(d => d.classList.remove('shake-error'));
          }, 450);
        }
      }, 150);
    }
  }

  // ============ PER-DIARY LOCK ============

  const SECURITY_QUESTIONS = {
    sport: 'What is your favourite sport?',
    dob: 'What is your date of birth?',
    pet: "What is your pet's name?",
    city: 'Which city were you born in?',
  };

  let diaryLockTargetId = null;   // diary awaiting unlock
  let diaryLockEntered = '';      // pin digits entered so far (pin mode)
  let pendingUnlockCallback = null; // what to do once the target diary is confirmed unlocked

  // every entry point into a diary (grid tap, search hit, bookmark, insights card,
  // quick actions, popstate, settings) must go through this — never call
  // openCoverScreen / openBookScreen directly with a diary id that might be locked.
  // There is NO session-wide "already unlocked" memory: a locked diary always asks
  // for its PIN/password again, every single time, from every entry point, with no
  // exceptions and no need to refresh the page.
  // `onUnlocked` runs only after the diary is confirmed open.
  function openDiaryRespectingLock(diaryId, onUnlocked) {
    const diary = getDiary(diaryId);
    if (!diary) return;
    const proceed = onUnlocked || (() => openCoverScreen(diaryId));
    if (!diary.lock) {
      proceed();
      return;
    }
    pendingUnlockCallback = proceed;
    showDiaryLockScreen(diaryId);
  }

  function showDiaryLockScreen(diaryId) {
    const diary = getDiary(diaryId);
    if (!diary) return;
    diaryLockTargetId = diaryId;
    diaryLockEntered = '';
    el.diaryLockError.hidden = true;
    el.diaryLockSub.textContent = `"${diary.name}" is locked`;

    const isPattern = diary.lock.type === 'pattern';
    el.diaryLockTitle.textContent = isPattern ? 'Enter password' : 'Enter PIN';
    el.diaryLockKeypad.hidden = isPattern;
    el.diaryLockDots.hidden = isPattern;
    el.diaryLockPatternInput.hidden = !isPattern;
    if (isPattern) {
      el.diaryLockPatternInput.value = '';
      setTimeout(() => el.diaryLockPatternInput.focus(), 200);
    } else {
      renderDiaryLockDots();
    }
    el.diaryLockScreen.hidden = false;
  }

  function hideDiaryLockScreen() {
    el.diaryLockScreen.hidden = true;
    diaryLockTargetId = null;
    diaryLockEntered = '';
    pendingUnlockCallback = null;
  }

  function renderDiaryLockDots() {
    const dots = el.diaryLockDots.querySelectorAll('.lock-dot');
    dots.forEach((d, i) => d.classList.toggle('filled', i < diaryLockEntered.length));
  }

  function tryUnlockDiary(inputSecret) {
    const diary = getDiary(diaryLockTargetId);
    if (!diary) return;
    // must match this diary's own secret — every diary's lock is independent
    if (inputSecret === diary.lock.secret) {
      const id = diaryLockTargetId;
      const proceed = pendingUnlockCallback || (() => openCoverScreen(id));
      pendingUnlockCallback = null;
      hideDiaryLockScreen();
      proceed();
    } else {
      el.diaryLockError.hidden = false;
      if (settings.hapticsOn && navigator.vibrate) navigator.vibrate([40, 40, 40]);
      if (el.diaryLockKeypad.hidden) {
        el.diaryLockPatternInput.classList.add('shake-error');
        setTimeout(() => el.diaryLockPatternInput.classList.remove('shake-error'), 400);
      } else {
        el.diaryLockDots.querySelectorAll('.lock-dot').forEach(d => d.classList.add('shake-error'));
        setTimeout(() => {
          diaryLockEntered = '';
          renderDiaryLockDots();
          el.diaryLockDots.querySelectorAll('.lock-dot').forEach(d => d.classList.remove('shake-error'));
        }, 450);
      }
    }
  }

  function handleDiaryLockKey(key) {
    if (key === 'back') {
      diaryLockEntered = diaryLockEntered.slice(0, -1);
      renderDiaryLockDots();
      return;
    }
    if (diaryLockEntered.length >= 4) return;
    diaryLockEntered += key;
    renderDiaryLockDots();
    if (diaryLockEntered.length === 4) {
      setTimeout(() => tryUnlockDiary(diaryLockEntered), 150);
    }
  }

  function openForgotLockSheet() {
    const diary = getDiary(diaryLockTargetId);
    if (!diary) return;
    el.forgotLockQuestionText.textContent = SECURITY_QUESTIONS[diary.lock.question] || 'Answer your security question';
    el.forgotLockAnswerInput.value = '';
    el.forgotLockError.hidden = true;
    el.forgotLockSheetBackdrop.hidden = false;
    el.forgotLockSheet.hidden = false;
    requestAnimationFrame(() => {
      el.forgotLockSheetBackdrop.classList.add('show');
      el.forgotLockSheet.classList.add('show');
      el.forgotLockAnswerInput.focus();
    });
  }

  function closeForgotLockSheet() {
    el.forgotLockSheetBackdrop.classList.remove('show');
    el.forgotLockSheet.classList.remove('show');
    setTimeout(() => { el.forgotLockSheetBackdrop.hidden = true; el.forgotLockSheet.hidden = true; }, 350);
  }

  function submitForgotLockAnswer() {
    const diary = getDiary(diaryLockTargetId);
    if (!diary) return;
    const answer = (el.forgotLockAnswerInput.value || '').trim();
    // must match this diary's own security answer — every diary's lock is independent
    if (answer.toLowerCase() === (diary.lock.answer || '').toLowerCase()) {
      const id = diaryLockTargetId;
      const proceed = pendingUnlockCallback || (() => openCoverScreen(id));
      pendingUnlockCallback = null;
      closeForgotLockSheet();
      hideDiaryLockScreen();
      showToast('Diary unlocked');
      proceed();
    } else {
      el.forgotLockError.hidden = false;
    }
  }

  // ---- manage locks from Settings ----

  function renderDiaryLockManageList() {
    if (!el.diaryLockManageList) return;
    if (!diaries.length) {
      el.diaryLockManageList.innerHTML = '<p class="empty-note">No diaries yet.</p>';
      return;
    }
    el.diaryLockManageList.innerHTML = diaries.map(d => `
      <div class="diary-lock-manage-row" data-id="${d.id}">
        <div>
          <div class="diary-lock-manage-name">${escapeHtml(d.name)}</div>
          <div class="diary-lock-manage-status">${d.lock ? `<svg class="inline-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> ${d.lock.type === 'pattern' ? 'Password lock' : 'PIN lock'}` : 'No lock'}</div>
        </div>
        <button class="diary-lock-manage-btn" data-id="${d.id}">${d.lock ? 'Change' : 'Add lock'}</button>
      </div>
    `).join('');
    el.diaryLockManageList.querySelectorAll('.diary-lock-manage-btn').forEach(btn => {
      btn.addEventListener('click', () => openDiaryLockManageSheet(btn.dataset.id));
    });
  }

  let manageLockTargetId = null;
  let manageLockType = 'pin';

  function selectManageLockType(type) {
    manageLockType = type;
    el.manageLockTypeOptions.querySelectorAll('.lock-type-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.locktype === type);
    });
    el.manageLockFields.hidden = type === 'none';
    el.manageLockSecretInput.placeholder = type === 'pattern' ? 'Enter a password' : '4-digit PIN';
    el.manageLockSecretInput.maxLength = type === 'pattern' ? 40 : 4;
    el.manageLockSecretInput.inputMode = type === 'pattern' ? 'text' : 'numeric';
  }

  function openDiaryLockManageSheet(diaryId) {
    const diary = getDiary(diaryId);
    if (!diary) return;
    manageLockTargetId = diaryId;
    el.diaryLockManageTitle.textContent = `Lock "${diary.name}"`;
    selectManageLockType(diary.lock ? diary.lock.type : 'pin');
    el.manageLockSecretInput.value = diary.lock ? diary.lock.secret : '';
    el.manageLockQuestionSelect.value = diary.lock ? diary.lock.question : 'sport';
    el.manageLockAnswerInput.value = diary.lock ? diary.lock.answer : '';
    el.diaryLockManageSheetBackdrop.hidden = false;
    el.diaryLockManageSheet.hidden = false;
    requestAnimationFrame(() => {
      el.diaryLockManageSheetBackdrop.classList.add('show');
      el.diaryLockManageSheet.classList.add('show');
    });
  }

  function closeDiaryLockManageSheet() {
    el.diaryLockManageSheetBackdrop.classList.remove('show');
    el.diaryLockManageSheet.classList.remove('show');
    setTimeout(() => { el.diaryLockManageSheetBackdrop.hidden = true; el.diaryLockManageSheet.hidden = true; }, 350);
  }

  function saveManageLock() {
    const diary = getDiary(manageLockTargetId);
    if (!diary) return;

    if (manageLockType === 'none') {
      diary.lock = null;
      persist();
      renderDiaryLockManageList();
      renderDiaryGrid();
      closeDiaryLockManageSheet();
      showToast('Lock removed');
      return;
    }

    const secret = (el.manageLockSecretInput.value || '').trim();
    const answer = (el.manageLockAnswerInput.value || '').trim();
    if (manageLockType === 'pin' && !/^\d{4}$/.test(secret)) { showToast('Enter exactly 4 digits for PIN'); return; }
    if (manageLockType === 'pattern' && secret.length < 4) { showToast('Enter a password (at least 4 characters)'); return; }
    if (!answer) { showToast('Enter an answer for your security question'); return; }

    diary.lock = { type: manageLockType, secret, question: el.manageLockQuestionSelect.value, answer: answer.toLowerCase() };
    persist();
    renderDiaryLockManageList();
    renderDiaryGrid();
    closeDiaryLockManageSheet();
    showToast('Lock saved');
  }

  // ============ FULL JSON BACKUP / RESTORE ============

  function downloadJsonBackup() {
    const payload = { app: 'voice-diary', version: 2, exportedAt: new Date().toISOString(), diaries, settings: { ...settings, pin: undefined } };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-diary-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Backup downloaded');
  }

  function restoreFromJsonFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const incoming = Array.isArray(payload) ? payload : payload.diaries;
        if (!Array.isArray(incoming)) throw new Error('bad format');
        diaries = incoming;
        persist();
        loadDiaries(); // re-run migrations on the restored data
        showToast('Backup restored');
        initHome();
      } catch (err) {
        showToast("Couldn't read that backup file.");
      }
    };
    reader.readAsText(file);
  }

  function formatTime12(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  }

  function toggleReminder() {
    if (el.reminderToggle.checked) {
      if (!('Notification' in window)) {
        showToast('Notifications are not supported in this browser.');
        el.reminderToggle.checked = false;
        return;
      }
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          settings.reminderOn = true;
          persistSettings();
          el.reminderTime.hidden = false;
          el.reminderRowSub.textContent = `Daily at ${formatTime12(settings.reminderTime)}`;
          scheduleReminder();
          showToast('Reminder turned on');
        } else {
          el.reminderToggle.checked = false;
          showToast('Notification permission was not granted.');
        }
      });
    } else {
      settings.reminderOn = false;
      persistSettings();
      el.reminderTime.hidden = true;
      el.reminderRowSub.textContent = 'Get a daily nudge';
      clearReminder();
    }
  }

  function updateReminderTime() {
    settings.reminderTime = el.reminderTime.value || '21:00';
    persistSettings();
    el.reminderRowSub.textContent = `Daily at ${formatTime12(settings.reminderTime)}`;
    if (settings.reminderOn) scheduleReminder();
  }

  let reminderTimeoutId = null;
  function scheduleReminder() {
    clearReminder();
    if (!settings.reminderOn) return;
    const [h, m] = (settings.reminderTime || '21:00').split(':').map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next.getTime() - now.getTime();
    reminderTimeoutId = setTimeout(() => {
      try {
        if (Notification.permission === 'granted') {
          new Notification('Voice Diary', { body: "Time to write today's page." });
        }
      } catch {}
      scheduleReminder(); // queue up tomorrow's reminder
    }, delay);
  }

  function clearReminder() {
    if (reminderTimeoutId) { clearTimeout(reminderTimeoutId); reminderTimeoutId = null; }
  }

  // ============ HELPERS ============

  function formatDateLong(d) {
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function formatDateShort(d) {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  let toastTimeout;
  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    requestAnimationFrame(() => el.toast.classList.add('show'));
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      el.toast.classList.remove('show');
      setTimeout(() => { el.toast.hidden = true; }, 300);
    }, 2600);
  }

  // ============ EVENT WIRING ============

  function wireEvents() {
    // Bottom nav (home / history / insights) is the core navigation of the app —
    // bind it first and defensively, so a later error in some other section can
    // never leave the user stuck unable to reach History.
    try {
      el.bnavHomeBtn.addEventListener('click', initHome);
      el.bnavHistoryBtn.addEventListener('click', openHistoryScreen);
      el.bnavInsightsBtn.addEventListener('click', openInsightsScreen);
      if (el.historyBtn) el.historyBtn.addEventListener('click', openHistoryScreen);
      el.quickSearchTopBtn.addEventListener('click', openHistoryScreen);
      el.historyBackBtn.addEventListener('click', initHome);
    } catch (err) {
      console.error('Core nav binding failed:', err);
    }

    try { wireSecondaryEvents(); }
    catch (err) { console.error('Secondary event binding failed:', err); }
  }

  function wireSecondaryEvents() {
    el.createNewBtn.addEventListener('click', openCreateScreen);
    el.settingsBtn.addEventListener('click', openSettingsScreen);

    // home top bar icons
    el.notifBtn.addEventListener('click', openNotifSheet);
    el.notifSheetBackdrop.addEventListener('click', closeNotifSheet);
    el.profileBtn.addEventListener('click', openProfileScreen);

    // profile screen
    el.profileBackBtn.addEventListener('click', initHome);
    el.profileEditBtn.addEventListener('click', openEditProfileSheet);
    el.profileEditNameBtn.addEventListener('click', openEditProfileSheet);
    el.profileGoSettingsBtn.addEventListener('click', openSettingsScreen);
    el.profileGoHistoryBtn.addEventListener('click', openHistoryScreen);
    el.profileShareStatsBtn.addEventListener('click', shareProfileStats);
    el.profileAvatar.addEventListener('click', () => el.avatarFileInput.click());

    // edit profile sheet
    el.editProfileSheetBackdrop.addEventListener('click', closeEditProfileSheet);
    el.editProfileAvatarPreview.addEventListener('click', () => el.avatarFileInput.click());
    el.editProfileChangePhotoBtn.addEventListener('click', () => el.avatarFileInput.click());
    el.editProfileRemovePhotoBtn.addEventListener('click', removeProfilePhoto);
    el.avatarFileInput.addEventListener('change', (e) => {
      handleAvatarFile(e.target.files && e.target.files[0]);
      e.target.value = '';
    });
    el.editProfileSaveBtn.addEventListener('click', saveProfileEdits);
    el.editProfileNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveProfileEdits(); });

    // settings profile card
    el.settingsProfileCard.addEventListener('click', openEditProfileSheet);

    // quick actions
    el.quickVoiceBtn.addEventListener('click', () => {
      const latest = diaries[0];
      if (!latest) { showToast('Create a diary first'); return; }
      openDiaryRespectingLock(latest.id, () => {
        activeDiaryId = latest.id;
        openBookScreen();
        const li = latest.pages.length - 1;
        renderSpread(Math.floor(li / 2), null);
        activeEditable = { sheetEl: (li % 2 === 0) ? el.pageSheetLeft : el.pageSheetRight };
        setTimeout(() => toggleRecording('page'), 350);
      });
    });
    el.quickMoodBtn.addEventListener('click', () => {
      const latest = diaries[0];
      if (!latest) { showToast('Create a diary first'); return; }
      openDiaryRespectingLock(latest.id, () => {
        activeDiaryId = latest.id;
        openMoodSheet();
      });
    });
    el.quickSearchBtn.addEventListener('click', openHistoryScreen);

    // subtle scroll parallax on home cards
    el.homeScreen.addEventListener('scroll', () => {
      const y = el.homeScreen.scrollTop;
      [el.memoryCard, el.quoteCard, el.chartCard].forEach((card, i) => {
        if (card && !card.hidden) card.style.transform = `translateY(${y * -0.03 * (i + 1)}px)`;
      });
    }, { passive: true });

    el.createBackBtn.addEventListener('click', initHome);
    el.confirmCreateBtn.addEventListener('click', confirmCreate);
    if (el.templateOptions) {
      el.templateOptions.querySelectorAll('.template-chip').forEach(btn => {
        btn.addEventListener('click', () => selectTemplate(btn.dataset.template));
      });
    }
    el.createMicBtn.addEventListener('click', () => toggleRecording('create'));

    el.coverBackBtn.addEventListener('click', initHome);
    el.openBookBtn.addEventListener('click', openBookScreen);
    el.coverMenuBtn.addEventListener('click', openCoverSheet);
    el.coverSheetBackdrop.addEventListener('click', closeCoverSheet);
    el.bookCoverSignature.addEventListener('click', openSignatureSheet);
    el.signatureSheetBackdrop.addEventListener('click', closeSignatureSheet);
    el.signatureSaveBtn.addEventListener('click', saveSignature);
    el.exportDiaryBtn.addEventListener('click', () => {
      const diary = currentDiary();
      if (diary) exportDiaryAsText(diary);
      closeCoverSheet();
    });
    el.allDiariesLinkBtn.addEventListener('click', () => { closeCoverSheet(); openHistoryScreen(); });
    el.deleteFromCoverBtn.addEventListener('click', () => {
      const id = activeDiaryId;
      closeCoverSheet();
      if (id) deleteFromCover(id);
    });

    el.coverThemeBtn.addEventListener('click', openCoverThemeSheet);
    el.coverThemeSheetBackdrop.addEventListener('click', closeCoverThemeSheet);
    el.coverThemeOptions.querySelectorAll('.cover-theme-swatch').forEach(btn => {
      btn.addEventListener('click', () => selectCoverTheme(btn.dataset.coverTheme));
    });
    el.coverStickerBtn.addEventListener('click', openCoverStickerSheet);
    el.coverStickerSheetBackdrop.addEventListener('click', closeCoverStickerSheet);
    el.coverStickerOptions.querySelectorAll('.sticker-option').forEach(btn => {
      btn.addEventListener('click', () => addStickerToCover(btn.dataset.sticker));
    });
    el.coverStickerClearBtn.addEventListener('click', clearCoverStickers);
    el.coverStickerLayer.addEventListener('click', (e) => {
      if (e.target.closest('.placed-sticker')) return;
      deselectAllStickers(el.coverStickerLayer);
    });

    el.bookBackBtn.addEventListener('click', () => openCoverScreen(activeDiaryId));
    el.zonePrev.addEventListener('click', () => goToPair('prev'));
    el.zoneNext.addEventListener('click', () => goToPair('next'));
    el.addPageBtn.addEventListener('click', addPageAndGo);
    el.pageMicFab.addEventListener('click', () => toggleRecording('page'));
    el.pageMoodFab.addEventListener('click', openMoodSheet);

    // track which page sheet is focused (used as the mic / expand target)
    el.pageStage.addEventListener('focusin', (e) => {
      const field = e.target.dataset && e.target.dataset.field;
      if (field === 'headline' || field === 'lines') {
        activeEditable = { sheetEl: e.target.closest('.page-sheet') };
      }
      if (field === 'lines') {
        // swap in the FULL saved text for editing — the visible content up to
        // now may have been a truncated "…" display copy, and editing that
        // directly would permanently lose everything past the truncation
        const sheetEl = e.target.closest('.page-sheet');
        const idxStr = sheetEl && sheetEl.dataset.pageIndex;
        const diary = currentDiary();
        const page = diary && idxStr !== '' && idxStr !== undefined ? diary.pages[Number(idxStr)] : null;
        if (page) e.target.textContent = page.text || '';
      }
    });
    el.pageSheetLeft.addEventListener('focusout', (e) => {
      clearTimeout(autosaveTimer);
      saveSheetEdits(el.pageSheetLeft);
      if (e.target.dataset && e.target.dataset.field === 'lines') {
        const page = currentDiary() && currentDiary().pages[Number(el.pageSheetLeft.dataset.pageIndex)];
        if (page) fillMiniLinesCapped(e.target, page.text || '');
      }
    });
    el.pageSheetRight.addEventListener('focusout', (e) => {
      clearTimeout(autosaveTimer);
      saveSheetEdits(el.pageSheetRight);
      if (e.target.dataset && e.target.dataset.field === 'lines') {
        const page = currentDiary() && currentDiary().pages[Number(el.pageSheetRight.dataset.pageIndex)];
        if (page) fillMiniLinesCapped(e.target, page.text || '');
      }
    });
    el.pageSheetLeft.addEventListener('input', (e) => {
      if (e.target.dataset.field === 'lines') enforceMiniLineLimit(e.target);
      scheduleAutosave(() => saveSheetEdits(el.pageSheetLeft));
    });
    el.pageSheetRight.addEventListener('input', (e) => {
      if (e.target.dataset.field === 'lines') enforceMiniLineLimit(e.target);
      scheduleAutosave(() => saveSheetEdits(el.pageSheetRight));
    });

    const leftMaximizeBtn = el.pageSheetLeft.querySelector('[data-action="maximize"]');
    const rightMaximizeBtn = el.pageSheetRight.querySelector('[data-action="maximize"]');
    if (leftMaximizeBtn) leftMaximizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      saveSheetEdits(el.pageSheetLeft);
      openFullscreen(pairIndex * 2);
    });
    if (rightMaximizeBtn) rightMaximizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      saveSheetEdits(el.pageSheetRight);
      openFullscreen(pairIndex * 2 + 1);
    });

    el.fontBtn.addEventListener('click', openFontSheet);
    el.fontSheetBackdrop.addEventListener('click', closeFontSheet);
    el.fontOptions.querySelectorAll('.font-option').forEach(btn => {
      btn.addEventListener('click', () => selectFont(btn.dataset.font));
    });

    el.moodSheetBackdrop.addEventListener('click', closeMoodSheet);
    el.moodOptions.querySelectorAll('.mood-option').forEach(btn => {
      btn.addEventListener('click', () => selectMood(btn.dataset.mood));
    });

    el.fullscreenBtn.addEventListener('click', openFullscreen);

    let wrapFontResizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(wrapFontResizeTimer);
      wrapFontResizeTimer = setTimeout(() => {
        syncPageFonts();
        if (!el.fullscreenReader.hidden) applyMatchedWrapFont(el.fsBody);
      }, 150);
    });
    if (el.rotateBtn && el.landscapeOverlay && el.landscapeOverlayStage) {
      const pageStageHome = el.pageStage.parentNode; // where pageStage normally lives, so we can put it back
      const pageStageNextSibling = el.pageStage.nextSibling;

      const openLandscape = () => {
        el.landscapeOverlayStage.appendChild(el.pageStage); // move (not clone) — keeps all listeners/IDs intact
        el.landscapeOverlay.classList.add('show');
        el.rotateBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
      };
      const closeLandscape = () => {
        if (pageStageNextSibling) pageStageHome.insertBefore(el.pageStage, pageStageNextSibling);
        else pageStageHome.appendChild(el.pageStage);
        el.landscapeOverlay.classList.remove('show');
        el.rotateBtn.classList.remove('active');
        document.body.style.overflow = '';
      };

      el.rotateBtn.addEventListener('click', () => {
        if (el.landscapeOverlay.classList.contains('show')) closeLandscape();
        else openLandscape();
      });
      el.landscapeCloseBtn.addEventListener('click', closeLandscape);
    }
    el.fsCloseBtn.addEventListener('click', closeFullscreen);
    el.fsHeadline.addEventListener('blur', saveFsEdits);
    el.fsBody.addEventListener('blur', saveFsEdits);
    el.fsHeadline.addEventListener('input', () => scheduleAutosave(saveFsEdits));
    el.fsBody.addEventListener('input', () => {
      enforceFsLineLimit(el.fsBody);
      scheduleAutosave(saveFsEdits);
    });
    el.fsMicFab.addEventListener('click', () => toggleRecording('fs'));
    wireHoldToRecord(el.fsMicFab, 'fs');
    wireHoldToRecord(el.pageMicFab, 'page');
    el.fsVoiceNoteBtn.addEventListener('click', () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') stopVoiceNoteRecording(false);
      else startVoiceNoteRecording('fs');
    });
    el.printBtn.addEventListener('click', printCurrentPage);
    el.fsScrim.addEventListener('click', closeFullscreen);
    el.fsDate.addEventListener('dblclick', toggleFullscreenExpand);

    el.fsThemeBtn.addEventListener('click', openThemeSheet);
    el.fsStickerBtn.addEventListener('click', openStickerSheet);
    el.fsFontBtn.addEventListener('click', openFontSheet);
    el.fsExpandBtn.addEventListener('click', toggleFullscreenExpand);
    el.fsBookmarkBtn.addEventListener('click', toggleBookmark);
    el.fsTagBtn.addEventListener('click', openTagSheet);
    el.fsPhotoBtn.addEventListener('click', openPhotoPicker);
    el.fsTtsBtn.addEventListener('click', toggleSpeaking);
    el.photoFileInput.addEventListener('change', () => handlePhotoFileSelected(el.photoFileInput.files[0]));
    el.tagSheetBackdrop.addEventListener('click', closeTagSheet);
    el.tagOptions.querySelectorAll('.tag-chip').forEach(btn => {
      btn.addEventListener('click', () => toggleTagOnCurrentPage(btn.dataset.tag));
    });
    el.customTagAddBtn.addEventListener('click', addCustomTag);
    el.customTagInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomTag(); });

    el.themeSheetBackdrop.addEventListener('click', closeThemeSheet);
    el.themeOptions.querySelectorAll('.theme-swatch').forEach(btn => {
      btn.addEventListener('click', () => selectTheme(btn.dataset.theme));
    });
    el.themeApplyAllBtn.addEventListener('click', applyThemeToWholeDiary);

    el.stickerSheetBackdrop.addEventListener('click', closeStickerSheet);
    el.stickerOptions.querySelectorAll('.sticker-option').forEach(btn => {
      btn.addEventListener('click', () => addStickerToCurrentPage(btn.dataset.sticker));
    });

    // tap empty page area to deselect any sticker that's currently selected
    el.fsContent.addEventListener('click', (e) => {
      if (e.target.closest('.placed-sticker') || e.target.closest('.placed-voice-clip')) return;
      deselectAllStickers(el.fsStickerLayer);
    });

    el.cancelDeleteBtn.addEventListener('click', cancelDelete);
    el.confirmDeleteBtn.addEventListener('click', confirmDelete);
    el.searchInput.addEventListener('input', () => runSearch(el.searchInput.value));
    if (el.bookmarksFilterChip) el.bookmarksFilterChip.addEventListener('click', toggleBookmarksFilter);

    el.undoToastBtn.addEventListener('click', performUndo);

    // ---- settings screen ----
    el.settingsBackBtn.addEventListener('click', initHome);
    el.darkModeToggle.addEventListener('change', toggleDarkMode);
    el.langOptions.querySelectorAll('.lang-option').forEach(btn => {
      btn.addEventListener('click', () => selectLang(btn.dataset.lang));
    });
    el.reminderToggle.addEventListener('change', toggleReminder);
    el.reminderTime.addEventListener('change', updateReminderTime);
    el.exportAllBtn.addEventListener('click', exportAllDiaries);

    document.querySelectorAll('.accent-swatch').forEach(btn => {
      btn.addEventListener('click', () => selectAccent(btn.dataset.accent));
    });
    el.diaryFontOptions.querySelectorAll('.lang-option').forEach(btn => {
      btn.addEventListener('click', () => selectDiaryFont(btn.dataset.font));
    });
    if (el.appLockToggle) {
      el.appLockToggle.addEventListener('change', () => {
        if (el.appLockToggle.checked) {
          // don't flip settings.appLock on yet — wait until a PIN is actually set
          el.appLockToggle.checked = false;
          openSetPinSheet(false);
        } else {
          settings.appLock = false;
          settings.pin = '';
          persistSettings();
          if (el.changePinBtn) el.changePinBtn.hidden = true;
          if (el.appLockRowSub) el.appLockRowSub.textContent = 'Require a PIN to open the app';
          showToast('App lock disabled');
        }
      });
    }
    if (el.changePinBtn) el.changePinBtn.addEventListener('click', () => openSetPinSheet(true));
    if (el.setPinSaveBtn) el.setPinSaveBtn.addEventListener('click', saveNewPin);
    if (el.setPinSheetBackdrop) el.setPinSheetBackdrop.addEventListener('click', closeSetPinSheet);
    if (el.backupJsonBtn) el.backupJsonBtn.addEventListener('click', downloadJsonBackup);
    if (el.restoreJsonBtn) el.restoreJsonBtn.addEventListener('click', () => { el.restoreFileInput.value = ''; el.restoreFileInput.click(); });
    if (el.restoreFileInput) el.restoreFileInput.addEventListener('change', () => restoreFromJsonFile(el.restoreFileInput.files[0]));
    if (el.backupReminderBtn) {
      el.backupReminderBtn.addEventListener('click', () => showToast('Weekly backup reminder set'));
    }
    if (el.rateAppBtn) {
      el.rateAppBtn.addEventListener('click', () => showToast('Thanks for the love! ❤️'));
    }
    if (el.sendFeedbackBtn) {
      el.sendFeedbackBtn.addEventListener('click', () => showToast('Feedback form coming soon'));
    }
    if (el.hapticsToggle) {
      el.hapticsToggle.addEventListener('change', () => {
        settings.hapticsOn = el.hapticsToggle.checked;
        persistSettings();
        if (settings.hapticsOn && navigator.vibrate) navigator.vibrate(15);
        showToast(settings.hapticsOn ? 'Haptic feedback on' : 'Haptic feedback off');
      });
    }
    if (el.soundToggle) {
      el.soundToggle.addEventListener('change', () => {
        settings.soundOn = el.soundToggle.checked;
        persistSettings();
        showToast(settings.soundOn ? 'Sound effects on' : 'Sound effects off');
      });
    }
    if (el.clearAllDataBtn) {
      el.clearAllDataBtn.addEventListener('click', clearAllAppData);
    }
    if (el.shareAppBtn) {
      el.shareAppBtn.addEventListener('click', shareApp);
    }

    if (el.lockKeypad) {
      el.lockKeypad.addEventListener('click', (e) => {
        const btn = e.target.closest('.lock-key');
        if (btn) handleLockKey(btn.dataset.key);
      });
    }

    // ---- create-screen lock type chips ----
    if (el.createLockTypeOptions) {
      el.createLockTypeOptions.addEventListener('click', (e) => {
        const btn = e.target.closest('.lock-type-chip');
        if (btn) selectCreateLockType(btn.dataset.locktype);
      });
    }

    // ---- per-diary lock screen (shown when opening a locked diary) ----
    if (el.diaryLockKeypad) {
      el.diaryLockKeypad.addEventListener('click', (e) => {
        const btn = e.target.closest('.lock-key');
        if (btn) handleDiaryLockKey(btn.dataset.key);
      });
    }
    if (el.diaryLockPatternInput) {
      el.diaryLockPatternInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') tryUnlockDiary(el.diaryLockPatternInput.value.trim());
      });
    }
    if (el.diaryLockCancelBtn) el.diaryLockCancelBtn.addEventListener('click', hideDiaryLockScreen);
    if (el.diaryLockForgotBtn) el.diaryLockForgotBtn.addEventListener('click', openForgotLockSheet);
    if (el.forgotLockSheetBackdrop) el.forgotLockSheetBackdrop.addEventListener('click', closeForgotLockSheet);
    if (el.forgotLockSubmitBtn) el.forgotLockSubmitBtn.addEventListener('click', submitForgotLockAnswer);
    if (el.forgotLockAnswerInput) {
      el.forgotLockAnswerInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitForgotLockAnswer(); });
    }

    // ---- manage diary locks (from Settings) ----
    if (el.manageLockTypeOptions) {
      el.manageLockTypeOptions.addEventListener('click', (e) => {
        const btn = e.target.closest('.lock-type-chip');
        if (btn) selectManageLockType(btn.dataset.locktype);
      });
    }
    if (el.diaryLockManageSheetBackdrop) el.diaryLockManageSheetBackdrop.addEventListener('click', closeDiaryLockManageSheet);
    if (el.manageLockSaveBtn) el.manageLockSaveBtn.addEventListener('click', saveManageLock);

    // keyboard nav for page flip (desktop testing convenience)
    document.addEventListener('keydown', (e) => {
      if (el.bookScreen.hidden) return;
      if (e.key === 'ArrowRight') goToPair('next');
      if (e.key === 'ArrowLeft') goToPair('prev');
    });
  }

  function openCoverSheet() {
    el.coverSheetBackdrop.hidden = false;
    el.coverSheet.hidden = false;
    requestAnimationFrame(() => {
      el.coverSheetBackdrop.classList.add('show');
      el.coverSheet.classList.add('show');
    });
  }
  function closeCoverSheet() {
    el.coverSheetBackdrop.classList.remove('show');
    el.coverSheet.classList.remove('show');
    setTimeout(() => { el.coverSheetBackdrop.hidden = true; el.coverSheet.hidden = true; }, 350);
  }

  // ============ INIT ============

  document.addEventListener('DOMContentLoaded', () => {
    wireEvents();
    runLoadingSequence();
  });

  // Clean up any service worker registered by an earlier version of this app —
  // it was causing stale/cached versions to load instead of the latest files.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister());
    }).catch(() => {});
    if (window.caches) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
    }
  }
})();

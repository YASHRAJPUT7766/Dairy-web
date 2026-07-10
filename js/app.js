/* ============================================
   VOICE DIARY v3 — app logic
   Data model (localStorage):
   diaries: [{ id, name, createdAt, font, pages: [{ id, headline, date, text }] }]
   ============================================ */

(() => {
  'use strict';

  const STORAGE_KEY = 'voiceDiary_v2_diaries';
  const SETTINGS_KEY = 'voiceDiary_v2_settings';
  const FONT_MAP = {
    serif: "'Fraunces', serif", hand: "'Caveat', cursive", clean: "'Inter', sans-serif", mono: "'Space Grotesk', monospace",
    inkwell: "'Playwrite US Trad', cursive", apple: "'Homemade Apple', cursive",
  };
  // fonts that start locked and unlock at a streak milestone (longest-ever streak, so
  // once earned they stay unlocked even if a later streak breaks)
  const FONT_UNLOCK_REQUIREMENT = { inkwell: 7, apple: 30 };
  const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);

  const el = {
    loadingScreen: $('loadingScreen'), loadBarFill: $('loadBarFill'), loadPct: $('loadPct'),
    app: $('app'),
    offlineScreen: $('offlineScreen'), offlineRetryBtn: $('offlineRetryBtn'), offlineContinueBtn: $('offlineContinueBtn'),
    offlineBanner: $('offlineBanner'),

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
    recapTabs: $('recapTabs'), recapCard: $('recapCard'), recapHeadline: $('recapHeadline'),
    recapBody: $('recapBody'), recapStatsRow: $('recapStatsRow'),
    weeklyGoalCard: $('weeklyGoalCard'), weeklyGoalRingFill: $('weeklyGoalRingFill'),
    weeklyGoalRingLabel: $('weeklyGoalRingLabel'), weeklyGoalTitle: $('weeklyGoalTitle'),
    weeklyGoalSub: $('weeklyGoalSub'), weeklyGoalEditBtn: $('weeklyGoalEditBtn'),
    yearReviewBtn: $('yearReviewBtn'), yearReviewSheetBackdrop: $('yearReviewSheetBackdrop'),
    yearReviewSheet: $('yearReviewSheet'), yearReviewCanvas: $('yearReviewCanvas'),
    yearReviewTitle: $('yearReviewTitle'), yearReviewSendBtn: $('yearReviewSendBtn'), yearReviewDownloadBtn: $('yearReviewDownloadBtn'),

    homeGreeting: $('homeGreeting'), streakPill: $('streakPill'), streakText: $('streakText'),
    memoryCard: $('memoryCard'), memoryHeadline: $('memoryHeadline'), memorySnippet: $('memorySnippet'), memoryDate: $('memoryDate'), memoryLabel: $('memoryLabel'),
    glanceWidget: $('glanceWidget'), glanceStreakNum: $('glanceStreakNum'), glanceMoodEmoji: $('glanceMoodEmoji'), glanceGoalNum: $('glanceGoalNum'),
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
    exportDiaryBtn: $('exportDiaryBtn'), exportDiaryPdfBtn: $('exportDiaryPdfBtn'), allDiariesLinkBtn: $('allDiariesLinkBtn'), deleteFromCoverBtn: $('deleteFromCoverBtn'),
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
    fsCapsuleBtn: $('fsCapsuleBtn'), fsShareImgBtn: $('fsShareImgBtn'), capsuleLockOverlay: $('capsuleLockOverlay'),
    capsuleLockDate: $('capsuleLockDate'), capsuleUnlockEarlyBtn: $('capsuleUnlockEarlyBtn'),
    capsuleSheetBackdrop: $('capsuleSheetBackdrop'), capsuleSheet: $('capsuleSheet'), capsuleDateInput: $('capsuleDateInput'),
    capsuleSealBtn: $('capsuleSealBtn'), capsuleRemoveBtn: $('capsuleRemoveBtn'),
    shareImgSheetBackdrop: $('shareImgSheetBackdrop'), shareImgSheet: $('shareImgSheet'), shareImgCanvas: $('shareImgCanvas'),
    shareImgFormatRow: $('shareImgFormatRow'), shareImgSendBtn: $('shareImgSendBtn'), shareImgDownloadBtn: $('shareImgDownloadBtn'),
    moodSuggestHint: $('moodSuggestHint'), moodSuggestValue: $('moodSuggestValue'),
    streakFreezeCard: $('streakFreezeCard'), streakFreezeTitle: $('streakFreezeTitle'), streakFreezeSub: $('streakFreezeSub'),
    wordCloud: $('wordCloud'), lengthTrendChart: $('lengthTrendChart'),
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
    exportAllBtn: $('exportAllBtn'), exportAllPdfBtn: $('exportAllPdfBtn'), backupJsonBtn: $('backupJsonBtn'), restoreJsonBtn: $('restoreJsonBtn'),
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

  // ============ OFFLINE HANDLING ============
  // All diary data lives in localStorage, so reading always works offline. Writing
  // (new pages, voice notes, edits) is intentionally paused while offline — this app
  // has no sync/conflict-resolution logic, so it's safer to be honest about it than
  // to silently queue changes. isAppOffline() is checked before write actions;
  // showOfflineScreen() takes over the whole screen on first launch with no
  // connection, and the slim offlineBanner shows if the connection drops mid-use.

  let knownOffline = false; // updated by real connectivity checks below, more reliable than navigator.onLine alone

  function isAppOffline() {
    return knownOffline;
  }

  // call this before any action that writes to a diary (adding a page, recording a
  // voice note, etc). Returns true and shows a toast if the write should be blocked.
  function blockIfOffline() {
    if (!isAppOffline()) return false;
    showToast("You're offline — writing will work again once you're back online.");
    return true;
  }

  function showOfflineScreen() {
    if (!el.offlineScreen) return;
    el.offlineScreen.hidden = false;
  }
  function hideOfflineScreen() {
    if (!el.offlineScreen) return;
    el.offlineScreen.hidden = true;
  }

  function updateOfflineBanner() {
    if (!el.offlineBanner) return;
    el.offlineBanner.hidden = !isAppOffline();
    applyOfflineWriteLock();
  }

  // physically disables typing in every text field while offline, rather than
  // letting someone type and silently failing to persist it — matches the "you can
  // read but not write" behaviour end to end, not just at the button level
  function applyOfflineWriteLock() {
    const offline = isAppOffline();
    document.querySelectorAll('[data-field="headline"], [data-field="lines"], #fsHeadline, #fsBody').forEach(elNode => {
      elNode.setAttribute('contenteditable', offline ? 'false' : 'true');
      elNode.classList.toggle('offline-locked', offline);
    });
  }

  function retryConnection() {
    if (!el.offlineRetryBtn) return;
    el.offlineRetryBtn.classList.add('retrying');
    checkRealConnectivity().then(online => {
      el.offlineRetryBtn.classList.remove('retrying');
      if (online) {
        hideOfflineScreen();
        updateOfflineBanner();
        showToast("You're back online");
      } else {
        showToast('Still offline — check your connection and try again.');
      }
    });
  }

  // navigator.onLine is unreliable on many mobile browsers — it mostly reflects
  // "is there a network adapter at all" (e.g. flips correctly for airplane mode)
  // but often stays "true" even when WiFi is connected with no real internet. This
  // does an actual network round-trip (a tiny, uncacheable request) to know for
  // sure, and is what drives the periodic check below.
  function checkRealConnectivity() {
    if (navigator.onLine === false) return Promise.resolve(false); // trust definite negatives, e.g. airplane mode
    return fetch('https://www.gstatic.com/generate_204', { mode: 'no-cors', cache: 'no-store' })
      .then(() => true)
      .catch(() => false);
  }

  let offlinePollId = null;

  function handleConnectivityResult(online) {
    if (!online && !knownOffline) {
      knownOffline = true;
      showOfflineScreen();
      updateOfflineBanner();
    } else if (online && knownOffline) {
      knownOffline = false;
      hideOfflineScreen();
      updateOfflineBanner();
      showToast("You're back online");
    }
  }

  function pollConnectivity() {
    checkRealConnectivity().then(handleConnectivityResult);
  }

  function wireOfflineHandling() {
    window.addEventListener('online', pollConnectivity);
    window.addEventListener('offline', () => {
      knownOffline = true;
      showOfflineScreen();
      updateOfflineBanner();
    });
    if (el.offlineRetryBtn) el.offlineRetryBtn.addEventListener('click', retryConnection);
    if (el.offlineContinueBtn) el.offlineContinueBtn.addEventListener('click', hideOfflineScreen);

    // also poll periodically, since the browser events alone aren't reliable enough
    // to catch "WiFi connected but no real internet" on many phones
    if (offlinePollId) clearInterval(offlinePollId);
    offlinePollId = setInterval(pollConnectivity, 15000);

    pollConnectivity(); // check immediately on wire-up too
    updateOfflineBanner();
  }

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
            wireOfflineHandling(); // this also runs an immediate connectivity check and shows the offline screen itself if needed
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
          if (clip.playbackFilter === undefined) clip.playbackFilter = 'off';
        });
        if (!Array.isArray(p.photos)) p.photos = [];
        if (!Array.isArray(p.tags)) p.tags = [];
        if (p.bookmarked === undefined) p.bookmarked = false;
        if (p.capsuleUntil === undefined) p.capsuleUntil = null; // ISO date string, or null if not a time capsule
        if (p.suggestedMood === undefined) p.suggestedMood = null; // rough voice-based guess, cleared once a mood is confirmed
        if (p.suggestedMoodConfidence === undefined) p.suggestedMoodConfidence = null; // 'low'|'medium'|'high'
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
    // streak freeze: one free "miss a day, keep your streak" per calendar month
    if (settings.streakFreezeMonth === undefined) settings.streakFreezeMonth = ''; // 'YYYY-MM' of month it was last used, '' if unused this month
    if (!Array.isArray(settings.streakFreezeDatesUsed)) settings.streakFreezeDatesUsed = []; // dates (toDateString) that were auto-covered by a freeze
    if (settings.weeklyGoalTarget === undefined) settings.weeklyGoalTarget = 4; // days per week the user wants to write on
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
    maybeConsumeStreakFreeze();
    renderWeekStrip();
    el.todayFull.textContent = formatDateLong(new Date());
    renderDiaryGridSkeleton();
    showScreen('home'); // switch to Home first so the skeleton is actually the thing that paints
    // hold the skeleton on screen for a beat so it's visible, then swap in the real
    // grid — with pure localStorage data the real render is instant, so without a
    // deliberate minimum delay the skeleton would replace itself in the same frame
    // it appeared in and never actually be seen
    setTimeout(renderDiaryGrid, 220);
    applyProfileEverywhere();
    renderStreak();
    renderMemory();
    renderQuote();
    renderStats();
    renderWeatherWidget();
    renderWeeklyChart();
    renderMoodSummary();
    renderBadges();
    renderGlanceWidget();
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

  // ---------- home glance widget (streak / latest mood / week goal at a glance) ----------
  function renderGlanceWidget() {
    if (!el.glanceWidget) return;
    const dateSet = getAllDatesWithEntries();
    el.glanceStreakNum.textContent = computeCurrentStreak(dateSet);

    let latestMood = '—';
    let latestDate = null;
    diaries.forEach(d => d.pages.forEach(p => {
      if (p.mood && (!latestDate || new Date(p.date) > latestDate)) { latestDate = new Date(p.date); latestMood = p.mood; }
    }));
    el.glanceMoodEmoji.textContent = latestMood;

    const target = settings.weeklyGoalTarget || 4;
    const now = new Date();
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);
    const daysThisWeek = new Set();
    diaries.forEach(d => d.pages.forEach(p => {
      const pd = new Date(p.date);
      if (pd >= startOfWeek && pd <= now) daysThisWeek.add(pd.toDateString());
    }));
    el.glanceGoalNum.textContent = `${daysThisWeek.size}/${target}`;
  }

  // ---------- weekly/monthly recap ("is week/month kaisa raha") ----------
  // Fully on-device, rule-based recap generated from real mood/word/streak data —
  // not an LLM-generated summary. It picks the day with the most positive mood, the
  // day with the most writing, and a couple of stats, then stitches together a
  // template sentence. Good enough for a quick "how was my week" glance without
  // needing a server call.
  const RECAP_MOOD_WORD = { '😊': 'happy', '🥳': 'excited', '😐': 'reflective', '😢': 'low', '😡': 'frustrated', '😴': 'tired', '😰': 'anxious' };
  const RECAP_POSITIVE = ['😊', '🥳'];

  function generateRecap(range) {
    const now = new Date();
    const start = new Date(now);
    if (range === 'month') { start.setDate(1); start.setHours(0, 0, 0, 0); }
    else { start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0); }

    const pagesInRange = [];
    diaries.forEach(d => d.pages.forEach(p => {
      const pd = new Date(p.date);
      if (pd >= start && pd <= now) pagesInRange.push(p);
    }));

    if (!pagesInRange.length) {
      return { headline: range === 'month' ? "No entries yet this month." : "No entries yet this week.", body: 'Write a page or two and your recap will show up here.', stats: [] };
    }

    // mood counts + best day
    const moodCountByDay = new Map(); // dateString -> { counts, dayLabel }
    const moodCounts = {};
    let totalWords = 0;
    pagesInRange.forEach(p => {
      totalWords += (p.text || '').trim().split(/\s+/).filter(Boolean).length;
      if (p.mood) {
        moodCounts[p.mood] = (moodCounts[p.mood] || 0) + 1;
        const key = new Date(p.date).toDateString();
        if (!moodCountByDay.has(key)) moodCountByDay.set(key, {});
        const dayCounts = moodCountByDay.get(key);
        dayCounts[p.mood] = (dayCounts[p.mood] || 0) + 1;
      }
    });

    const topMoodEntry = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    const topMood = topMoodEntry ? topMoodEntry[0] : null;

    // find the day with the most positive-mood entries
    let bestDay = null, bestDayScore = 0;
    moodCountByDay.forEach((counts, dateStr) => {
      const posScore = RECAP_POSITIVE.reduce((s, m) => s + (counts[m] || 0), 0);
      if (posScore > bestDayScore) { bestDayScore = posScore; bestDay = dateStr; }
    });

    // day with the longest entry (most words written)
    let longestDay = null, longestWords = 0;
    pagesInRange.forEach(p => {
      const words = (p.text || '').trim().split(/\s+/).filter(Boolean).length;
      if (words > longestWords) { longestWords = words; longestDay = p.date; }
    });

    const uniqueDays = new Set(pagesInRange.map(p => new Date(p.date).toDateString())).size;
    const rangeLabel = range === 'month' ? 'This month' : 'This week';

    let headline;
    if (topMood) {
      const moodWord = RECAP_MOOD_WORD[topMood] || 'reflective';
      headline = `${rangeLabel} you were mostly ${moodWord} ${topMood}`;
      if (bestDay) {
        const d = new Date(bestDay);
        headline += ` — ${d.toLocaleDateString('en-IN', { weekday: 'long' })} stood out.`;
      } else {
        headline += '.';
      }
    } else {
      headline = `${rangeLabel} you wrote ${uniqueDays} day${uniqueDays === 1 ? '' : 's'}.`;
    }

    const bodyParts = [];
    bodyParts.push(`You wrote on ${uniqueDays} day${uniqueDays === 1 ? '' : 's'}, ${totalWords.toLocaleString('en-IN')} words in total.`);
    if (longestDay) {
      bodyParts.push(`Your longest entry was on ${new Date(longestDay).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}.`);
    }
    const moodList = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    if (moodList.length) bodyParts.push(`Moods logged: ${moodList.join(' ')}`);

    const stats = [
      { label: `${pagesInRange.length} ${pagesInRange.length === 1 ? 'entry' : 'entries'}` },
      { label: `${uniqueDays}/${range === 'month' ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() : 7} days written` },
    ];

    return { headline, body: bodyParts.join(' '), stats };
  }

  let currentRecapRange = 'week';
  function renderRecapCard() {
    if (!el.recapCard) return;
    const recap = generateRecap(currentRecapRange);
    el.recapHeadline.textContent = recap.headline;
    el.recapBody.textContent = recap.body;
    el.recapStatsRow.innerHTML = recap.stats.map(s => `<span class="recap-stat-chip">${escapeHtml(s.label)}</span>`).join('');
  }

  // ---------- weekly goal progress ring ----------
  const WEEKLY_GOAL_RING_CIRCUMFERENCE = 169.6; // 2 * PI * r(27), matches the SVG circle
  function renderWeeklyGoalCard() {
    if (!el.weeklyGoalCard) return;
    const target = settings.weeklyGoalTarget || 4;
    const now = new Date();
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);
    const daysThisWeek = new Set();
    diaries.forEach(d => d.pages.forEach(p => {
      const pd = new Date(p.date);
      if (pd >= startOfWeek && pd <= now) daysThisWeek.add(pd.toDateString());
    }));
    const written = Math.min(daysThisWeek.size, target);
    const pct = target > 0 ? written / target : 0;
    const offset = WEEKLY_GOAL_RING_CIRCUMFERENCE * (1 - pct);
    el.weeklyGoalRingFill.style.strokeDashoffset = offset.toFixed(1);
    el.weeklyGoalRingLabel.textContent = `${daysThisWeek.size}/${target}`;
    el.weeklyGoalTitle.textContent = `${target} day${target === 1 ? '' : 's'} this week`;
    el.weeklyGoalSub.textContent = daysThisWeek.size >= target
      ? "You've hit your goal for this week! 🎉"
      : `${target - daysThisWeek.size} more day${target - daysThisWeek.size === 1 ? '' : 's'} to hit your goal`;
  }

  function promptEditWeeklyGoal() {
    const input = prompt('How many days a week do you want to write? (1-7)', String(settings.weeklyGoalTarget || 4));
    if (input === null) return;
    const n = Math.round(Number(input));
    if (!Number.isFinite(n) || n < 1 || n > 7) { showToast('Enter a number between 1 and 7.'); return; }
    settings.weeklyGoalTarget = n;
    persistSettings();
    renderWeeklyGoalCard();
    showToast('Weekly goal updated');
  }

  // ---------- achievement badges ----------
  // ---------- mood streak (consecutive days logged with a positive mood) ----------
  function computeCurrentMoodStreak(positiveMoods) {
    // most recent mood per day, walking backwards from today; stops at the first day
    // with no entry OR an entry whose mood isn't in the positive set
    const dayMood = new Map();
    diaries.forEach(d => d.pages.forEach(p => {
      if (!p.mood) return;
      const key = new Date(p.date).toDateString();
      dayMood.set(key, p.mood); // last one wins if multiple entries that day
    }));
    let streak = 0;
    const cur = new Date();
    while (true) {
      const key = cur.toDateString();
      if (dayMood.get(key) && positiveMoods.includes(dayMood.get(key))) { streak++; cur.setDate(cur.getDate() - 1); }
      else break;
    }
    return streak;
  }

  // shared badge computation — used by both the Home strip and the Profile screen so
  // the two never drift out of sync with each other.
  function computeBadges() {
    let totalPages = 0;
    diaries.forEach(d => totalPages += d.pages.length);
    const dateSet = getAllDatesWithEntries();
    const longest = computeLongestStreak(dateSet);
    const moodStreak = computeCurrentMoodStreak(['😊', '🥳']);

    const badges = [];
    if (totalPages >= 1) badges.push({ icon: '📝', label: 'First page' });
    if (totalPages >= 10) badges.push({ icon: '📚', label: '10 pages' });
    if (totalPages >= 50) badges.push({ icon: '🏆', label: '50 pages' });
    if (longest >= 7) badges.push({ icon: '🔥', label: '7 day streak' });
    if (longest >= 30) badges.push({ icon: '💎', label: '30 day streak' });
    if (diaries.length >= 3) badges.push({ icon: '🗂️', label: '3 diaries' });
    if (moodStreak >= 3) badges.push({ icon: '🌤️', label: `${moodStreak} day positive streak` });
    if (moodStreak >= 5) badges.push({ icon: '✨', label: '5 day positive streak' });
    return badges;
  }

  function renderBadges() {
    const badges = computeBadges();
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
    // frozen dates count as "present" for streak-counting purposes, same as a real entry
    const effectiveSet = (settings.streakFreezeDatesUsed && settings.streakFreezeDatesUsed.length)
      ? new Set([...dateSet, ...settings.streakFreezeDatesUsed])
      : dateSet;
    let streak = 0;
    const cur = new Date();
    while (effectiveSet.has(cur.toDateString())) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  }

  function currentMonthKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function isStreakFreezeAvailable() {
    return settings.streakFreezeMonth !== currentMonthKey();
  }

  // Called once per day (on home load) — if yesterday has no entry, today does,
  // and a freeze is still available this month, silently consume the freeze so
  // the streak isn't broken. This only bridges a single missed day, and only
  // when there was a genuine streak going into that missed day.
  function maybeConsumeStreakFreeze() {
    if (!isStreakFreezeAvailable()) return;
    const dateSet = getAllDatesWithEntries();
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today); twoDaysAgo.setDate(today.getDate() - 2);
    const hasToday = dateSet.has(today.toDateString());
    const hasYesterday = dateSet.has(yesterday.toDateString());
    const hasTwoDaysAgo = dateSet.has(twoDaysAgo.toDateString());
    if (hasToday && !hasYesterday && hasTwoDaysAgo) {
      settings.streakFreezeMonth = currentMonthKey();
      settings.streakFreezeDatesUsed.push(yesterday.toDateString());
      persistSettings();
      showToast('🧊 Streak freeze used — yesterday is covered!');
    }
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

  function renderStreakFreezeCard() {
    if (!el.streakFreezeCard) return;
    const available = isStreakFreezeAvailable();
    el.streakFreezeCard.classList.toggle('used', !available);
    el.streakFreezeTitle.textContent = available
      ? '1 streak freeze available'
      : 'Streak freeze used this month';

    // proactive nudge: if today has no entry yet and there's an active streak going
    // into today, gently flag it instead of only the generic description
    if (el.streakFreezeSub) {
      const dateSet = getAllDatesWithEntries();
      const today = new Date();
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      const hasToday = dateSet.has(today.toDateString());
      const hadStreakYesterday = computeCurrentStreak(dateSet) > 0 && dateSet.has(yesterday.toDateString());
      if (!hasToday && hadStreakYesterday) {
        el.streakFreezeSub.textContent = "🧊 Aaj mat bhoolna — you still have a streak going. Write a line before the day ends.";
      } else {
        el.streakFreezeSub.textContent = "Miss a day and we'll auto-protect your streak once a month.";
      }
    }
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
        if (!found || pd > new Date(found.page.date)) found = { page: p, diaryName: d.name, label: 'On this day' };
      }
    }));
    // no exact same-date match from a past year — fall back to a "this month, back then"
    // flashback so the card still has something meaningful most of the month, not just
    // on the one exact anniversary date
    if (!found) {
      diaries.forEach(d => d.pages.forEach(p => {
        const pd = new Date(p.date);
        if (pd.getMonth() === today.getMonth() && pd.getFullYear() < today.getFullYear()) {
          if (!found || pd > new Date(found.page.date)) found = { page: p, diaryName: d.name, label: `${pd.toLocaleDateString('en-IN', { month: 'long' })}, ${pd.getFullYear()}` };
        }
      }));
    }
    if (!found) { el.memoryCard.hidden = true; return; }
    el.memoryCard.hidden = false;
    if (el.memoryLabel) el.memoryLabel.textContent = found.label;
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
  // shows 2-3 pulsing placeholder cards immediately, then swaps in real content —
  // most renders here are instant (localStorage), but this keeps the transition
  // smooth on slower/low-end phones and avoids a blank flash while HTML builds
  function renderDiaryGridSkeleton() {
    if (!el.diaryGrid) return;
    el.diaryGrid.className = 'diary-grid';
    el.diaryGrid.innerHTML = Array.from({ length: 3 }).map(() => `
      <div class="diary-grid-card skeleton-card">
        <div class="skeleton-shimmer"></div>
      </div>
    `).join('');
  }

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
      <div class="diary-grid-card" data-id="${d.id}" data-cover-theme="${d.coverTheme || 'classic'}" data-mood-tint="${computeMoodTintForDiary(d)}">
        ${d.lock ? `<span class="diary-grid-card-lock"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>` : ''}
        ${d.pages.some(isCapsuleLocked) ? `<span class="diary-grid-card-capsule" title="Contains a sealed time capsule page">🧊</span>` : ''}
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
    if (blockIfOffline()) return;
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

  // Maps a diary's most recent mood emoji to a cover tint keyword. This is a light,
  // decorative touch only — "rainy mood → soft blue wash" per the original ask —
  // never changes the underlying cover theme the person picked.
  const MOOD_TO_COVER_TINT = { '😊': 'happy', '🥳': 'happy', '😢': 'sad', '😐': 'calm', '😰': 'anxious', '😡': 'anxious', '😴': 'rainy' };
  function computeMoodTintForDiary(diary) {
    const moodPages = diary.pages.filter(p => p.mood);
    if (!moodPages.length) return '';
    const latest = moodPages[moodPages.length - 1];
    return MOOD_TO_COVER_TINT[latest.mood] || '';
  }

  function openCoverScreen(diaryId, opts) {
    activeDiaryId = diaryId;
    const diary = getDiary(diaryId);
    if (!diary) return;

    el.bookCoverTitle.textContent = diary.name;
    el.bookCoverMeta.textContent = `${diary.pages.length} ${diary.pages.length === 1 ? 'page' : 'pages'} · ${formatDateShort(new Date(diary.createdAt))}`;
    el.bookCoverSignature.textContent = diary.signature || 'made by Yash';
    el.bookCover.dataset.coverTheme = diary.coverTheme || 'classic';
    el.bookCover.dataset.moodTint = computeMoodTintForDiary(diary);
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

  // applies the locked look + a title tooltip to any sticker-options grid, based on
  // streak-milestone unlocks; used for both the cover and page sticker sheets
  function applyStickerLockUI(containerEl) {
    if (!containerEl) return;
    containerEl.querySelectorAll('.sticker-option').forEach(btn => {
      const key = btn.dataset.sticker;
      const unlocked = isStickerUnlocked(key);
      btn.classList.toggle('locked', !unlocked);
      btn.title = unlocked ? '' : `Unlocks at ${STICKER_UNLOCK_REQUIREMENT[key]} day streak`;
    });
  }

  function openCoverStickerSheet() {
    applyStickerLockUI(el.coverStickerOptions);
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
    if (!isStickerUnlocked(stickerKey)) {
      showToast(`Keep a ${STICKER_UNLOCK_REQUIREMENT[stickerKey]}-day streak to unlock this sticker.`);
      return;
    }
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
      applyOfflineWriteLock();
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

    if (isCapsuleLocked(page)) {
      headlineEl.contentEditable = 'false';
      linesEl.contentEditable = 'false';
      headlineEl.textContent = '🧊 Sealed';
      dateEl.textContent = 'Opens ' + formatCapsuleDate(page.capsuleUntil);
      linesEl.textContent = 'This page is a time capsule and will unlock automatically on that date.';
      numEl.textContent = String(idx + 1);
      return;
    }

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
    if (isCapsuleLocked(page)) return; // never persist placeholder text over a sealed page
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
    if (blockIfOffline()) return;
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

  function isFontUnlocked(fontKey) {
    const requirement = FONT_UNLOCK_REQUIREMENT[fontKey];
    if (!requirement) return true; // not a gated font
    const longest = computeLongestStreak(getAllDatesWithEntries());
    return longest >= requirement;
  }

  function openFontSheet() {
    const diary = currentDiary();
    document.querySelectorAll('.font-option').forEach(btn => {
      const key = btn.dataset.font;
      btn.classList.toggle('active', key === diary.font);
      const unlocked = isFontUnlocked(key);
      btn.classList.toggle('locked', !unlocked);
      if (FONT_UNLOCK_REQUIREMENT[key]) {
        const subEl = btn.querySelector('small');
        if (subEl) subEl.textContent = unlocked ? 'Unlocked!' : `Unlocks at ${FONT_UNLOCK_REQUIREMENT[key]} day streak`;
      }
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
    if (!isFontUnlocked(fontKey)) {
      const req = FONT_UNLOCK_REQUIREMENT[fontKey];
      showToast(`Keep a ${req}-day streak to unlock this font.`);
      return;
    }
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
  const MOOD_VIBE_MAP = { '😊': 'happy', '🥳': 'happy', '😐': 'calm', '😢': 'sad', '😡': 'intense', '😴': 'calm', '😰': 'intense' };

  function applyActiveThemes() {
    const diary = currentDiary();
    if (!diary) return;
    const li = pairIndex * 2, ri = pairIndex * 2 + 1;
    const leftPage = diary.pages[li], rightPage = diary.pages[ri];
    el.pageSheetLeft.dataset.theme = (leftPage && leftPage.theme) || diary.theme || 'parchment';
    el.pageSheetRight.dataset.theme = (rightPage && rightPage.theme) || diary.theme || 'parchment';
    el.pageSheetLeft.dataset.vibe = (leftPage && MOOD_VIBE_MAP[leftPage.mood]) || '';
    el.pageSheetRight.dataset.vibe = (rightPage && MOOD_VIBE_MAP[rightPage.mood]) || '';
    if (editingIndex !== null) {
      const page = diary.pages[editingIndex];
      el.fsSheet.dataset.theme = (page && page.theme) || diary.theme || 'parchment';
      el.fsSheet.dataset.vibe = (page && MOOD_VIBE_MAP[page.mood]) || '';
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
  // two stickers are held back as streak-milestone rewards (same unlock model as
  // fonts) — everything else stays freely available like before
  const STICKER_UNLOCK_REQUIREMENT = { moon: 14, sun: 21 };
  function isStickerUnlocked(key) {
    const requirement = STICKER_UNLOCK_REQUIREMENT[key];
    if (!requirement) return true;
    return computeLongestStreak(getAllDatesWithEntries()) >= requirement;
  }

  function openStickerSheet() {
    applyStickerLockUI(el.stickerOptions);
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
    if (!isStickerUnlocked(stickerKey)) {
      showToast(`Keep a ${STICKER_UNLOCK_REQUIREMENT[stickerKey]}-day streak to unlock this sticker.`);
      return;
    }
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

  // ---- voice playback filters ----
  // Real Web Audio DSP applied at playback time only — the original recording is
  // never modified or re-saved. "Calm" slows the clip slightly and rolls off some
  // high frequencies (a warmer, mellower tone); "energetic" speeds it up slightly
  // and boosts high frequencies (a brighter, livelier tone). "Off" is the untouched
  // original. One shared AudioContext is reused across clips.
  let sharedAudioCtx = null;
  function getSharedAudioCtx() {
    if (!sharedAudioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      sharedAudioCtx = new Ctx();
    }
    return sharedAudioCtx;
  }

  const VOICE_FILTER_CYCLE = ['off', 'calm', 'energetic'];
  const VOICE_FILTER_ICON = { off: '🎙️', calm: '🌙', energetic: '⚡' };
  const VOICE_FILTER_LABEL = { off: 'Original', calm: 'Calm', energetic: 'Energetic' };

  // sets up (once per audio element) a Web Audio graph: source -> lowshelf/highshelf
  // filter -> destination, and returns a function to switch modes live.
  function attachVoiceFilterGraph(audioEl) {
    const ctx = getSharedAudioCtx();
    if (!ctx) return null; // Web Audio unsupported — filter toggle will be a no-op
    let source;
    try {
      source = ctx.createMediaElementSource(audioEl);
    } catch {
      return null; // already attached elsewhere, or blocked — fail quietly
    }
    const filter = ctx.createBiquadFilter();
    filter.type = 'highshelf';
    filter.frequency.value = 3000;
    source.connect(filter);
    filter.connect(ctx.destination);

    return function applyMode(mode) {
      if (ctx.state === 'suspended') ctx.resume();
      if (mode === 'calm') {
        audioEl.playbackRate = 0.92;
        filter.gain.setTargetAtTime(-9, ctx.currentTime, 0.05); // roll off highs → warmer
      } else if (mode === 'energetic') {
        audioEl.playbackRate = 1.12;
        filter.gain.setTargetAtTime(6, ctx.currentTime, 0.05); // boost highs → brighter
      } else {
        audioEl.playbackRate = 1.0;
        filter.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      }
    };
  }

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

      const filterBtn = document.createElement('button');
      filterBtn.className = 'voice-clip-filter-btn';
      let filterMode = clip.playbackFilter || 'off';
      filterBtn.textContent = VOICE_FILTER_ICON[filterMode];
      filterBtn.title = VOICE_FILTER_LABEL[filterMode] + ' tone';
      filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nextIdx = (VOICE_FILTER_CYCLE.indexOf(filterMode) + 1) % VOICE_FILTER_CYCLE.length;
        filterMode = VOICE_FILTER_CYCLE[nextIdx];
        clip.playbackFilter = filterMode;
        persist();
        filterBtn.textContent = VOICE_FILTER_ICON[filterMode];
        filterBtn.title = VOICE_FILTER_LABEL[filterMode] + ' tone';
        showToast(filterMode === 'off' ? 'Original voice' : `${VOICE_FILTER_LABEL[filterMode]} tone`);
        if (applyFilterMode) applyFilterMode(filterMode);
      });
      node.appendChild(filterBtn);

      const handle = document.createElement('div');
      handle.className = 'voice-clip-resize-handle';
      node.appendChild(handle);

      let audioEl = clip.dataUrl ? new Audio(clip.dataUrl) : null;
      let rafId = null;
      let applyFilterMode = audioEl ? attachVoiceFilterGraph(audioEl) : null;
      if (applyFilterMode && filterMode !== 'off') applyFilterMode(filterMode);

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
      if (e.target === handle || e.target.closest('.voice-clip-play') || e.target.closest('.voice-clip-remove') || e.target.closest('.voice-clip-filter-btn')) return;
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
    if (blockIfOffline()) return;
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
        const voiceGuess = suggestMoodFromWaveform(waveform, durationSec);
        const textGuess = suggestMoodFromText(page.text);
        const combined = combineMoodSuggestions(voiceGuess, textGuess);
        if (combined && !page.mood) {
          page.suggestedMood = combined.mood;
          page.suggestedMoodConfidence = combined.confidence;
        }
        persist();
        rerenderVoiceClips(info.target, page, info.idx);
        showToast('Voice note added — drag to place it');
      });
    }).catch(() => showToast("Couldn't save the recording."));
  }

  // ---- lightweight voice mood heuristic (energy + variance of the recorded waveform) ----
  // This is a rough, on-device guess from loudness/pace only — never a claim about how
  // the person actually feels. It only ever pre-fills a suggestion the person can confirm,
  // change, or ignore in the mood sheet.
  // Returns { mood, confidence } or null. confidence is 'low'|'medium'|'high', purely
  // derived from how strongly the signal matched a bucket — not a real certainty score.
  function suggestMoodFromWaveform(waveform, durationSec) {
    if (!waveform || !waveform.length || durationSec < 1.2) return null;
    const avg = waveform.reduce((a, b) => a + b, 0) / waveform.length;
    const variance = waveform.reduce((a, b) => a + (b - avg) * (b - avg), 0) / waveform.length;

    const bucket = (mood, strength) => ({ mood, confidence: strength > 0.62 ? 'high' : strength > 0.5 ? 'medium' : 'low' });

    if (avg > 0.55 && variance > 0.045) return bucket('🥳', avg);
    if (avg > 0.5 && variance <= 0.045) return bucket('😊', avg);
    if (avg < 0.28 && variance < 0.02) return bucket('😴', 1 - avg);
    if (avg < 0.35 && durationSec > 20) return bucket('😐', 1 - avg);
    if (variance > 0.06 && avg > 0.4) return bucket('😰', variance);
    return null; // not confident enough — no suggestion, mood sheet shows normal picker
  }

  // ---- text-based mood keyword tagging ----
  // Simple on-device keyword match over the transcribed/typed text (English + common
  // Hinglish words). This is a heuristic, not real sentiment analysis — it only ever
  // produces a suggestion the person can confirm or change, same as the voice guess.
  const MOOD_KEYWORDS = {
    '🥳': ['excited', 'thrilled', 'amazing', 'best day', 'celebration', 'party', 'khushi khushi', 'mast', 'zabardast', 'shandaar'],
    '😊': ['happy', 'good day', 'grateful', 'thankful', 'nice', 'great', 'khush', 'accha laga', 'badhiya', 'maza aaya'],
    '😢': ['sad', 'cried', 'crying', 'upset', 'heartbroken', 'miss', 'udaas', 'dukhi', 'rona aaya', 'akela'],
    '😡': ['angry', 'furious', 'annoyed', 'frustrated', 'irritated', 'gussa', 'chidchida', 'bhad gaya'],
    '😴': ['tired', 'exhausted', 'sleepy', 'drained', 'thak gaya', 'thaki', 'neend'],
    '😰': ['anxious', 'worried', 'nervous', 'stressed', 'scared', 'tension', 'pareshan', 'darr', 'chinta'],
    '😐': ['okay', 'fine', 'normal', 'nothing much', 'thik thak', 'aisa hi', 'kuch khaas nahi'],
  };
  function suggestMoodFromText(text) {
    if (!text || text.trim().length < 8) return null;
    const lower = text.toLowerCase();
    const scores = {};
    Object.entries(MOOD_KEYWORDS).forEach(([mood, words]) => {
      words.forEach(w => { if (lower.includes(w)) scores[mood] = (scores[mood] || 0) + 1; });
    });
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (!ranked.length) return null;
    return { mood: ranked[0][0], confidence: ranked[0][1] >= 2 ? 'high' : 'medium' };
  }

  // Combines the voice-waveform guess and the text-keyword guess into one suggestion.
  // If both agree, confidence is boosted to high. If they disagree, the text guess wins
  // (text content is a stronger signal than tone/pace alone), but confidence drops to low.
  function combineMoodSuggestions(fromVoice, fromText) {
    if (fromVoice && fromText) {
      if (fromVoice.mood === fromText.mood) return { mood: fromVoice.mood, confidence: 'high' };
      return { mood: fromText.mood, confidence: 'low' };
    }
    return fromText || fromVoice || null;
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

  const MOOD_LABELS_FOR_HINT = { '😊': 'happy', '🥳': 'excited', '😐': 'reflective', '😢': 'sad', '😡': 'frustrated', '😴': 'tired', '😰': 'anxious' };

  function openMoodSheet() {
    const diary = currentDiary();
    if (!diary) return;
    const idx = getFocusedPageIndex();
    if (!diary.pages[idx]) { showToast('Add a page first.'); return; }
    const page = diary.pages[idx];

    // if there's no suggestion yet (e.g. entry was typed, no voice note), try a
    // text-only keyword guess now so typed entries also get a mood pre-fill
    if (!page.mood && !page.suggestedMood) {
      const textGuess = suggestMoodFromText(page.text);
      if (textGuess) { page.suggestedMood = textGuess.mood; page.suggestedMoodConfidence = textGuess.confidence; persist(); }
    }

    document.querySelectorAll('.mood-option').forEach(btn => {
      btn.classList.toggle('active', (btn.dataset.mood || '') === (page.mood || ''));
    });

    if (el.moodSuggestHint) {
      const suggestion = !page.mood && page.suggestedMood;
      el.moodSuggestHint.hidden = !suggestion;
      if (suggestion) {
        const confidenceNote = page.suggestedMoodConfidence === 'low' ? ' (not sure)' : '';
        el.moodSuggestValue.textContent = (MOOD_LABELS_FOR_HINT[page.suggestedMood] || 'something') + ' ' + page.suggestedMood + confidenceNote;
      }
    }

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
    page.suggestedMood = null;
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
    renderCapsuleLock(page);
    applyOfflineWriteLock();

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
    if (isCapsuleLocked(page)) return;
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

  // ============ TIME CAPSULE (lock a page until a future date) ============

  function isCapsuleLocked(page) {
    if (!page || !page.capsuleUntil) return false;
    const untilDate = new Date(page.capsuleUntil + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return untilDate > today;
  }

  function formatCapsuleDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function renderCapsuleLock(page) {
    const locked = isCapsuleLocked(page);
    el.fsCapsuleBtn.classList.toggle('active', !!page.capsuleUntil);
    if (!el.capsuleLockOverlay) return;
    el.capsuleLockOverlay.hidden = !locked;
    if (locked) {
      el.capsuleLockDate.textContent = formatCapsuleDate(page.capsuleUntil);
      el.fsBody.contentEditable = 'false';
      el.fsHeadline.contentEditable = 'false';
    } else {
      el.fsBody.contentEditable = 'true';
      el.fsHeadline.contentEditable = 'true';
    }
  }

  function openCapsuleSheet() {
    if (editingIndex === null) return;
    const diary = currentDiary();
    if (!diary) return;
    const page = diary.pages[editingIndex];
    if (!page) return;
    el.capsuleDateInput.value = page.capsuleUntil || '';
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    el.capsuleDateInput.min = tomorrow.toISOString().slice(0, 10);
    el.capsuleRemoveBtn.hidden = !page.capsuleUntil;
    el.capsuleSheetBackdrop.hidden = false;
    el.capsuleSheet.hidden = false;
    requestAnimationFrame(() => {
      el.capsuleSheetBackdrop.classList.add('show');
      el.capsuleSheet.classList.add('show');
    });
  }

  function closeCapsuleSheet() {
    el.capsuleSheetBackdrop.classList.remove('show');
    el.capsuleSheet.classList.remove('show');
    setTimeout(() => { el.capsuleSheetBackdrop.hidden = true; el.capsuleSheet.hidden = true; }, 350);
  }

  function sealCapsule() {
    if (editingIndex === null) return;
    const diary = currentDiary();
    if (!diary) return;
    const page = diary.pages[editingIndex];
    if (!page) return;
    const val = el.capsuleDateInput.value;
    if (!val) { showToast('Pick a future date first.'); return; }
    page.capsuleUntil = val;
    persist();
    renderCapsuleLock(page);
    closeCapsuleSheet();
    showToast('Sealed until ' + formatCapsuleDate(val));
  }

  function removeCapsule() {
    if (editingIndex === null) return;
    const diary = currentDiary();
    if (!diary) return;
    const page = diary.pages[editingIndex];
    if (!page) return;
    page.capsuleUntil = null;
    persist();
    renderCapsuleLock(page);
    closeCapsuleSheet();
    showToast('Seal removed');
  }

  function unlockCapsuleEarly() {
    if (editingIndex === null) return;
    const diary = currentDiary();
    if (!diary) return;
    const page = diary.pages[editingIndex];
    if (!page) return;
    el.capsuleLockOverlay.hidden = true;
    el.fsBody.contentEditable = 'true';
    el.fsHeadline.contentEditable = 'true';
    showToast('Opened early — this page stays sealed for next time');
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
    ttsUtterance.lang = settings.speechLang === 'hinglish' ? 'en-IN' : (settings.speechLang || 'en-IN');
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

    if (blockIfOffline()) return;

    if (target === 'page') {
      const idx = getFocusedPageIndex();
      const diary = currentDiary();
      if (!diary || !diary.pages[idx]) { showToast('Add a page first.'); return; }
    }

    recognitionTarget = target;
    recognizer = new SpeechRecognitionImpl();
    const savedLang = settings.speechLang || (window.CONFIG && CONFIG.SPEECH_LANG) || 'en-IN';
    // 'hinglish' isn't a real BCP-47 tag — the on-device speech engine has no true
    // mixed-language mode, so this maps to the English (India) engine, which tends
    // to romanize Hindi words reasonably well when they're mixed into English speech.
    recognizer.lang = savedLang === 'hinglish' ? 'en-IN' : savedLang;
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
  // "Smart search" — not real semantic/embedding search (that needs a model this
  // on-device app doesn't have), but a practical stand-in: topic keyword groups let
  // "job ke baare mein" match "interview", "boss", "resign", etc. even when the exact
  // word "job" never appears, plus mood-name search and word-stem overlap scoring so
  // results are ranked by relevance instead of just filtered by exact substring.
  const SEARCH_TOPIC_GROUPS = [
    { key: 'job', words: ['job', 'work', 'office', 'career', 'interview', 'boss', 'resign', 'salary', 'naukri', 'kaam', 'company', 'meeting', 'promotion', 'colleague'] },
    { key: 'family', words: ['family', 'mom', 'dad', 'mother', 'father', 'parents', 'brother', 'sister', 'family', 'ghar', 'papa', 'mummy', 'bhai', 'behen'] },
    { key: 'love', words: ['love', 'relationship', 'boyfriend', 'girlfriend', 'crush', 'breakup', 'pyaar', 'ishq', 'partner', 'dating'] },
    { key: 'health', words: ['health', 'sick', 'doctor', 'hospital', 'pain', 'tired', 'gym', 'workout', 'bimaar', 'tabiyat', 'exercise', 'sleep'] },
    { key: 'money', words: ['money', 'paisa', 'salary', 'expensive', 'budget', 'saving', 'debt', 'loan', 'kharcha', 'rupees'] },
    { key: 'travel', words: ['travel', 'trip', 'vacation', 'flight', 'hotel', 'journey', 'ghumne', 'safar', 'holiday'] },
    { key: 'friends', words: ['friend', 'friends', 'dost', 'yaar', 'buddy', 'hangout'] },
    { key: 'study', words: ['study', 'exam', 'college', 'school', 'padhai', 'test', 'assignment', 'university'] },
  ];
  const MOOD_SEARCH_NAMES = { '😊': ['happy', 'khush'], '🥳': ['excited', 'party'], '😢': ['sad', 'udaas'], '😡': ['angry', 'gussa'], '😴': ['tired', 'thak'], '😰': ['anxious', 'worried', 'pareshan'], '😐': ['okay', 'normal'] };

  function expandQueryTerms(q) {
    // returns a set of extra words to also look for, based on which topic groups the
    // query touches (e.g. typing "job" also pulls in "interview", "boss", "resign"...)
    const extra = new Set();
    SEARCH_TOPIC_GROUPS.forEach(group => {
      if (group.words.some(w => q.includes(w))) group.words.forEach(w => extra.add(w));
    });
    return extra;
  }

  function moodsMatchingQuery(q) {
    return Object.entries(MOOD_SEARCH_NAMES).filter(([, names]) => names.some(n => q.includes(n))).map(([mood]) => mood);
  }

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

    const extraTerms = expandQueryTerms(q);
    const moodMatches = moodsMatchingQuery(q);
    const queryWords = q.split(/\s+/).filter(w => w.length > 2);

    const hits = [];
    diaries.forEach(d => {
      d.pages.forEach((p, idx) => {
        const headline = (p.headline || '').toLowerCase();
        const text = (p.text || '').toLowerCase();
        const combined = headline + ' ' + text;

        let score = 0;
        if (headline.includes(q)) score += 5;
        if (text.includes(q)) score += 3;
        if (moodMatches.includes(p.mood)) score += 4;
        queryWords.forEach(w => { if (combined.includes(w)) score += 1; });
        extraTerms.forEach(w => { if (combined.includes(w)) score += 0.5; });

        if (score > 0) hits.push({ diary: d, page: p, idx, score });
      });
    });

    hits.sort((a, b) => b.score - a.score);

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
    let i = lower.indexOf(q);
    let matchLen = q.length;
    if (i === -1) {
      // exact phrase not found (this hit matched via a related topic word or mood) —
      // fall back to the first query word that does appear, so the snippet still
      // centers on something relevant instead of just showing the start of the text
      const words = q.split(/\s+/).filter(w => w.length > 2);
      for (const w of words) {
        const wi = lower.indexOf(w);
        if (wi !== -1) { i = wi; matchLen = w.length; break; }
      }
    }
    if (i === -1) return text.slice(0, 80) + (text.length > 80 ? '…' : '');
    const start = Math.max(0, i - 30);
    const end = Math.min(text.length, i + matchLen + 30);
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

  // ============ PDF EXPORT ============
  // Uses jsPDF (loaded from CDN in index.html) to lay out each page like an actual
  // diary page — headline, date + mood, body text — rather than just dumping raw
  // text into a PDF. Falls back to a toast if the library failed to load (e.g. no
  // network on first load before the script cached).

  function pdfLibAvailable() {
    return typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF;
  }

  function buildDiaryPdf(diaryList, opts) {
    opts = opts || {};
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 56, marginTop = 72, marginBottom = 60;
    const maxTextWidth = pageW - marginX * 2;
    let first = true;

    diaryList.forEach(diary => {
      if (!first) doc.addPage();
      first = false;
      let y = marginTop;

      // diary title page header
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.text(diary.name, marginX, y);
      y += 26;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120, 110, 90);
      doc.text(`${diary.pages.length} page${diary.pages.length === 1 ? '' : 's'} · ${diary.signature || 'made by Yash'}`, marginX, y);
      doc.setTextColor(30, 26, 18);
      y += 30;
      doc.setDrawColor(210, 195, 160);
      doc.line(marginX, y, pageW - marginX, y);
      y += 30;

      diary.pages.forEach((p, i) => {
        const headline = p.headline || `Page ${i + 1}`;
        const dateLine = formatDateLong(new Date(p.date)) + (p.mood ? '   ' + p.mood : '');
        const bodyLines = doc.splitTextToSize(p.text || '(no text)', maxTextWidth);

        // estimate this entry's height to decide if it needs a fresh page
        const headlineH = 22, dateH = 16, bodyLineH = 15;
        const neededH = headlineH + dateH + (bodyLines.length * bodyLineH) + 30;
        if (y + neededH > pageH - marginBottom) {
          doc.addPage();
          y = marginTop;
        }

        doc.setFont('times', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(30, 26, 18);
        doc.text(headline, marginX, y);
        y += headlineH - 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(140, 120, 90);
        doc.text(dateLine, marginX, y);
        y += dateH + 4;

        doc.setFont('times', 'normal');
        doc.setFontSize(11.5);
        doc.setTextColor(40, 34, 24);
        bodyLines.forEach(line => {
          if (y > pageH - marginBottom) { doc.addPage(); y = marginTop; }
          doc.text(line, marginX, y);
          y += bodyLineH;
        });
        y += 24;

        if (y < pageH - marginBottom) {
          doc.setDrawColor(230, 220, 200);
          doc.line(marginX, y - 12, pageW - marginX, y - 12);
        }
      });
    });

    return doc;
  }

  function exportDiaryAsPdf(diary) {
    if (!pdfLibAvailable()) { showToast("PDF export isn't available right now — try again in a moment."); return; }
    if (!diary.pages.length) { showToast('This diary has no pages yet.'); return; }
    try {
      const doc = buildDiaryPdf([diary]);
      doc.save(`${diary.name.replace(/[^a-z0-9]+/gi, '-')}.pdf`);
      showToast('PDF exported');
    } catch (err) {
      console.error(err);
      showToast("Couldn't create the PDF.");
    }
  }

  function exportAllDiariesAsPdf() {
    if (!diaries.length) { showToast('No diaries yet.'); return; }
    if (!pdfLibAvailable()) { showToast("PDF export isn't available right now — try again in a moment."); return; }
    try {
      const doc = buildDiaryPdf(diaries);
      doc.save('voice-diary-export.pdf');
      showToast('All diaries exported as PDF');
    } catch (err) {
      console.error(err);
      showToast("Couldn't create the PDF.");
    }
  }

  // ============ SHARE AS IMAGE (WhatsApp status / Instagram story) ============

  const SHARE_THEME_COLORS = {
    parchment: { from: '#f6efe0', to: '#ead9bb', ink: '#2b2416', sub: '#6b5a3f' },
    night:     { from: '#1b2233', to: '#0f131e', ink: '#d9def0', sub: '#8f9ac2' },
    sunset:    { from: '#f7ceb0', to: '#e58a71', ink: '#3a1f16', sub: '#7a3d2c' },
    forest:    { from: '#dbe6cd', to: '#a9c090', ink: '#22301a', sub: '#4c6339' },
    lavender:  { from: '#e6e0f5', to: '#c3b6e3', ink: '#2c2440', sub: '#5c4f85' },
    ocean:     { from: '#cfe6e6', to: '#7fb3b8', ink: '#14302f', sub: '#386361' },
    blush:     { from: '#f9e2e2', to: '#e9b3ae', ink: '#3d2320', sub: '#7a4844' },
    sand:      { from: '#eee3c8', to: '#d8c295', ink: '#362c17', sub: '#6b5a34' },
  };

  let shareImgFormat = 'story'; // 'story' (1080x1920) or 'square' (1080x1080)

  function wrapCanvasText(ctx, text, maxWidth) {
    const words = (text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawShareImage() {
    const diary = currentDiary();
    if (!diary || editingIndex === null) return;
    const page = diary.pages[editingIndex];
    if (!page) return;

    const isStory = shareImgFormat === 'story';
    const W = 1080, H = isStory ? 1920 : 1080;
    const canvas = el.shareImgCanvas;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const themeKey = page.theme || diary.theme || 'parchment';
    const colors = SHARE_THEME_COLORS[themeKey] || SHARE_THEME_COLORS.parchment;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, colors.from);
    grad.addColorStop(1, colors.to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const padX = 96;
    let y = isStory ? 260 : 140;

    // diary name (small label)
    ctx.fillStyle = colors.sub;
    ctx.font = '600 30px Inter, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(diary.name.toUpperCase(), padX, y);
    y += 56;

    // date + mood
    ctx.font = '500 30px Inter, sans-serif';
    ctx.fillText(formatDateLong(new Date(page.date)) + (page.mood ? '   ' + page.mood : ''), padX, y);
    y += 90;

    // headline
    if (page.headline) {
      ctx.fillStyle = colors.ink;
      ctx.font = '600 58px Fraunces, Georgia, serif';
      const headlineLines = wrapCanvasText(ctx, page.headline, W - padX * 2);
      headlineLines.slice(0, 3).forEach(line => { ctx.fillText(line, padX, y); y += 68; });
      y += 30;
    }

    // body text
    ctx.fillStyle = colors.ink;
    ctx.font = '400 40px Fraunces, Georgia, serif';
    const bodyMaxY = isStory ? H - 320 : H - 200;
    const bodyLines = wrapCanvasText(ctx, page.text || '', W - padX * 2);
    for (const line of bodyLines) {
      if (y > bodyMaxY) {
        ctx.font = '400 34px Inter, sans-serif';
        ctx.fillStyle = colors.sub;
        ctx.fillText('…', padX, y);
        break;
      }
      ctx.fillText(line, padX, y);
      y += 56;
    }

    // signature footer
    ctx.font = '500 28px Inter, sans-serif';
    ctx.fillStyle = colors.sub;
    ctx.fillText((diary.signature || 'made with Voice Diary'), padX, H - (isStory ? 120 : 80));
  }

  function openShareImgSheet() {
    if (editingIndex === null) { showToast('Open a page first.'); return; }
    shareImgFormat = 'story';
    if (el.shareImgFormatRow) {
      el.shareImgFormatRow.querySelectorAll('.share-format-chip').forEach(c => c.classList.toggle('active', c.dataset.format === 'story'));
    }
    drawShareImage();
    el.shareImgSheetBackdrop.hidden = false;
    el.shareImgSheet.hidden = false;
    requestAnimationFrame(() => {
      el.shareImgSheetBackdrop.classList.add('show');
      el.shareImgSheet.classList.add('show');
    });
  }

  function closeShareImgSheet() {
    el.shareImgSheetBackdrop.classList.remove('show');
    el.shareImgSheet.classList.remove('show');
    setTimeout(() => { el.shareImgSheetBackdrop.hidden = true; el.shareImgSheet.hidden = true; }, 350);
  }

  function shareImageNow() {
    el.shareImgCanvas.toBlob(async (blob) => {
      if (!blob) { showToast("Couldn't generate the image."); return; }
      const file = new File([blob], 'voice-diary-page.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'My diary page' });
        } catch (err) {
          if (err && err.name !== 'AbortError') showToast("Couldn't share the image.");
        }
      } else {
        downloadShareImage(blob);
        showToast('Image downloaded — share it from your gallery');
      }
    }, 'image/png');
  }

  function downloadShareImage(blob) {
    const doDownload = (b) => {
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'voice-diary-page.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    if (blob) { doDownload(blob); return; }
    el.shareImgCanvas.toBlob(b => { if (b) doDownload(b); else showToast("Couldn't generate the image."); }, 'image/png');
  }

  // ============ YEAR IN REVIEW (Spotify-Wrapped style shareable stats card) ============
  // Entirely computed from real on-device data — total entries, top mood, longest
  // streak, most active month — laid out on the same canvas + share/download
  // machinery as the single-page share card above.

  function computeYearStats(year) {
    const pages = [];
    diaries.forEach(d => d.pages.forEach(p => {
      if (new Date(p.date).getFullYear() === year) pages.push(p);
    }));

    let totalWords = 0;
    const moodCounts = {};
    const monthCounts = new Array(12).fill(0);
    const daySet = new Set();
    pages.forEach(p => {
      totalWords += (p.text || '').trim().split(/\s+/).filter(Boolean).length;
      if (p.mood) moodCounts[p.mood] = (moodCounts[p.mood] || 0) + 1;
      const d = new Date(p.date);
      monthCounts[d.getMonth()]++;
      daySet.add(d.toDateString());
    });

    const topMoodEntry = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    const busiestMonthIdx = monthCounts.indexOf(Math.max(...monthCounts));
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // longest streak within the year specifically
    let longestInYear = 0, run = 0;
    for (let m = 0; m < 12; m++) {
      for (let day = 1; day <= 31; day++) {
        const d = new Date(year, m, day);
        if (d.getMonth() !== m) break;
        if (daySet.has(d.toDateString())) { run++; longestInYear = Math.max(longestInYear, run); }
        else run = 0;
      }
    }

    return {
      year,
      totalEntries: pages.length,
      totalWords,
      daysWritten: daySet.size,
      topMood: topMoodEntry ? topMoodEntry[0] : null,
      busiestMonth: pages.length ? monthNames[busiestMonthIdx] : null,
      diaryCount: diaries.filter(d => d.pages.some(p => new Date(p.date).getFullYear() === year)).length,
      longestStreak: longestInYear,
    };
  }

  function drawYearReviewImage(year) {
    const stats = computeYearStats(year);
    const W = 1080, H = 1920;
    const canvas = el.yearReviewCanvas;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // dark, celebratory gradient — deliberately different from the parchment share
    // card so this reads as a distinct "wrapped" moment
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#241c3a');
    grad.addColorStop(0.5, '#1b1430');
    grad.addColorStop(1, '#120e22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // soft decorative glow circles
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath(); ctx.arc(W * 0.85, H * 0.12, 220, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a7fd1';
    ctx.beginPath(); ctx.arc(W * 0.1, H * 0.85, 260, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    const padX = 96;
    let y = 220;

    ctx.fillStyle = '#c9bff2';
    ctx.font = '600 32px Inter, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${stats.year} · YEAR IN REVIEW`, padX, y);
    y += 100;

    ctx.fillStyle = '#f6efe0';
    ctx.font = '600 82px Fraunces, Georgia, serif';
    ctx.fillText(`${stats.totalEntries}`, padX, y);
    y += 60;
    ctx.font = '500 34px Inter, sans-serif';
    ctx.fillStyle = '#c9bff2';
    ctx.fillText(stats.totalEntries === 1 ? 'entry written' : 'entries written', padX, y);
    y += 140;

    const statRows = [
      [`${stats.daysWritten}`, 'days you showed up'],
      [`${stats.totalWords.toLocaleString('en-IN')}`, 'words written'],
      [`${stats.longestStreak}`, 'day longest streak'],
    ];
    if (stats.busiestMonth) statRows.push([stats.busiestMonth, 'was your busiest month']);
    if (stats.topMood) statRows.push([stats.topMood, 'was your most-logged mood']);

    statRows.forEach(([big, small]) => {
      ctx.fillStyle = '#f6efe0';
      ctx.font = '600 56px Fraunces, Georgia, serif';
      ctx.fillText(big, padX, y);
      y += 46;
      ctx.fillStyle = '#a99edb';
      ctx.font = '500 28px Inter, sans-serif';
      ctx.fillText(small, padX, y);
      y += 76;
    });

    ctx.font = '500 26px Inter, sans-serif';
    ctx.fillStyle = '#a99edb';
    ctx.fillText('made with Voice Diary', padX, H - 100);
  }

  function openYearReviewSheet() {
    const year = new Date().getFullYear();
    el.yearReviewTitle.textContent = `Your ${year} in Review`;
    drawYearReviewImage(year);
    el.yearReviewSheetBackdrop.hidden = false;
    el.yearReviewSheet.hidden = false;
    requestAnimationFrame(() => {
      el.yearReviewSheetBackdrop.classList.add('show');
      el.yearReviewSheet.classList.add('show');
    });
  }

  function closeYearReviewSheet() {
    el.yearReviewSheetBackdrop.classList.remove('show');
    el.yearReviewSheet.classList.remove('show');
    setTimeout(() => { el.yearReviewSheetBackdrop.hidden = true; el.yearReviewSheet.hidden = true; }, 350);
  }

  function shareYearReviewNow() {
    el.yearReviewCanvas.toBlob(async (blob) => {
      if (!blob) { showToast("Couldn't generate the image."); return; }
      const file = new File([blob], 'voice-diary-year-in-review.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'My Year in Review' });
        } catch (err) {
          if (err && err.name !== 'AbortError') showToast("Couldn't share the image.");
        }
      } else {
        downloadYearReviewImage(blob);
        showToast('Image downloaded — share it from your gallery');
      }
    }, 'image/png');
  }

  function downloadYearReviewImage(blob) {
    const doDownload = (b) => {
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'voice-diary-year-in-review.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    if (blob) { doDownload(blob); return; }
    el.yearReviewCanvas.toBlob(b => { if (b) doDownload(b); else showToast("Couldn't generate the image."); }, 'image/png');
  }

  // ============ HISTORY SCREEN ============

  function openHistoryScreen() {
    renderDiaryListSkeleton();
    el.searchInput.value = '';
    el.searchResults.hidden = true;
    el.diaryList.hidden = false;
    if (el.bookmarksList) el.bookmarksList.hidden = true;
    if (el.bookmarksFilterChip) el.bookmarksFilterChip.classList.remove('active');
    showScreen('history');
    setTimeout(renderDiaryList, 220);
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

  function renderDiaryListSkeleton() {
    el.diaryList.innerHTML = Array.from({ length: 4 }).map(() => `
      <div class="diary-card skeleton-card">
        <div class="skeleton-shimmer"></div>
      </div>
    `).join('');
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
    const badges = computeBadges();
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

    // gentle nudge, shown first, if 2+ days have passed since the last entry
    const nudge = buildReminderMessage();
    if (nudge.startsWith("It's been")) items.push(`💌 ${nudge}`);

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
    renderStreakFreezeCard();
    renderRecapCard();
    renderWeeklyGoalCard();

    // chart skeleton first, so the bars don't just pop in with no transition on
    // slower devices while the rest of the screen's numbers are being computed
    el.insightsChart.innerHTML = Array.from({ length: 7 }).map(() =>
      `<div class="chart-bar-wrap"><div class="chart-bar skeleton-bar"></div><span class="chart-bar-label"></span></div>`
    ).join('');

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
    setTimeout(() => {
      el.insightsChart.innerHTML = counts.map((c, i) => {
        const isToday = i === now.getDay();
        const h = c === 0 ? 4 : Math.round((c / max) * 52) + 6;
        return `<div class="chart-bar-wrap"><div class="chart-bar${c > 0 ? ' active' : ''}" style="height:${h}px"></div><span class="chart-bar-label">${'SMTWTFS'[i]}${isToday ? '•' : ''}</span></div>`;
      }).join('');
    }, 220);

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

    renderWordCloud();
    renderLengthTrend();

    showScreen('insights');
  }

  // ---------- word cloud (Insights) ----------
  const WORD_CLOUD_STOPWORDS = new Set([
    'the','a','an','and','or','but','is','are','was','were','be','been','being','to','of','in','on','at','for',
    'with','about','as','it','its','this','that','these','those','i','me','my','myself','we','our','ours',
    'you','your','yours','he','him','his','she','her','hers','they','them','their','so','if','than','then',
    'just','not','no','do','does','did','have','has','had','will','would','can','could','should','from',
    'by','up','out','all','also','very','too','into','over','again','because','when','while','how','what',
    'there','here','some','any','more','most','such','only','own','same','both','each','few','which','who',
    'whom','am','been','being','get','got','one','two','still','really','much','many'
  ]);

  function renderWordCloud() {
    if (!el.wordCloud) return;
    const counts = {};
    diaries.forEach(d => d.pages.forEach(p => {
      const words = (p.text || '').toLowerCase().match(/[a-z']+/g) || [];
      words.forEach(w => {
        if (w.length < 4 || WORD_CLOUD_STOPWORDS.has(w)) return;
        counts[w] = (counts[w] || 0) + 1;
      });
    }));
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 18);
    if (!entries.length) {
      el.wordCloud.innerHTML = '<p class="empty-note">Write a few entries and your favourite words will show up here.</p>';
      return;
    }
    const maxCount = entries[0][1];
    el.wordCloud.innerHTML = entries.map(([word, count]) => {
      const scale = 12 + Math.round((count / maxCount) * 20); // 12px..32px
      return `<span class="word-cloud-item" style="font-size:${scale}px">${escapeHtml(word)}</span>`;
    }).join('');
  }

  // ---------- entry length trend (Insights) ----------
  function renderLengthTrend() {
    if (!el.lengthTrendChart) return;
    const allPages = [];
    diaries.forEach(d => d.pages.forEach(p => allPages.push(p)));
    allPages.sort((a, b) => new Date(a.date) - new Date(b.date));
    const last = allPages.slice(-10);
    if (!last.length) {
      el.lengthTrendChart.innerHTML = '<p class="empty-note">No entries yet.</p>';
      return;
    }
    const wordCounts = last.map(p => (p.text || '').trim().split(/\s+/).filter(Boolean).length);
    const max = Math.max(...wordCounts, 1);
    el.lengthTrendChart.innerHTML = last.map((p, i) => {
      const h = wordCounts[i] === 0 ? 4 : Math.round((wordCounts[i] / max) * 52) + 6;
      const d = new Date(p.date);
      const label = (d.getMonth() + 1) + '/' + d.getDate();
      return `<div class="chart-bar-wrap"><div class="chart-bar${wordCounts[i] > 0 ? ' active' : ''}" style="height:${h}px" title="${wordCounts[i]} words"></div><span class="chart-bar-label">${label}</span></div>`;
    }).join('');
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

  // Picks a smarter reminder message based on how many days have passed since the
  // last entry. A plain daily nudge most days, but a warmer "gentle nudge" once 2+
  // days have been missed, so the message actually reflects what's going on instead
  // of always saying the same generic line.
  function buildReminderMessage() {
    const dateSet = getAllDatesWithEntries();
    const today = new Date();
    let daysSinceLastEntry = null;
    for (let i = 0; i < 400; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      if (dateSet.has(d.toDateString())) { daysSinceLastEntry = i; break; }
    }
    if (daysSinceLastEntry === null) return "Time to write today's page.";
    if (daysSinceLastEntry === 0) return "Add one more line before the day ends?";
    if (daysSinceLastEntry === 1) return "Yesterday's missing a page — pick it back up today?";
    if (daysSinceLastEntry >= 2) return `It's been ${daysSinceLastEntry} days since your last entry. No pressure — even a line or two keeps the thread going.`;
    return "Time to write today's page.";
  }

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
          new Notification('Voice Diary', { body: buildReminderMessage() });
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

    if (el.recapTabs) {
      el.recapTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.recap-tab');
        if (!btn) return;
        currentRecapRange = btn.dataset.range;
        el.recapTabs.querySelectorAll('.recap-tab').forEach(t => t.classList.toggle('active', t === btn));
        renderRecapCard();
      });
    }
    if (el.weeklyGoalEditBtn) el.weeklyGoalEditBtn.addEventListener('click', promptEditWeeklyGoal);
    if (el.yearReviewBtn) el.yearReviewBtn.addEventListener('click', openYearReviewSheet);
    if (el.yearReviewSheetBackdrop) el.yearReviewSheetBackdrop.addEventListener('click', closeYearReviewSheet);
    if (el.yearReviewSendBtn) el.yearReviewSendBtn.addEventListener('click', shareYearReviewNow);
    if (el.yearReviewDownloadBtn) el.yearReviewDownloadBtn.addEventListener('click', () => downloadYearReviewImage(null));

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
    if (el.exportDiaryPdfBtn) {
      el.exportDiaryPdfBtn.addEventListener('click', () => {
        const diary = currentDiary();
        if (diary) exportDiaryAsPdf(diary);
        closeCoverSheet();
      });
    }
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
    if (el.moodSuggestHint) {
      el.moodSuggestHint.addEventListener('click', () => {
        if (el.moodSuggestValue && el.moodSuggestValue.textContent) {
          const emoji = el.moodSuggestValue.textContent.trim().split(' ').pop();
          if (emoji) selectMood(emoji);
        }
      });
    }

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

    if (el.fsCapsuleBtn) el.fsCapsuleBtn.addEventListener('click', openCapsuleSheet);
    if (el.capsuleSheetBackdrop) el.capsuleSheetBackdrop.addEventListener('click', closeCapsuleSheet);
    if (el.capsuleSealBtn) el.capsuleSealBtn.addEventListener('click', sealCapsule);
    if (el.capsuleRemoveBtn) el.capsuleRemoveBtn.addEventListener('click', removeCapsule);
    if (el.capsuleUnlockEarlyBtn) el.capsuleUnlockEarlyBtn.addEventListener('click', unlockCapsuleEarly);

    if (el.fsShareImgBtn) el.fsShareImgBtn.addEventListener('click', openShareImgSheet);
    if (el.shareImgSheetBackdrop) el.shareImgSheetBackdrop.addEventListener('click', closeShareImgSheet);
    if (el.shareImgSendBtn) el.shareImgSendBtn.addEventListener('click', shareImageNow);
    if (el.shareImgDownloadBtn) el.shareImgDownloadBtn.addEventListener('click', () => downloadShareImage(null));
    if (el.shareImgFormatRow) {
      el.shareImgFormatRow.querySelectorAll('.share-format-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          shareImgFormat = chip.dataset.format;
          el.shareImgFormatRow.querySelectorAll('.share-format-chip').forEach(c => c.classList.toggle('active', c === chip));
          drawShareImage();
        });
      });
    }

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
    if (el.exportAllPdfBtn) el.exportAllPdfBtn.addEventListener('click', exportAllDiariesAsPdf);

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

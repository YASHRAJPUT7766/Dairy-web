# Voice Diary — New Features (July 2026 build)

Everything below runs **fully on-device** — no server, no API key, no data leaving
the phone. All computation is plain JS over your existing localStorage data.

## This update (3 requested features)

**1. Offline screen**
When the connection drops, a full-screen "You're offline" state appears with a
pulsing cloud/pen animation and two actions: **Try again** (re-checks the
connection) and **Read my diaries offline** (dismisses the screen — all your
existing entries are stored in localStorage, so reading works with zero
network). While offline, writing is paused: new pages, new diaries, text
editing, and voice recording are all blocked with a toast explaining why,
and the headline/body text areas are visibly dimmed and un-editable. A slim
banner at the top of the app also shows if the connection drops while you're
already using it (not just at launch).

*Honest limitation:* this only works once the app has been opened at least
once with a connection (so the HTML/CSS/JS are already loaded in that
browser tab/session). A completely cold start — first-ever visit, zero
connection — needs a service worker to cache the app shell for true
installable-offline support, which this app doesn't have (an earlier
version had one but it caused stale-cache bugs and was removed). Happy to
add a proper service worker back in, carefully this time, if you want real
"works even on first launch with no internet" behaviour — that's a bigger,
separate piece of work.

**2. Skeleton loading**
The Home diary grid, the History diary list, and the Insights weekly chart
now show a brief pulsing skeleton placeholder the instant you open them,
which then swaps to the real content. Since this app's data comes from
localStorage (no network wait), the actual computation is fast — the
skeleton mainly smooths out the transition on slower/low-end phones so you
never see a blank flash while a long list of diaries renders.

**3. Redesigned settings/profile buttons**
Every plain colored-text button (Export, Backup, Restore, Clear all data,
Rate this app, Send feedback, Share app, Edit name & photo, Open settings,
All diaries, Share my stats, Year in Review, Change photo, Remove photo) is
now a proper card-style row button: icon, title, short subtitle where
useful, and a chevron — matching the rest of the app's design instead of
looking like a bare link. Destructive actions (Clear all data, Remove
photo) get a red-tinted variant so they're visually distinct before you tap.

---

## From the previous update


**Smart Search** (Insights not required — search bar on History screen)
Not true semantic search (that needs an embeddings model this app doesn't ship),
but a practical stand-in: typing "job" also matches entries mentioning
"interview", "boss", "resign" etc. via topic keyword groups. You can also search
by mood name ("khush", "sad"). Results are ranked, not just filtered.

**Mood tagging, upgraded**
The old waveform-only guess now also reads the entry's text for mood keywords
(English + common Hinglish words) and combines both signals. Shown with a
confidence hint ("not sure") when the two signals disagree. Always just a
pre-fill — you confirm or change it.

**Weekly/Monthly Recap** ("is week/month kaisa raha") — Insights screen
Rule-based, not AI-generated: picks your most logged mood, your best day, your
longest entry, total words, and days written, and stitches them into a
readable recap. Tabs for This Week / This Month.

**Smarter reminders**
The daily reminder notification (and the in-app notification feed) now checks
how long it's been since your last entry and adjusts its message — a plain nudge
most days, a warmer "it's been 2+ days" message when you've actually missed a
stretch, instead of always the same line.

**On This Day, extended**
Still shows an exact-date memory from a past year when one exists. When it
doesn't, it now falls back to any entry from the same month in a past year, so
the flashback card has something most of the month, not just on one exact date.

**Streak freeze nudge**
The existing streak-freeze card now proactively says "aaj mat bhoolna" when
you have an active streak and haven't written today yet.

**Mood streak badges**
New badges for 3-day and 5-day runs of logging a positive mood, alongside the
existing page-count and day-streak badges. Same badge list shown on Home and
Profile now (previously slightly out of sync).

**Weekly goal with progress ring** — Insights screen
Pick how many days a week you want to write (default 4); a ring fills in as
you log days this week.

**PDF export**
Both single-diary and export-all now offer a proper diary-styled PDF (headline,
date, mood, body, page breaks) alongside the existing text/JSON export. Uses
jsPDF loaded from CDN — needs network on first load.

**Dynamic cover tint**
A diary's cover now gets a very subtle color wash based on its most recent
logged mood (happy → warm gold, sad → soft blue, etc.), layered on top of
whichever cover theme you've picked. Purely decorative.

**Font & sticker unlocks**
Two new handwriting-style fonts (Inkwell, Apple) unlock at 7-day and 30-day
streaks. Two existing stickers (moon, sun) are now held back as 14-day/21-day
streak rewards — everything else stays freely available as before.

**Year in Review** — Insights screen, "See your Year in Review"
A Spotify-Wrapped-style shareable stats card: total entries, days written,
words written, longest streak, busiest month, most-logged mood. Share or
download as an image.

**Home glance widget**
A compact streak / latest mood / weekly-goal card at the top of Home for a
quick glance. Note: this is *not* a real OS home-screen widget — a proper
widget needs a native app wrapper (see below), which a web app can't do.

**Voice playback filter**
A small button on each voice clip cycles Original → Calm → Energetic. This is
real Web Audio DSP applied at playback time (slight tempo change + a
high-shelf EQ tilt) — the original recording is never modified.

**Hindi/English mixed transcription**
Added a "Hindi/English mixed" language option. Practically, this runs the
English (India) recognizer, which tends to romanize mixed speech reasonably —
see the honest limitation below.

---

## Needs a backend / AI API — not built (by your choice, scoped out for now)

These need a server and a real model call, which a static localStorage app
can't do on its own:

1. **True AI weekly/monthly summary** — going beyond the rule-based recap to
   an actually-written paragraph needs an LLM call (e.g. Claude API) with the
   week's entries as context.
2. **Real Hindi/Hinglish transcription** — the browser's built-in speech
   recognition has no genuine code-switching mode. A proper fix needs a
   cloud ASR model (e.g. a Whisper-class or Indic-language model) called from
   a backend, with audio uploaded for transcription.
3. **Collaborative/shared diary** (couple/family mode) — needs a sync backend
   (auth, a shared data store, conflict resolution) since this app currently
   has no server or accounts at all.

**Suggested next step:** a small backend (even a lightweight serverless
function) that (a) accepts a week's entries and calls the Claude API for a
real summary, (b) accepts an audio blob and calls a speech-to-text API for
transcription, and (c) later, adds accounts + a shared datastore for
collaborative diaries. Happy to help scope or build this next — just say the
word.

/* ============================================
   CONFIG
   ============================================
   Voice notes are transcribed using the browser's built-in speech
   recognition (the same engine Chrome uses for voice typing). No API key
   needed — it works out of the box.

   Change SPEECH_LANG below if you want recognition in a different
   language/accent. A few common options:
     'en-IN' — English (India)
     'en-US' — English (US)
     'hi-IN' — Hindi (India)

   USER_NAME is only the very first default shown before anyone edits
   their profile. Once a name/photo is set from Profile → Edit name &
   photo, that choice is saved on the device and used everywhere instead
   (Home greeting, Profile, Settings) — this constant is then ignored.
   ============================================ */

const CONFIG = {
  SPEECH_LANG: 'en-IN',
  USER_NAME: 'Yash',
};

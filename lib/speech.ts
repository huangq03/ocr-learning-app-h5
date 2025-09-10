// lib/speech.ts

/**
 * Speaks the given text using the browser's Web Speech API (Text-to-Speech).
 * @param text The string to be spoken.
 * @param lang The language code (e.g., 'en-US').
 */
export const speakText = (text: string, lang: string) => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
    return;
  }

  // Cancel any ongoing speech to prevent overlap, then speak the new utterance.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  
  // Optional: Find and set a specific voice for the given language for better quality.
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang === lang);
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
};
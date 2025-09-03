
// lib/speech.ts

export const speakText = (text: string, lang: string) => {
  if (!text) return;

  const isSingleWord = !text.includes(' ');

  if (isSingleWord && lang.startsWith('en')) {
    const baseUrl = process.env.NEXT_PUBLIC_AUDIO_BASE_URL;
    const audioFile = `${text.toLowerCase()}1.mp3`;
    const audioUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/${audioFile}` : `/${audioFile}`;
    const audio = new Audio(audioUrl);

    audio.onerror = () => {
      // Fallback to speechSynthesis
      speakWithSpeechSynthesis(text, lang);
    };

    audio.play().catch(() => {
      // Fallback to speechSynthesis if play() is rejected
      speakWithSpeechSynthesis(text, lang);
    });
  } else {
    // Use speechSynthesis for phrases, sentences, or non-English text
    speakWithSpeechSynthesis(text, lang);
  }
};

const speakWithSpeechSynthesis = (text: string, lang: string) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang === lang);
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
};

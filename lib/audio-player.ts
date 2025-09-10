import { speakText } from './speech';

interface PlayableItem {
    content: string;
    name?: string; // The 'name' from the words table, which is the canonical word
    us_pronunciation?: string;
    en_pronunciation?: string;
}

function playAudioUrl(url: string) {
    const baseUrl = process.env.NEXT_PUBLIC_AUDIO_BASE_URL || '';
    if (url) {
        new Audio(baseUrl + url).play();
    }
}

/**
 * Plays the best available audio for a given item.
 * It prioritizes US pronunciation, then UK pronunciation, then falls back to Text-to-Speech.
 * @param item An object containing content and optional pronunciation URLs.
 */
export function playAudio(item: PlayableItem) {
    if (item.us_pronunciation) {
        playAudioUrl(item.us_pronunciation);
    } else if (item.en_pronunciation) {
        playAudioUrl(item.en_pronunciation);
    } else {
        const textToSpeak = item.name || item.content;
        if (textToSpeak) {
            speakText(textToSpeak, 'en');
        }
    }
}

/**
 * Plays a specific audio pronunciation type for an item.
 * @param item The item to play.
 * @param type The pronunciation type ('us' or 'en').
 */
export function playPronunciation(item: PlayableItem, type: 'us' | 'en') {
    if (type === 'us' && item.us_pronunciation) {
        playAudioUrl(item.us_pronunciation);
    } else if (type === 'en' && item.en_pronunciation) {
        playAudioUrl(item.en_pronunciation);
    }
}
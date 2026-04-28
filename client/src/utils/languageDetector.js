/**
 * Detects language from text based on Unicode script detection
 * Returns language code: 'hi' for Hindi, 'en' for English
 */
export function detectLanguage(text) {
    if (!text || text.trim().length === 0) return 'en';

    // Devanagari script range (Hindi)
    const devanagariRegex = /[\u0900-\u097F]/g;
    // English/Latin alphabet
    const latinRegex = /[a-zA-Z]/g;

    const devanagariMatches = (text.match(devanagariRegex) || []).length;
    const latinMatches = (text.match(latinRegex) || []).length;

    // If text has Devanagari characters, it's likely Hindi
    if (devanagariMatches > 0) {
        return 'hi';
    }

    // If text has Latin characters, it's likely English
    if (latinMatches > 0) {
        return 'en';
    }

    // Default to English
    return 'en';
}

/**
 * Maps detected language to appropriate voice
 * Prefers female voices by default
 */
export function getVoiceForLanguage(language, voiceMap) {
    const voiceEntries = Object.entries(voiceMap);

    if (language === 'hi') {
        // Find Hindi voices
        const hindiVoices = voiceEntries.filter(([name]) => name.toLowerCase().includes('hindi'));
        // Prefer female (Swara) over male
        const femaleVoice = hindiVoices.find(([name]) => name.toLowerCase().includes('female'));
        return femaleVoice ? femaleVoice[0] : hindiVoices[0]?.[0];
    }

    if (language === 'en') {
        // Find English voices
        const englishVoices = voiceEntries.filter(([name]) => name.toLowerCase().includes('english'));
        // Prefer female voices
        const femaleVoice = englishVoices.find(([name]) =>
            name.toLowerCase().includes('female') ||
            name.toLowerCase().includes('jenny') ||
            name.toLowerCase().includes('sonia')
        );
        return femaleVoice ? femaleVoice[0] : englishVoices[0]?.[0];
    }

    // Default to first available voice
    return voiceEntries[1]?.[0]; // Skip 'Hindi (Google)' browser voice
}

export default { detectLanguage, getVoiceForLanguage };

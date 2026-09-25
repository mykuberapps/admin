export const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  'en': 'English',
  'hi': 'Hindi',
  'ta': 'Tamil',
  'bn': 'Bengali',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'ja': 'Japanese',
  'ko': 'Korean',
  'te': 'Telugu',
  'mr': 'Marathi',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'pa': 'Punjabi',
  'gu': 'Gujarati',
  'ar': 'Arabic',
  'ru': 'Russian',
  'pt': 'Portuguese',
  'it': 'Italian',
  'zh': 'Chinese',
  'und': 'Original Audio',
};

/**
 * Gets the display name for an ISO 639-1 code.
 */
export function getLanguageName(code: string | undefined): string {
  if (!code) return 'Unknown';
  const clean = code.toLowerCase().trim();
  return LANGUAGE_DISPLAY_NAMES[clean] || code.toUpperCase();
}

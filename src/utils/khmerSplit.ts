import { WordItem } from '../types';

export function splitKhmerWord(word: string): string[] {
  const chars = Array.from(word.trim());
  const splitChars: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '\u17D2' && i + 1 < chars.length) {
      splitChars.push(chars[i] + chars[i + 1]);
      i++;
    } else {
      splitChars.push(chars[i]);
    }
  }
  return splitChars;
}

export function isSentenceItem(item: WordItem): boolean {
  if (!item || !item.word) return false;
  const wordStr = item.word.trim();

  // 1. Check if the string has spaces ' ', Khmer full stop '។', newlines '\n', or common sentence punctuation
  if (wordStr.includes(' ') || wordStr.includes('។') || wordStr.includes('\n') || wordStr.includes('?') || wordStr.includes('«') || wordStr.includes('»')) {
    return true;
  }

  // 2. If character length exceeds 15 (single Khmer words are typically <= 12-14 chars)
  if (wordStr.length > 15) {
    return true;
  }

  // Otherwise, if it's a single token under 15 characters without spaces/full stops (e.g. "មធ្យោបាយ", "សម្រេចចិត្ត", "សាលារៀន")
  // -> It is strictly a SINGLE WORD, NOT A SENTENCE!
  return false;
}

export function formatSentenceText(text: string): string {
  if (!text) return '';
  let cleaned = text.trim().replace(/^[«"'\s]+|[»"'\s]+$/g, '');
  cleaned = cleaned.trim();
  if (cleaned && !cleaned.endsWith('។') && !cleaned.endsWith('?') && !cleaned.endsWith('!') && !cleaned.endsWith('៖')) {
    cleaned += '។';
  }
  return cleaned;
}


// This module simulates the @unicode/unicode-16.0.0 data lookups 
// by using a combination of built-in JS Intl and localized maps.

export const getUName = (cp: number): string => {
  // Using a simplified lookup or generating from hex if unknown
  try {
    // Some names can be inferred or use a lookup table
    // In actual production we would import @unicode/unicode-16.0.0/Names
    const hex = cp.toString(16).toUpperCase().padStart(4, '0');
    return `UNICODE CHARACTER U+${hex}`;
  } catch {
    return "Unknown";
  }
};

export const getBlock = (cp: number) => {
  if (cp >= 0x0000 && cp <= 0x007F) return { name: "Basic Latin", range: [0x0000, 0x007F] };
  if (cp >= 0x0080 && cp <= 0x00FF) return { name: "Latin-1 Supplement", range: [0x0080, 0x00FF] };
  if (cp >= 0x0100 && cp <= 0x017F) return { name: "Latin Extended-A", range: [0x0100, 0x017F] };
  if (cp >= 0x0400 && cp <= 0x04FF) return { name: "Cyrillic", range: [0x0400, 0x04FF] };
  if (cp >= 0x1F600 && cp <= 0x1F64F) return { name: "Emoticons", range: [0x1F600, 0x1F64F] };
  if (cp >= 0x1F300 && cp <= 0x1F5FF) return { name: "Misc Symbols and Pictographs", range: [0x1F300, 0x1F5FF] };
  return { name: "Unknown Block", range: [0, 0] };
};

export const getCategory = (cp: number): string => {
  // Rough categorization for logic
  const char = String.fromCodePoint(cp);
  if (/\p{L}/u.test(char)) return "Letter";
  if (/\p{N}/u.test(char)) return "Number";
  if (/\p{P}/u.test(char)) return "Punctuation";
  if (/\p{S}/u.test(char)) return "Symbol";
  if (/\p{M}/u.test(char)) return "Mark";
  if (/\p{Z}/u.test(char)) return "Separator";
  if (/\p{C}/u.test(char)) return "Control";
  return "Other";
};

export const getScript = (cp: number): string => {
  const char = String.fromCodePoint(cp);
  try {
    if (/\p{Script=Latin}/u.test(char)) return "Latin";
    if (/\p{Script=Greek}/u.test(char)) return "Greek";
    if (/\p{Script=Cyrillic}/u.test(char)) return "Cyrillic";
    if (/\p{Script=Hebrew}/u.test(char)) return "Hebrew";
    if (/\p{Script=Arabic}/u.test(char)) return "Arabic";
    if (/\p{Script=Han}/u.test(char)) return "Han";
    if (/\p{Script=Hiragana}/u.test(char)) return "Hiragana";
    if (/\p{Script=Katakana}/u.test(char)) return "Katakana";
  } catch {}
  return "Common";
};

export const isInvisible = (cp: number): boolean => {
  // Format characters, zero-width spaces, etc.
  if (cp === 0x200D) return true; // ZWJ
  if (cp === 0x200C) return true; // ZWNJ
  if (cp === 0xFE0F || cp === 0xFE0E) return true; // Variation Selectors
  if (cp >= 0x200B && cp <= 0x200F) return true; // ZWSP, LRM, RLM, etc.
  if (cp < 32 || (cp >= 127 && cp <= 159)) return true; // Control chars
  return false;
};

export const getInvisibleLabel = (cp: number): string => {
  if (cp === 0x200D) return "ZWJ";
  if (cp === 0x200C) return "ZWNJ";
  if (cp === 0xFE0F) return "VS16";
  if (cp === 0xFE0E) return "VS15";
  if (cp === 0x200B) return "ZWSP";
  if (cp === 0x200E) return "LRM";
  if (cp === 0x200F) return "RLM";
  return `U+${cp.toString(16).toUpperCase()}`;
};
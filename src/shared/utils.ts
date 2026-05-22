import { CodePointDetail, GraphemeData } from './types';
import * as unicode from './unicodeData';

export const segmentString = (input: string): GraphemeData[] => {
  const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
  const segments = Array.from(segmenter.segment(input)) as any[];
  
  return segments.map((s, i) => {
    const segmentText = s.segment as string;
    const codePoints: CodePointDetail[] = Array.from(segmentText).map((char) => {
      const charStr = char as string;
      const cp = charStr.codePointAt(0)!;
      return {
        value: cp,
        hex: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
        char: charStr,
        name: unicode.getUName(cp),
        block: unicode.getBlock(cp).name,
        script: unicode.getScript(cp),
        category: unicode.getCategory(cp),
        bidiClass: "Neutral",
        isInvisible: unicode.isInvisible(cp)
      };
    });
    
    return {
      text: segmentText,
      codePoints,
      index: i
    };
  });
};

export const parseCodePointInput = (input: string): string => {
  const clean = input.trim().replace(/^U\+/i, '').replace(/^0x/i, '').replace(/^\\u\{?|\}$/g, '');
  const val = parseInt(clean, 16);
  if (!isNaN(val)) return String.fromCodePoint(val);
  
  const decVal = parseInt(input, 10);
  if (!isNaN(decVal) && input.match(/^\d+$/)) return String.fromCodePoint(decVal);
  
  return "";
};

export const detectDelimiter = (text: string, filename?: string): string => {
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'tsv') return '\t';
    if (ext === 'csv') return ',';
  }
  const firstLine = text.split('\n')[0];
  return firstLine.includes('\t') ? '\t' : ',';
};

// RFC 4180-style CSV line parser. Respects quoted fields so that delimiters
// inside quotes (e.g. `"iPhone14,3"` in a comma-delimited row) do not split
// the field. Supports `""` as an escaped quote inside a quoted field.
//
// Limitation: this function operates on one already-extracted line. CSV
// fields containing literal newlines inside quotes are not supported -- the
// caller is expected to split the source text by newline first. Game
// telemetry exports are one-event-per-line, so this is fine in practice.
export const parseCsvLine = (line: string, delimiter: string): string[] => {
  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"' && cur.length === 0) {
      inQuotes = true;
    } else if (ch === delimiter) {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
};

export const toUTF8Hex = (str: string): string => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
};

export const toUTF16Hex = (str: string): string => {
  const hexes = [];
  for (let i = 0; i < str.length; i++) {
    hexes.push(str.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'));
  }
  return hexes.join(' ');
};
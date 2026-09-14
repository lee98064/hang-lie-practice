import generated from './array30.generated.json'
import type { GeneratedData } from '../types'

export const arrayData = generated as GeneratedData
export const characterEntries = arrayData.characters
export const characterByGlyph = new Map(characterEntries.map((entry) => [entry.char, entry]))

const UNIFIED_IDEOGRAPH_RANGES = [
  [0x3400, 0x4dbf],
  [0x4e00, 0x9fff],
  [0x20000, 0x2a6df],
  [0x2a700, 0x2b73f],
  [0x2b740, 0x2b81f],
  [0x2b820, 0x2ceaf],
  [0x2ceb0, 0x2ebef],
  [0x2ebf0, 0x2ee5f],
  [0x30000, 0x3134f],
  [0x31350, 0x323af],
  [0x323b0, 0x3347f],
] as const

export function isCjkCharacter(char: string): boolean {
  const codePoint = Array.from(char)[0]?.codePointAt(0)
  return codePoint !== undefined
    && UNIFIED_IDEOGRAPH_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end)
}

export function isArrayLookupCharacter(char: string): boolean {
  return char === '〇' || isCjkCharacter(char)
}

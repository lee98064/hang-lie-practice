import generated from './array30.generated.json'
import type { GeneratedData } from '../types'

export const arrayData = generated as GeneratedData
export const characterEntries = arrayData.characters
export const characterByGlyph = new Map(characterEntries.map((entry) => [entry.char, entry]))

export function isCjkCharacter(char: string): boolean {
  return /[\u3400-\u9fff\uf900-\ufaff]/u.test(char)
}

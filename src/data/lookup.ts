import manifest from './lookup-manifest.generated.json'
import type { CharacterEntry } from '../types'
import { characterByGlyph } from './index'

type LookupTuple = [
  fullCodes: string[],
  quickCodes: string[],
  specialCodes: string[],
  tier: number,
]

type LookupChunk = Record<string, LookupTuple>

export const lookupManifest = manifest

const chunkPromises = new Map<string, Promise<LookupChunk>>()

export function getLookupChunkKey(char: string): string | undefined {
  const codePoint = Array.from(char)[0]?.codePointAt(0)
  return codePoint === undefined ? undefined : Math.floor(codePoint / 0x1000).toString(16)
}

async function loadChunk(key: string): Promise<LookupChunk | undefined> {
  if (!(key in lookupManifest.chunks)) return undefined

  let promise = chunkPromises.get(key)
  if (!promise) {
    const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
    promise = fetch(`${base}data/lookup/u${key}.json`).then(async (response) => {
      if (!response.ok) throw new Error(`字碼分塊 u${key} 載入失敗（${response.status}）`)
      return await response.json() as LookupChunk
    })
    chunkPromises.set(key, promise)
  }

  try {
    return await promise
  } catch (error) {
    chunkPromises.delete(key)
    throw error
  }
}

export async function lookupCharacter(char: string): Promise<CharacterEntry | undefined> {
  const glyph = Array.from(char)[0]
  if (!glyph) return undefined

  const curriculumEntry = characterByGlyph.get(glyph)
  if (curriculumEntry) return curriculumEntry

  const key = getLookupChunkKey(glyph)
  if (!key) return undefined
  const tuple = (await loadChunk(key))?.[glyph]
  if (!tuple) return undefined

  return {
    char: glyph,
    fullCodes: tuple[0],
    quickCodes: tuple[1],
    specialCodes: tuple[2],
    tier: tuple[3],
  }
}

export function clearLookupCache(): void {
  chunkPromises.clear()
}

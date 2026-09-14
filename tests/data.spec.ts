import { describe, expect, it, vi } from 'vitest'
import extBChunk from '../public/data/lookup/u28.json'
import { arrayData, characterByGlyph, isArrayLookupCharacter, isCjkCharacter } from '../src/data'
import { ARRAY_KEYS, codeToCoordinates, VALID_CODE_KEYS } from '../src/data/keys'
import { clearLookupCache, lookupCharacter, lookupManifest } from '../src/data/lookup'

describe('行列教材', () => {
  it('包含規劃要求的教材數量', () => {
    expect(arrayData.characters.length).toBeGreaterThanOrEqual(300)
    expect(arrayData.phrases.length).toBeGreaterThanOrEqual(80)
    expect(arrayData.sentences.length).toBeGreaterThanOrEqual(30)
  })

  it('固定官方驗收字碼', () => {
    expect(characterByGlyph.get('行')?.fullCodes).toContain('.aad')
    expect(characterByGlyph.get('列')?.fullCodes).toContain('ame')
    expect(characterByGlyph.get('輸')?.fullCodes).toEqual(expect.arrayContaining(['qiue', 'qiuw']))
    expect(characterByGlyph.get('入')?.fullCodes).toContain('k')
    expect(characterByGlyph.get('法')?.fullCodes).toContain('crx')
  })

  it('不把特別碼混進完整碼', () => {
    expect(characterByGlyph.get('個')?.specialCodes).toContain(';;')
    expect(characterByGlyph.get('個')?.fullCodes).not.toContain(';;')
    expect(characterByGlyph.get('性')?.specialCodes).toContain('nn')
    expect(characterByGlyph.get('性')?.fullCodes).not.toContain('nn')
  })

  it('字根表正好有三列三十鍵且字碼都合法', () => {
    expect(ARRAY_KEYS).toHaveLength(30)
    expect(new Set(ARRAY_KEYS.map(({ key }) => key)).size).toBe(30)
    for (const entry of arrayData.characters) {
      for (const code of entry.fullCodes) {
        expect([...code].every((key) => VALID_CODE_KEYS.has(key))).toBe(true)
      }
    }
  })

  it('把實體鍵轉為行列座標', () => {
    expect(codeToCoordinates('.aad')).toEqual(['9下', '1中', '1中', '3中'])
  })

  it('大字集涵蓋官方 v2026 表與 Unicode 擴充區', () => {
    expect(lookupManifest.entryCount).toBe(101999)
    expect(lookupManifest.unifiedIdeographEntryCount).toBe(101984)
    expect(lookupManifest.supplementaryEntryCount).toBeGreaterThan(74000)
    expect(Object.keys(lookupManifest.chunks)).toHaveLength(28)
    expect(isCjkCharacter('行')).toBe(true)
    expect(isCjkCharacter('𨑨')).toBe(true)
    expect(isCjkCharacter(String.fromCodePoint(0x33479))).toBe(true)
    expect(isCjkCharacter('A')).toBe(false)
    expect(isCjkCharacter('。')).toBe(false)
    expect(isArrayLookupCharacter('〇')).toBe(true)
  })

  it('按 Unicode 區段延遲載入罕見字碼', async () => {
    clearLookupCache()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => extBChunk,
    })
    vi.stubGlobal('fetch', fetchMock)

    try {
      const result = await lookupCharacter('𨑨')
      expect(result?.char).toBe('𨑨')
      expect(result?.fullCodes).toContain('pni')
      expect(fetchMock).toHaveBeenCalledWith('/data/lookup/u28.json')
    } finally {
      clearLookupCache()
      vi.unstubAllGlobals()
    }
  })
})

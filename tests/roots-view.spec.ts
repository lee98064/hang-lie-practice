import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import extBChunk from '../public/data/lookup/u28.json'
import { clearLookupCache } from '../src/data/lookup'
import RootsView from '../src/views/RootsView.vue'

describe('RootsView 查表', () => {
  beforeEach(() => clearLookupCache())
  afterEach(() => {
    clearLookupCache()
    vi.unstubAllGlobals()
  })

  it('載入分塊後顯示補充平面字、Unicode 與完整碼', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => extBChunk }))
    const wrapper = mount(RootsView)

    await wrapper.get('#character-lookup').setValue('abc：𨑨')
    await flushPromises()

    expect(wrapper.get('.lookup-glyph strong').text()).toBe('𨑨')
    expect(wrapper.get('.lookup-glyph small').text()).toBe('U+28468')
    expect(wrapper.get('.lookup-result').text()).toContain('PNI')
  })

  it('分塊回應前顯示明確載入狀態', async () => {
    let resolveFetch!: (value: { ok: boolean, json: () => Promise<object> }) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveFetch = resolve })))
    const wrapper = mount(RootsView)

    await wrapper.get('#character-lookup').setValue('𨑨')
    expect(wrapper.get('.lookup-status').text()).toContain('正在翻查 U+28468')

    resolveFetch({ ok: true, json: async () => extBChunk })
    await flushPromises()
    wrapper.unmount()
  })

  it('區分官方表內查無字與資料載入失敗', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockRejectedValueOnce(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(RootsView)

    await wrapper.get('#character-lookup').setValue('𠀀')
    await flushPromises()
    expect(wrapper.get('.lookup-empty').text()).toContain('大字集中找不到')

    clearLookupCache()
    await wrapper.get('#character-lookup').setValue('𨑨')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('字碼資料未能載入')
    expect(wrapper.get('.lookup-error button').text()).toBe('重新查詢')
  })
})

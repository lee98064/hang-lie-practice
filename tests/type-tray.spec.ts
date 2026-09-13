import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TypeTray from '../src/components/TypeTray.vue'

describe('TypeTray', () => {
  it('呈現三十個可讀取鍵帽並標示下一鍵', async () => {
    const wrapper = mount(TypeTray, { props: { nextKey: 'q' } })
    const keys = wrapper.findAll('.key-grid button')
    expect(keys).toHaveLength(30)
    expect(wrapper.get('button[aria-label^="Q，1上"]').classes()).toContain('next')
    await wrapper.get('button[aria-label^="Q，1上"]').trigger('click')
    expect(wrapper.emitted('key')?.[0]).toEqual(['q'])
  })

  it('速度模式顯示十個候選數字鍵', () => {
    const wrapper = mount(TypeTray, { props: { showNumbers: true } })
    expect(wrapper.findAll('.number-row button')).toHaveLength(10)
  })
})

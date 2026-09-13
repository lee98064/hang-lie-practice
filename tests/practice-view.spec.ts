import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import PracticeView from '../src/views/PracticeView.vue'

function mountPractice() {
  return mount(PracticeView, { global: { plugins: [createPinia()] } })
}

describe('PracticeView', () => {
  it('停頓八秒後只提示下一鍵，不揭露整個答案', async () => {
    vi.useFakeTimers()
    const wrapper = mountPractice()
    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(8000)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.code-cell.filled').exists()).toBe(false)
    expect(wrapper.find('.code-cell.next').exists()).toBe(true)
    expect(wrapper.find('.code-cell.revealed').exists()).toBe(false)
    expect(wrapper.get('.feedback-line').text()).toContain('下一鍵')
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('IME 組字期間不判定，compositionend 後才完成', async () => {
    const wrapper = mountPractice()
    await wrapper.findAll('.course-track button')[2].trigger('click')
    await wrapper.findAll('.mode-switch button')[1].trigger('click')
    const target = wrapper.get('.text-platen strong').text()
    const input = wrapper.get('.ime-input')

    await input.trigger('compositionstart')
    await input.setValue(target)
    expect(wrapper.get('.feedback-line').text()).not.toContain('輸入正確')

    await input.trigger('compositionend')
    expect(wrapper.get('.feedback-line').text()).toContain('輸入正確')
    wrapper.unmount()
  })
})

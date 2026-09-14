import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import PracticeView from '../src/views/PracticeView.vue'

function mountPractice() {
  return mount(PracticeView, { global: { plugins: [createPinia()] } })
}

describe('PracticeView', () => {
  it('在練習工作台顯示完整十種基本筆形', () => {
    const wrapper = mountPractice()

    expect(wrapper.get('.practice-strokes').text()).toContain('十種基本筆形')
    expect(wrapper.findAll('.practice-strokes [role="listitem"]')).toHaveLength(10)
    expect(wrapper.get('.practice-strokes').text()).toContain('1一橫')
    expect(wrapper.get('.practice-strokes').text()).toContain('0口方框')
    wrapper.unmount()
  })

  it('可調整自動提示秒數並保存設定', async () => {
    vi.useFakeTimers()
    const wrapper = mountPractice()
    const select = wrapper.get('[aria-label="自動提示等待時間"]')

    await select.setValue('15')
    vi.advanceTimersByTime(8000)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.code-cell.next').exists()).toBe(false)

    vi.advanceTimersByTime(7000)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.code-cell.next').exists()).toBe(true)
    expect(JSON.parse(localStorage.getItem('array30-trainer:v1')!).settings.autoHintSeconds).toBe(15)
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('選擇僅手動後不會因停頓或答錯顯示答案', async () => {
    vi.useFakeTimers()
    const wrapper = mountPractice()
    await wrapper.get('[aria-label="自動提示等待時間"]').setValue('manual')

    await wrapper.get('.keyboard-capture').trigger('keydown', { key: '1' })
    await wrapper.get('.keyboard-capture').trigger('keydown', { key: '1' })
    vi.advanceTimersByTime(120_000)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.code-cell.next').exists()).toBe(false)
    expect(wrapper.find('.code-cell.revealed').exists()).toBe(false)
    expect(JSON.parse(localStorage.getItem('array30-trainer:v1')!).settings.autoHintSeconds).toBeNull()
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('切回分頁後會自動恢復鍵盤焦點', async () => {
    const wrapper = mount(PracticeView, { global: { plugins: [createPinia()] }, attachTo: document.body })
    const input = wrapper.get('.keyboard-capture').element as HTMLInputElement

    input.blur()
    expect(document.activeElement).not.toBe(input)
    window.dispatchEvent(new Event('focus'))
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(input)
    wrapper.unmount()
  })

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

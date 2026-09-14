import { expect, test } from '@playwright/test'
import { ARRAY_KEYS } from '../src/data/keys'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('初學者可揭曉完整碼並完成一題', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '認識字根' })).toBeVisible()
  await page.getByRole('button', { name: '給我一點提示' }).click()
  await page.getByRole('button', { name: '顯示完整拆碼' }).click()
  await expect(page.locator('.code-cell.revealed')).toHaveCount(1)
  const key = (await page.locator('.code-cell b').first().innerText()).toLowerCase()
  await page.locator('.keyboard-capture').press(key)
  await expect(page.getByText(/排好了/)).toBeVisible()
})

test('拆碼表開關會保存到本機', async ({ page }) => {
  const toggle = page.getByLabel('顯示拆碼表')
  await toggle.uncheck()
  await expect(page.locator('.type-tray')).toHaveCount(0)
  await page.reload()
  await expect(toggle).not.toBeChecked()
})

test('第二次錯鍵會亮起下一鍵且不污染答案', async ({ page }) => {
  const glyph = await page.locator('.glyph-platen strong').innerText()
  const possible = new Set(ARRAY_KEYS.filter(({ roots }) => roots[0] === glyph).map(({ key }) => key))
  const wrongKey = ARRAY_KEYS.find(({ key }) => !possible.has(key))!.key
  const button = page.locator(`.key-grid button[aria-label^="${wrongKey.toUpperCase()}，"]`)
  await button.click()
  await button.click()
  await expect(page.locator('.code-cell.filled')).toHaveCount(0)
  await expect(page.locator('.code-cell.next')).toHaveCount(1)
  await expect(page.locator('.feedback-line')).toContainText('下一鍵')
})

test('系統輸入模式可完成詞句', async ({ page }) => {
  await page.getByRole('button', { name: /詞句實戰/ }).click()
  await page.getByRole('button', { name: '系統輸入' }).click()
  const target = await page.locator('.text-platen strong').innerText()
  await page.locator('.ime-input').fill(target)
  await expect(page.getByText(/輸入正確/)).toBeVisible()
})

test('速度碼明確等待使用者開始', async ({ page }) => {
  await page.getByRole('button', { name: /速度碼/ }).click()
  await expect(page.getByRole('button', { name: '開始 60 秒' })).toBeVisible()
  await page.getByRole('button', { name: '開始 60 秒' }).click()
  await expect(page.getByText('60 秒')).toBeVisible()
})

test('字根表可從本機大字集查到罕見字', async ({ page }) => {
  await page.getByRole('link', { name: '字根表' }).click()
  await page.getByLabel('要查哪個字？').fill('𨑨')

  await expect(page.locator('.lookup-glyph strong')).toHaveText('𨑨')
  await expect(page.locator('.lookup-glyph small')).toHaveText('U+28468')
  await expect(page.locator('.lookup-result')).toContainText('PNI')

  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client)
})

test('手機版沒有水平溢位', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile')
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client)
})

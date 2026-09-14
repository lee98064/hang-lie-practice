import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CIN_URL = 'https://raw.githubusercontent.com/gontera/array30/master/cin2/ar30-big-v2026-1.06-20260801.cin2'
const SPECIAL_URL = 'https://raw.githubusercontent.com/gontera/array30/master/array30_spec/ar30SpecialCodes-V201509.txt'
const OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/array30.generated.json')
const LOOKUP_OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/lookup')
const LOOKUP_MANIFEST_OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/lookup-manifest.generated.json')
const SELECT_KEYS = '1234567890'
const DATA_VERSION = 'v2026-1.06 (2026-08-01)'

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
]

const phrases = [
  '早安', '晚安', '謝謝', '請問', '再見', '今天', '明天', '昨天', '現在', '時間',
  '天氣', '下雨', '晴天', '回家', '上班', '下班', '學習', '練習', '輸入法', '行列輸入',
  '中文打字', '工作順利', '生活日常', '週末愉快', '一路平安', '身體健康', '心情很好', '慢慢來', '專心練習', '熟能生巧',
  '新的開始', '保持節奏', '閱讀文章', '整理資料', '完成任務', '回答問題', '分享想法', '認真思考', '仔細檢查', '注意安全',
  '歡迎回來', '準備好了', '休息一下', '喝杯熱茶', '記得吃飯', '早點睡覺', '出門走走', '搭車回家', '一起加油', '每天進步',
  '電話號碼', '電子郵件', '網路連線', '鍵盤位置', '字根拆碼', '常用文字', '正確答案', '下一個字', '顯示提示', '隱藏字根',
  '開啟設定', '儲存進度', '錯題複習', '速度挑戰', '完成練習', '反應時間', '基本筆形', '行列座標', '繁體中文', '系統輸入',
  '台灣文化', '城市散步', '海邊風景', '山上空氣', '春夏秋冬', '朋友見面', '家人團聚', '平安健康', '自由練習', '持續學習',
  '清楚表達', '快速找到', '輸入正確', '先看字根', '不用著急', '一次一個字', '從頭開始', '掌握方法', '建立習慣', '看著練習',
]

const sentences = [
  '今天從第一個字開始練習。', '看著字根表，慢慢找到正確位置。', '每次打對一個字，就更熟悉一點。',
  '打不出來時，可以先看下一個鍵。', '不用追求速度，先把拆碼看清楚。', '每天練習一小段，進步會更穩定。',
  '窗外正在下雨，記得帶一把傘。', '早上喝一杯水，再開始今天的工作。', '週末有空時，我喜歡到附近散步。',
  '這封信寫得很清楚，也很有禮貌。', '把重要的事情記下來，就不容易忘記。', '回家以前，順路買一些水果和牛奶。',
  '新的鍵位需要時間，手指才會記住。', '遇到錯字先停一下，再重新拆一次。', '熟悉完整碼之後，再挑戰簡碼和特別碼。',
  '鍵盤上的三列，對應字根的上中下位置。', '輸入法是工具，練習的節奏由自己決定。', '完成一回合後，看看哪些字最需要複習。',
  '今天的天氣很好，適合出門走走。', '有問題就提出來，我們一起找答案。', '閱讀讓人安靜，也能帶來新的想法。',
  '專心做好眼前的事，速度自然會提升。', '休息幾分鐘，再回來繼續練習。', '正確比快速重要，穩定比勉強更長久。',
  '我正在學習用行列輸入法打繁體中文。', '看懂行列座標後，字根就比較容易記住。', '錯題會留在本機，下次可以接著複習。',
  '一句一句輸入，感受文字自然連起來。', '不用和別人比較，只要比昨天更熟練。', '完成今天的二十題，就讓手指休息一下。',
]

function isCjk(char) {
  const codePoint = char.codePointAt(0)
  return codePoint !== undefined && UNIFIED_IDEOGRAPH_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end)
}

function parseSections(text) {
  const lines = text.replace(/\r/g, '').split('\n')
  let section = ''
  const quick = []
  const charDefs = []
  for (const line of lines) {
    if (line === '%quick begin') section = 'quick'
    else if (line === '%quick end') section = ''
    else if (line === '%chardef begin') section = 'char'
    else if (line === '%symboldef begin') section = ''
    else if (section && line && !line.startsWith('#') && !line.startsWith('%')) {
      const tab = line.indexOf('\t')
      if (tab < 0) continue
      const code = line.slice(0, tab).trim()
      const value = line.slice(tab + 1).trim()
      if (section === 'quick') quick.push([code, value])
      if (section === 'char') charDefs.push([code, value])
    }
  }
  return { quick, charDefs }
}

function parseSpecial(text) {
  return new Set(
    text.replace(/\r/g, '').split('\n')
      .filter((line) => line && !line.startsWith('#') && line.includes('\t'))
      .map((line) => {
        const [code, char] = line.split('\t')
        return `${code.trim()}\u0000${char.trim()}`
      }),
  )
}

function unique(values) {
  return [...new Set(values)]
}

function normalizeEntry(entry) {
  const fullCodes = unique(entry.fullCodes).sort((a, b) => a.length - b.length || a.localeCompare(b))
  const minLength = Math.min(...fullCodes.map((code) => code.replace(/i$/, '').length))
  return {
    char: entry.char,
    fullCodes,
    quickCodes: unique(entry.quickCodes).sort((a, b) => a.length - b.length || a.localeCompare(b)),
    specialCodes: unique(entry.specialCodes).sort(),
    tier: minLength <= 2 ? 1 : minLength === 3 ? 2 : 3,
  }
}

async function main() {
  const [cinResponse, specialResponse] = await Promise.all([fetch(CIN_URL), fetch(SPECIAL_URL)])
  if (!cinResponse.ok || !specialResponse.ok) throw new Error('無法下載官方行列資料。')
  const cinText = await cinResponse.text()
  const specialText = new TextDecoder('big5').decode(await specialResponse.arrayBuffer())
  const { quick, charDefs } = parseSections(cinText)
  const specialPairs = parseSpecial(specialText)
  const quickPairs = new Set()
  const quickByChar = new Map()

  for (const [code, candidates] of quick) {
    Array.from(candidates).forEach((char, index) => {
      if (char === '□') return
      quickPairs.add(`${code}\u0000${char}`)
      const selectionCode = `${code}${SELECT_KEYS[index] ?? ''}`
      if (selectionCode) quickByChar.set(char, [...(quickByChar.get(char) ?? []), selectionCode])
    })
  }

  const entries = new Map()
  for (const [code, value] of charDefs) {
    const chars = Array.from(value)
    if (chars.length !== 1) continue
    const char = chars[0]
    const pair = `${code}\u0000${char}`
    const entry = entries.get(char) ?? { char, allCodes: [], fullCodes: [], quickCodes: [], specialCodes: [], tier: 3 }
    entry.allCodes.push(code)
    if (specialPairs.has(pair)) entry.specialCodes.push(code)
    else if (!quickPairs.has(pair)) entry.fullCodes.push(code)
    entries.set(char, entry)
  }

  for (const [char, codes] of quickByChar) {
    const entry = entries.get(char)
    if (entry) entry.quickCodes.push(...codes)
  }

  for (const entry of entries.values()) {
    if (!entry.fullCodes.length) {
      const special = new Set(entry.specialCodes)
      entry.fullCodes.push(...entry.allCodes.filter((code) => !special.has(code)))
    }
  }

  const commonChars = []
  for (const [, candidates] of quick) {
    for (const char of Array.from(candidates)) {
      if (char === '□' || !isCjk(char) || commonChars.includes(char)) continue
      if (entries.get(char)?.fullCodes.length) commonChars.push(char)
      if (commonChars.length >= 380) break
    }
    if (commonChars.length >= 380) break
  }

  const requiredChars = Array.from('行列輸入法個性願望')
  const contentChars = unique([...requiredChars, ...phrases.join(''), ...sentences.join('')].filter(isCjk))
  const allEntries = [...entries.values()]
    .filter((entry) => entry.fullCodes.length)
    .map(normalizeEntry)
  const selected = unique([...commonChars, ...contentChars])
    .map((char) => entries.get(char))
    .filter((entry) => entry?.fullCodes.length)
    .map(normalizeEntry)

  const available = new Set(selected.map(({ char }) => char))
  const textIsAvailable = (text) => Array.from(text).filter(isCjk).every((char) => available.has(char))
  const makeTexts = (items, category) => items.filter(textIsAvailable).map((text, index) => ({ id: `${category}-${index + 1}`, text, category }))

  const output = {
    meta: {
      version: DATA_VERSION,
      generatedAt: new Date().toISOString(),
      source: CIN_URL,
      entryCount: selected.length,
    },
    characters: selected,
    phrases: makeTexts(phrases, 'phrase'),
    sentences: makeTexts(sentences, 'sentence'),
  }

  if (output.characters.length < 300 || output.phrases.length < 80 || output.sentences.length < 30) {
    const missing = unique([...phrases.join(''), ...sentences.join('')].filter((char) => isCjk(char) && !available.has(char)))
    console.error(`缺少字碼：${missing.join('')}`)
    throw new Error(`教材不足：${output.characters.length} 字、${output.phrases.length} 詞、${output.sentences.length} 句`)
  }
  await mkdir(dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`)

  const lookupChunks = new Map()
  for (const entry of allEntries) {
    const codePoint = entry.char.codePointAt(0)
    const chunkKey = Math.floor(codePoint / 0x1000).toString(16)
    const chunk = lookupChunks.get(chunkKey) ?? {}
    chunk[entry.char] = [entry.fullCodes, entry.quickCodes, entry.specialCodes, entry.tier]
    lookupChunks.set(chunkKey, chunk)
  }

  await rm(LOOKUP_OUTPUT, { recursive: true, force: true })
  await mkdir(LOOKUP_OUTPUT, { recursive: true })
  const chunkCounts = {}
  for (const [key, chunk] of [...lookupChunks.entries()].sort(([left], [right]) => Number.parseInt(left, 16) - Number.parseInt(right, 16))) {
    const count = Object.keys(chunk).length
    chunkCounts[key] = count
    await writeFile(resolve(LOOKUP_OUTPUT, `u${key}.json`), JSON.stringify(chunk))
  }

  const supplementaryEntryCount = allEntries.filter(({ char }) => char.codePointAt(0) > 0xffff).length
  const unifiedIdeographEntryCount = allEntries.filter(({ char }) => isCjk(char)).length
  const manifest = {
    version: DATA_VERSION,
    generatedAt: output.meta.generatedAt,
    source: CIN_URL,
    entryCount: allEntries.length,
    unifiedIdeographEntryCount,
    supplementaryEntryCount,
    chunks: chunkCounts,
  }
  await writeFile(LOOKUP_MANIFEST_OUTPUT, `${JSON.stringify(manifest, null, 2)}\n`)
  if (manifest.entryCount < 100000 || manifest.supplementaryEntryCount < 74000) {
    throw new Error(`大字集不足：${manifest.entryCount} 字、${manifest.supplementaryEntryCount} 個擴充區字元`)
  }
  console.log(`已產生 ${output.characters.length} 字教材、${output.phrases.length} 詞、${output.sentences.length} 句，以及 ${manifest.entryCount} 字查表資料（${lookupChunks.size} 個分塊）。`)
}

await main()

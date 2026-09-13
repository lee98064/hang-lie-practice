# 行列練習所

使用 Vue 3、TypeScript 與 Vite 製作的行列 30 練習網站。提供完整碼逐鍵練習、系統輸入法詞句練習、分級提示、可收合字根表、速度碼與本機複習排程。

## 開發

```bash
npm install
npm run dev
```

常用檢查：

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## 鍵碼資料

教材固定取自 [gontera/array30](https://github.com/gontera/array30) 的 `ar30-regular-v2026-1.06-20260801.cin2`，並使用該專案公開的簡碼與特別碼資料分類。執行 `npm run data:sync` 可重新產生 `src/data/array30.generated.json`；網站執行時不會連線下載資料。

行列輸入法由廖明德先生發明；鍵碼表的維護與授權說明請以來源專案為準。

# 行列練習所

使用 Vue 3、TypeScript 與 Vite 製作的行列 30 練習網站。提供完整碼逐鍵練習、系統輸入法詞句練習、分級提示、可收合字根表、速度碼、本機複習排程，以及可查罕見字的完整字碼查詢。

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

資料固定取自 [gontera/array30](https://github.com/gontera/array30) 的 `ar30-big-v2026-1.06-20260801.cin2`，並使用該專案公開的簡碼與特別碼資料分類。執行 `npm run data:sync` 會重新產生：

- `src/data/array30.generated.json`：596 字的輕量練習教材、90 個詞語與 30 句短句。
- `public/data/lookup/`：依 Unicode 區段拆分的完整查表資料，共 101,999 筆。
- `src/data/lookup-manifest.generated.json`：資料版本、涵蓋數量與分塊索引。

查表涵蓋官方 v2026 大字集內的 101,984 個 Unicode 17 統一表意文字，其中 74,400 個位於基本多文種平面以外。資料在建置時產生，網站執行時只會按需載入本機靜態分塊，不依賴外部 API。

「涵蓋所有中文字」在此指官方大字集所收錄的 Unicode 17 統一表意文字；不包含未定義碼位、異體字選擇序列（IVS）、部首符號或來源表未收錄的相容字。網站附帶的 LXGW WenKai TC 不一定包含所有擴充區字形，罕見字的實際顯示仍取決於瀏覽器或作業系統可用字型，但不影響字碼查詢。

行列輸入法由廖明德先生發明；鍵碼表的維護與授權說明請以來源專案為準。

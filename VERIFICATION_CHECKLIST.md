# 導覽系統修復驗證清單

**分支**: `feat/tour-element-positioning`
**修改日期**: 2026-01-06
**驗證狀態**: ⏳ 待測試

## 驗證環境

- **Frontend Dev Server**: http://localhost:3000
- **Backend Dev Server**: http://localhost:8000
- **瀏覽器**: Chrome/Edge（帶開發者工具）
- **主控台**: 開啟 DevTools → Console 標籤（監控日誌輸出）

---

## 測試 1：同頁面導覽功能（Dashboard 頁面）

### 測試步驟

1. **訪問儀表板**
   - 在瀏覽器中打開 http://localhost:3000/dashboard
   - 確認頁面正常加載

2. **打開幫助中心**
   - 點擊頁面右上角的 **紫色圓形 HelpButton**（帶 `?` 圖標）
   - 應該看到「幫助中心」modal 彈出

3. **驗證過濾邏輯**
   - HelpCenter 中**應該只顯示**「**儀表板導覽**」
   - **不應該**看到「專案工作區導覽」（student-interface）

4. **啟動導覽**
   - 點擊「**儀表板導覽**」
   - 觀察行為：

### 預期結果

| 項目 | 預期行為 | 驗證 |
|------|---------|------|
| **正確過濾** | HelpCenter 中只顯示當前頁面的導覽 | ☐ |
| **Modal 關閉** | 點擊導覽後，modal 應立即關閉 | ☐ |
| **導覽啟動** | 約 300ms 後，導覽應啟動 | ☐ |
| **無頁面導航** | 頁面路由保持 `/dashboard`（同頁面導覽） | ☐ |
| **無警告** | Console 中無相關警告 | ☐ |

### 關鍵日誌檢查

在 DevTools Console 中尋找：

✅ **應該看到這些日誌**：
```
[HelpCenter] Navigating from /dashboard to /student/project
[Tour] ✅ Target found: .student-interface-header
```

❌ **不應該看到這些**：
```
[Tour] ⏳ Retry 1/5: .non-existent-element
[Tour] ⏳ Retry 2/5: .non-existent-element
[Tour] ⏳ Retry 3/5: .non-existent-element
[Tour] ⏳ Retry 4/5: .non-existent-element
[Tour] ❌ Target not found after 5 attempts: .non-existent-element  (重複 5 次)
```

---

## 測試 2：文獻庫頁面導覽

### 測試步驟

1. **訪問文獻庫**
   - 在瀏覽器中打開 http://localhost:3000/literature
   - 確認頁面正常加載

2. **打開幫助中心**
   - 點擊頁面右上角的 **HelpButton**
   - 應該看到「幫助中心」modal

3. **驗證過濾邏輯**
   - HelpCenter 中**應該只顯示**「**文獻導覽**」（literature-upload）
   - **不應該**看到其他導覽（如儀表板導覽、專案工作區導覽等）

4. **啟動導覽**
   - 點擊「**文獻導覽**」
   - 應該在約 300ms 後啟動

### 預期結果

| 項目 | 預期行為 | 驗證 |
|------|---------|------|
| **正確過濾** | 只顯示當前頁面的導覽 | ☐ |
| **導覽啟動** | 約 300ms 後啟動 | ☐ |
| **路由保持** | 頁面路由保持 `/literature` | ☐ |

---

## 測試 3：StudentInterface Navbar 與專案工作區導覽

### 測試步驟 - 進入 StudentInterface

1. **訪問儀表板**
   - 在瀏覽器中打開 http://localhost:3000/dashboard

2. **選擇並進入項目**
   - 在 Dashboard 中找到並點擊某個項目卡片
   - 應自動導航到 `/student/project`（帶有項目 ID 在 store 中）

3. **驗證 Navbar 組件**
   - 頁面頂部應顯示完整的 navigation bar

4. **驗證 HelpCenter 路由過濾**
   - 在 StudentInterface 中點擊 HelpButton
   - 檢查 HelpCenter modal 中顯示的導覽

### 預期結果 - Navbar 組件

| 組件 | 預期行為 | 驗證 |
|------|---------|------|
| **ThesisFlow Logo** | 應在左上角顯示可點擊的 logo | ☐ |
| **HelpButton** | 應在導航欄右側顯示紫色圓形按鈕 | ☐ |
| **用戶頭像/名稱** | 應顯示學生姓名和頭像 | ☐ |
| **登出按鈕** | 應在右側顯示登出圖標按鈕 | ☐ |
| **Logo 可點擊** | 點擊 logo 應返回首頁 | ☐ |
| **HelpButton 可點擊** | 點擊 HelpButton 應打開 HelpCenter modal | ☐ |
| **用戶菜單可點擊** | 點擊用戶頭像應導航到 `/profile` | ☐ |
| **登出可執行** | 點擊登出應清除認證並重定向到 `/login` | ☐ |

### 預期結果 - HelpCenter 路由過濾

| 狀態 | 預期行為 | 驗證 |
|------|---------|------|
| **在 `/student/project`** | HelpCenter 中**只顯示**「專案工作區導覽」 | ☐ |
| **不顯示其他導覽** | 不應看到「儀表板導覽」、「文獻導覽」、「專案導覽」、「群組導覽」 | ☐ |
| **清晰的 UI** | 用戶不會看到不相關的導覽選項 | ☐ |
| **無法從外部進入** | 無法從 Dashboard、Literature 等頁面跨頁面導航進來 | ☐ |

### ⚠️ 重要限制

| 項目 | 說明 | 驗證 |
|------|------|------|
| **無法直接訪問** | 不能直接訪問 `/student/project`（會無數據） | ☐ |
| **需要進入項目** | 必須從 Dashboard 點擊項目卡片進入 | ☐ |
| **只在此頁面顯示** | 「專案工作區導覽」按鈕只在 `/student/project` 顯示 | ☐ |
| **無跨頁面導航** | 無法從其他頁面的 HelpCenter 啟動此導覽 | ☐ |

---

## 測試 4：日誌輸出優化

### 測試步驟

1. **打開 DevTools Console**
   - 開啟 Chrome DevTools（F12）→ Console 標籤

2. **設置日誌篩選**
   - 在 console filter 中輸入 `[Tour]` 只顯示導覽相關日誌

3. **啟動無效目標的導覽**
   - 修改某個導覽配置，使 `target` 指向不存在的元素
   - 啟動該導覽並觀察日誌輸出

### 預期結果

| 階段 | 預期輸出 | 驗證 |
|------|---------|------|
| **重試 1-4** | 應使用 `console.debug()` 級別（預設不顯示） | ☐ |
| **重試 5** | 應出現 1 條 `console.warn()` | ☐ |
| **無重複警告** | **不應**出現 5 條完全相同的警告 | ☐ |
| **有 Hint 信息** | 警告應包含提示「Check if the tour is started on the correct page」| ☐ |

### 日誌示例

✅ **優化後的日誌**：
```
[Tour] ⏳ Retry 5/5: .non-existent-element
[Tour] ❌ Target not found after 5 attempts: .non-existent-element
   Hint: Check if the tour is started on the correct page.
```

❌ **未優化的日誌**（應避免）：
```
[Tour] ⏳ Retry 1/5: .non-existent-element
[Tour] ⏳ Retry 2/5: .non-existent-element
[Tour] ⏳ Retry 3/5: .non-existent-element
[Tour] ⏳ Retry 4/5: .non-existent-element
[Tour] ⏳ Retry 5/5: .non-existent-element
[Tour] ❌ Target not found after 5 attempts: .non-existent-element
```

---

## 測試 5：異常情況

### 5.1 網絡延遲導致頁面加載慢

**測試步驟**：
1. 打開 DevTools → Network 標籤
2. 設置 Network Throttling 為 「Slow 3G」
3. 執行跨頁面導覽（測試 1）

**預期結果**：
- ☐ 導覽應在頁面完全加載後啟動（不失敗）
- ☐ 應能成功找到目標元素（即使加載慢）

### 5.2 用戶快速切換頁面

**測試步驟**：
1. 從 `/dashboard` 開始
2. 點擊 HelpButton → 選擇「專案工作區導覽」
3. 在導航進行中（<1.1s）快速點擊返回按鈕或導航到其他頁面

**預期結果**：
- ☐ 應優雅降級（無控制台錯誤）
- ☐ 不應崩潰或出現視覺故障

### 5.3 導覽循環跳轉

**測試步驟**：
1. 在 StudentInterface 中點擊 HelpButton
2. 選擇「儀表板導覽」（dashboard-intro）
3. 待導覽啟動後，點擊「下一步」直至最後
4. 再從 Dashboard 啟動「專案工作區導覽」

**預期結果**：
- ☐ 導覽應能正常重新啟動
- ☐ 無無限循環或頁面卡頓

---

## 總結表

| 測試 | 描述 | 狀態 |
|------|------|------|
| 測試 1 | 跨頁面導覽功能 | ☐ 通過 / ☐ 失敗 |
| 測試 2 | 同頁面導覽功能 | ☐ 通過 / ☐ 失敗 |
| 測試 3 | StudentInterface Navbar | ☐ 通過 / ☐ 失敗 |
| 測試 4 | 日誌輸出優化 | ☐ 通過 / ☐ 失敗 |
| 測試 5 | 異常情況處理 | ☐ 通過 / ☐ 失敗 |

---

## 故障排查

### 問題：導覽不啟動

**診斷**：
1. 檢查 Console 是否有任何錯誤信息
2. 確認目標元素的 CSS selector 是否正確
3. 檢查 TourOverlay 的 `targetRect` 是否為 `null`

**常見原因**：
- 目標選擇器不存在於 DOM
- 頁面渲染時間過長
- 路由導航未完成

**解決方案**：
```typescript
// 在 TourOverlay.tsx 中增加調試日誌
console.log('[Tour] Debug: Current step target:', step.target);
console.log('[Tour] Debug: Target element found:', !!element);
console.log('[Tour] Debug: Element rect:', element?.getBoundingClientRect());
```

### 問題：Console 仍然顯示 5 條警告

**診斷**：
- 檢查 TourOverlay.tsx 第 93-114 行是否正確實現了日誌優化
- 確認 `import.meta.env.DEV` 為 `true`

**解決方案**：
```bash
# 驗證修改
grep -A 20 "attempts < maxAttempts" frontend/components/tour/TourOverlay.tsx
```

### 問題：StudentInterface 沒有 navbar

**診斷**：
- 檢查 StudentInterface.tsx 的 header 部分是否包含 `<nav>` 元素
- 確認 HelpButton 組件已正確導入

**解決方案**：
```bash
# 檢查 StudentInterface 中的 nav 元素
grep -n "nav className" frontend/components/student/StudentInterface.tsx
```

---

## 下一步

- [ ] 完成所有測試並記錄結果
- [ ] 修復任何找到的問題
- [ ] 將 PR #11 提交審查（如果測試通過）
- [ ] 合併至 main 分支並部署

---

**生成時間**：2026-01-06
**驗證者**：待定
**最後更新**：待定

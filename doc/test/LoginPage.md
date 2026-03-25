# LoginPage 測試案例

## Rendering (渲染測試)
- [x] 應該正確渲染所有登入表單元件（Email、密碼輸入框與登入按鈕）
- [x] 應該渲染測試帳號提示

## Validation (表單驗證)
- [x] 輸入無效的 Email 格式時，應顯示「請輸入有效的 Email 格式」錯誤訊息
- [x] 輸入少於 8 個字元的密碼時，應顯示「密碼必須至少 8 個字元」錯誤訊息
- [x] 輸入未包含英數的密碼時，應顯示「密碼必須包含英文字母和數字」錯誤訊息
- [x] 輸入有效資料後，應清除原有的錯誤訊息

## Authentication & API (身分驗證與 API 互動)
- [x] 成功登入後，應呼叫 login 函式並導向 /dashboard (replace: true)
- [x] API 登入失敗時，應顯示回傳的錯誤訊息或預設錯誤訊息「登入失敗，請稍後再試」
- [x] 登入請求進行中（isLoading 為 true），應顯示載入中狀態並禁用輸入框與按鈕
- [x] 如果存在 authExpiredMessage，應在畫面顯示錯誤訊息並呼叫 clearAuthExpiredMessage
- [x] 若已經 isAuthenticated 為 true，渲染時應直接導向 /dashboard
